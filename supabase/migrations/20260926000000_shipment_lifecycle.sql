-- Shipment lifecycle, simplified creation fields, route data and soft delete.
-- Additive only. Rules mirror src/features/shipments/lifecycle.ts:
--   SCHEDULED -publish-> AWAITING_TAKEOFF -start-> IN_TRANSIT -deliver-> DELIVERED
--   IN_TRANSIT <-> PAUSED, IN_TRANSIT/PAUSED -> STOPPED -restart-> IN_TRANSIT
--   SCHEDULED/AWAITING_TAKEOFF -> CANCELLED;  IN_TRANSIT/PAUSED/STOPPED -> TERMINATED
-- Legacy columns (status, paused, stopped, terminated, reasons, timestamps) are
-- kept in sync so tracking, journey progress and the email triggers keep working.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS lifecycle_state text,
  ADD COLUMN IF NOT EXISTS lifecycle_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS package_value numeric(14,2),
  ADD COLUMN IF NOT EXISTS outstanding_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS carrier_role text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS origin_lat double precision,
  ADD COLUMN IF NOT EXISTS origin_lng double precision,
  ADD COLUMN IF NOT EXISTS destination_lat double precision,
  ADD COLUMN IF NOT EXISTS destination_lng double precision,
  ADD COLUMN IF NOT EXISTS current_lat double precision,
  ADD COLUMN IF NOT EXISTS current_lng double precision,
  ADD COLUMN IF NOT EXISTS origin_location_label text,
  ADD COLUMN IF NOT EXISTS destination_location_label text,
  ADD COLUMN IF NOT EXISTS route_progress numeric(5,2),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_lifecycle_state_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_lifecycle_state_check CHECK (lifecycle_state IS NULL OR lifecycle_state IN (
  'draft', 'pending_review', 'scheduled', 'awaiting_takeoff', 'in_transit', 'paused', 'stopped', 'delivered', 'cancelled', 'terminated'));
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_route_values_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_route_values_check CHECK (
  (origin_lat IS NULL OR origin_lat BETWEEN -90 AND 90) AND (origin_lng IS NULL OR origin_lng BETWEEN -180 AND 180)
  AND (destination_lat IS NULL OR destination_lat BETWEEN -90 AND 90) AND (destination_lng IS NULL OR destination_lng BETWEEN -180 AND 180)
  AND (current_lat IS NULL OR current_lat BETWEEN -90 AND 90) AND (current_lng IS NULL OR current_lng BETWEEN -180 AND 180)
  AND (route_progress IS NULL OR route_progress BETWEEN 0 AND 100)
  AND (package_value IS NULL OR package_value >= 0) AND (outstanding_amount IS NULL OR outstanding_amount >= 0)
  AND jsonb_typeof(lifecycle_events) = 'array');

-- Lifecycle for existing rows, derived exactly like deriveLifecycleState().
CREATE OR REPLACE FUNCTION public.derive_lifecycle_state(s public.shipments)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN s.lifecycle_state IS NOT NULL THEN s.lifecycle_state
    WHEN s.terminated THEN 'terminated'
    WHEN s.status = 'cancelled' THEN 'cancelled'
    WHEN s.status = 'delivered' THEN 'delivered'
    WHEN s.stopped OR s.status IN ('stopped', 'on_hold') THEN 'stopped'
    WHEN s.paused OR s.status = 'paused' THEN 'paused'
    WHEN NOT coalesce(s.is_published, false) THEN 'scheduled'
    WHEN s.status IN ('processing', 'pickup_scheduled') THEN 'awaiting_takeoff'
    ELSE 'in_transit'
  END;
$$;

UPDATE public.shipments s SET lifecycle_state = public.derive_lifecycle_state(s) WHERE lifecycle_state IS NULL;

CREATE INDEX IF NOT EXISTS shipments_lifecycle_state_idx ON public.shipments(lifecycle_state) WHERE deleted_at IS NULL;

-- Soft-deleted shipments disappear from public tracking; admins keep access for audit.
DROP POLICY IF EXISTS "Hide soft-deleted shipments" ON public.shipments;
CREATE POLICY "Hide soft-deleted shipments" ON public.shipments AS RESTRICTIVE
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL OR public.current_user_is_admin());

CREATE OR REPLACE FUNCTION public.shipment_event(p_kind text, p_title text, p_detail text DEFAULT NULL, p_location text DEFAULT NULL, p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL)
RETURNS jsonb LANGUAGE sql VOLATILE SET search_path = '' AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object('id', gen_random_uuid(), 'kind', p_kind, 'title', p_title, 'detail', nullif(trim(p_detail), ''),
    'location', nullif(trim(p_location), ''), 'lat', p_lat, 'lng', p_lng, 'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
$$;

-- Publish: server-generated 12-digit tracking number, AWAITING_TAKEOFF.
-- is_published false→true fires the existing shipment_published notification.
CREATE OR REPLACE FUNCTION public.publish_shipment(p_shipment_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v public.shipments%ROWTYPE; v_state text; v_number text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.shipments WHERE id = p_shipment_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found' USING ERRCODE = 'P0001'; END IF;
  v_state := public.derive_lifecycle_state(v);
  IF v_state NOT IN ('draft', 'scheduled') THEN RAISE EXCEPTION 'This shipment is already published.' USING ERRCODE = 'P0001'; END IF;
  v_number := coalesce(v.tracking_number, public.generate_tracking_number());
  UPDATE public.shipments SET
    tracking_number = v_number, lifecycle_state = 'awaiting_takeoff', is_published = true, published_at = now(), status = 'pickup_scheduled',
    lifecycle_events = lifecycle_events || jsonb_build_array(public.shipment_event('published', 'Shipment information received'))
  WHERE id = p_shipment_id;
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_shipment(p_shipment_id uuid, p_action text, p_reason text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v public.shipments%ROWTYPE; v_state text; v_to text; v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_now timestamptz := now(); v_held interval; v_title text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.shipments WHERE id = p_shipment_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found' USING ERRCODE = 'P0001'; END IF;
  v_state := public.derive_lifecycle_state(v);
  v_to := CASE
    WHEN p_action = 'start' AND v_state = 'awaiting_takeoff' THEN 'in_transit'
    WHEN p_action = 'pause' AND v_state = 'in_transit' THEN 'paused'
    WHEN p_action = 'resume' AND v_state = 'paused' THEN 'in_transit'
    WHEN p_action = 'stop' AND v_state IN ('in_transit', 'paused') THEN 'stopped'
    WHEN p_action = 'restart' AND v_state = 'stopped' THEN 'in_transit'
    WHEN p_action = 'deliver' AND v_state = 'in_transit' THEN 'delivered'
    WHEN p_action = 'cancel' AND v_state IN ('draft', 'scheduled', 'awaiting_takeoff') THEN 'cancelled'
    WHEN p_action = 'terminate' AND v_state IN ('in_transit', 'paused', 'stopped') THEN 'terminated'
  END;
  IF v_to IS NULL THEN RAISE EXCEPTION 'That action is not available while the shipment is %.', replace(v_state, '_', ' ') USING ERRCODE = 'P0001'; END IF;
  IF p_action IN ('pause', 'stop', 'cancel', 'terminate') AND v_reason IS NULL THEN RAISE EXCEPTION 'Enter a reason. Customers will see it.' USING ERRCODE = 'P0001'; END IF;
  IF length(coalesce(v_reason, '')) > 300 THEN RAISE EXCEPTION 'Keep the reason under 300 characters.' USING ERRCODE = 'P0001'; END IF;

  CASE p_action
    WHEN 'start' THEN
      v_title := CASE WHEN v.transportation ILIKE '%air%' THEN 'Shipment departed origin airport' WHEN v.transportation ILIKE ANY (ARRAY['%sea%', '%ocean%']) THEN 'Shipment departed origin port' ELSE 'Shipment departed origin facility' END;
      UPDATE public.shipments SET started_at = v_now, countdown_start_time = v_now, status = 'in_transit',
        countdown_duration = greatest(3600, coalesce(extract(epoch FROM (estimated_delivery_at - v_now))::integer, 86400))
      WHERE id = p_shipment_id;
    WHEN 'pause' THEN
      v_title := 'Shipment temporarily paused';
      UPDATE public.shipments SET paused = true, pause_timestamp = v_now, customer_status_reason = v_reason WHERE id = p_shipment_id;
    WHEN 'resume' THEN
      v_title := 'Shipment resumed';
      v_held := greatest(interval '0', v_now - coalesce(v.pause_timestamp, v_now));
      UPDATE public.shipments SET paused = false, pause_timestamp = NULL, customer_status_reason = NULL, countdown_start_time = countdown_start_time + v_held WHERE id = p_shipment_id;
    WHEN 'stop' THEN
      v_title := 'Shipment stopped';
      v_held := CASE WHEN v.paused THEN greatest(interval '0', v_now - coalesce(v.pause_timestamp, v_now)) ELSE interval '0' END;
      UPDATE public.shipments SET paused = false, pause_timestamp = NULL, countdown_start_time = countdown_start_time + v_held,
        stopped = true, stop_timestamp = v_now, stop_reason = v_reason, customer_status_reason = v_reason WHERE id = p_shipment_id;
    WHEN 'restart' THEN
      v_title := 'Shipment restarted';
      v_held := greatest(interval '0', v_now - coalesce(v.stop_timestamp, v_now));
      UPDATE public.shipments SET stopped = false, stop_timestamp = NULL, stop_reason = NULL, customer_status_reason = NULL, countdown_start_time = countdown_start_time + v_held WHERE id = p_shipment_id;
    WHEN 'deliver' THEN
      v_title := 'Shipment delivered';
      UPDATE public.shipments SET status = 'delivered', delivered_at = v_now WHERE id = p_shipment_id;
    WHEN 'cancel' THEN
      v_title := 'Shipment cancelled';
      UPDATE public.shipments SET status = 'cancelled', cancelled_at = v_now, customer_status_reason = v_reason WHERE id = p_shipment_id;
    WHEN 'terminate' THEN
      v_title := 'Shipment terminated';
      UPDATE public.shipments SET terminated = true, terminate_timestamp = v_now, stopped = true, customer_status_reason = v_reason WHERE id = p_shipment_id;
  END CASE;

  UPDATE public.shipments SET lifecycle_state = v_to,
    lifecycle_events = lifecycle_events || jsonb_build_array(public.shipment_event(CASE p_action WHEN 'start' THEN 'started' WHEN 'pause' THEN 'paused' WHEN 'resume' THEN 'resumed' WHEN 'stop' THEN 'stopped' WHEN 'restart' THEN 'restarted' WHEN 'deliver' THEN 'delivered' WHEN 'cancel' THEN 'cancelled' ELSE 'terminated' END, v_title, v_reason))
  WHERE id = p_shipment_id;
  RETURN v_to;
END;
$$;

-- Customer-visible tracking update; with coordinates it becomes a route checkpoint.
CREATE OR REPLACE FUNCTION public.add_shipment_update(p_shipment_id uuid, p_title text, p_location text DEFAULT NULL, p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v public.shipments%ROWTYPE; v_state text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF length(trim(coalesce(p_title, ''))) NOT BETWEEN 1 AND 140 THEN RAISE EXCEPTION 'Enter an update of up to 140 characters.' USING ERRCODE = 'P0001'; END IF;
  IF (p_lat IS NULL) <> (p_lng IS NULL) OR p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'Invalid checkpoint location.' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO v FROM public.shipments WHERE id = p_shipment_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found' USING ERRCODE = 'P0001'; END IF;
  v_state := public.derive_lifecycle_state(v);
  IF v_state IN ('draft', 'scheduled', 'delivered', 'cancelled', 'terminated') THEN RAISE EXCEPTION 'Updates can be posted while a shipment is published and not finished.' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.shipments SET lifecycle_events = lifecycle_events || jsonb_build_array(public.shipment_event('update', trim(p_title), NULL, left(p_location, 120), p_lat, p_lng)) WHERE id = p_shipment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_shipment(p_shipment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v public.shipments%ROWTYPE;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.shipments WHERE id = p_shipment_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found' USING ERRCODE = 'P0001'; END IF;
  IF public.derive_lifecycle_state(v) IN ('in_transit', 'paused', 'stopped') THEN RAISE EXCEPTION 'Active shipments cannot be deleted. Stop or terminate them first.' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.shipments SET deleted_at = now() WHERE id = p_shipment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_shipment(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transition_shipment(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_shipment_update(uuid, text, text, double precision, double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.soft_delete_shipment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_shipment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_shipment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_shipment_update(uuid, text, text, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_shipment(uuid) TO authenticated;

-- Public requests: sender email is no longer collected; 1–3 photo URLs.
CREATE OR REPLACE FUNCTION public.submit_shipment_request(p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR octet_length(p_payload::text) > 32768 THEN RAISE EXCEPTION 'Invalid request payload'; END IF;
  IF length(trim(coalesce(p_payload->>'senderName', ''))) NOT BETWEEN 1 AND 160
    OR length(trim(coalesce(p_payload->>'receiverName', ''))) NOT BETWEEN 1 AND 160
    OR length(trim(coalesce(p_payload->>'pickupLocation', ''))) NOT BETWEEN 1 AND 500
    OR length(trim(coalesce(p_payload->>'deliveryAddress', ''))) NOT BETWEEN 1 AND 500
    OR length(trim(coalesce(p_payload->>'receiverPhone', ''))) NOT BETWEEN 6 AND 40
    OR length(trim(coalesce(p_payload->>'packageName', ''))) NOT BETWEEN 1 AND 500
    OR coalesce(p_payload->>'receiverEmail', '') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR jsonb_typeof(p_payload->'images') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_payload->'images') NOT BETWEEN 1 AND 3 THEN
    RAISE EXCEPTION 'Required request fields are missing or invalid';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(p_payload->'images') AS image WHERE image !~* '^https://') THEN RAISE EXCEPTION 'Invalid image link'; END IF;
  INSERT INTO public.shipment_requests(sender_name, recipient_name, origin, destination, payload)
  VALUES (trim(p_payload->>'senderName'), trim(p_payload->>'receiverName'), trim(p_payload->>'pickupLocation'), trim(p_payload->>'deliveryAddress'), p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_shipment_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_shipment_request(jsonb) TO anon, authenticated;

-- Approval creates a SCHEDULED shipment (not published, no tracking number).
-- The admin publishes and starts it from the control panel.
CREATE OR REPLACE FUNCTION public.approve_shipment_request(p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r public.shipment_requests%ROWTYPE; p jsonb; v_id uuid := gen_random_uuid(); v_eta timestamptz; v_payment text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.shipment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending' USING ERRCODE = 'P0001'; END IF;
  p := r.payload;
  v_eta := nullif(p->>'estimatedDeliveryAt', '')::timestamptz;
  IF v_eta IS NULL OR v_eta <= now() THEN RAISE EXCEPTION 'Set an estimated delivery in the future before approving.' USING ERRCODE = 'P0001'; END IF;
  v_payment := coalesce(nullif(p->>'paymentStatus', ''), 'unpaid');
  IF v_payment NOT IN ('paid', 'unpaid', 'pending') THEN RAISE EXCEPTION 'Invalid payment status' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.shipments (
    id, admin_id, sender_name, sender_phone, sender_email, receiver_name, receiver_phone, receiver_email, pickup_location, delivery_address, warehouse,
    package_name, package_value, currency, payment_status, paid, outstanding_amount, images, estimated_delivery_at, transportation, carrier_role, driver_name,
    origin_lat, origin_lng, destination_lat, destination_lng, origin_location_label, destination_location_label,
    lifecycle_state, lifecycle_events, status, is_published, current_checkpoint_index, paused, stopped
  ) VALUES (
    v_id, auth.uid(), r.sender_name, coalesce(p->>'senderPhone', ''), '', r.recipient_name, coalesce(p->>'receiverPhone', ''), coalesce(p->>'receiverEmail', ''), r.origin, r.destination, '',
    coalesce(p->>'packageName', ''), nullif(p->>'packageValue', '')::numeric, coalesce(nullif(p->>'currency', ''), 'USD'), v_payment, v_payment = 'paid',
    CASE WHEN v_payment = 'pending' THEN nullif(p->>'outstandingAmount', '')::numeric END,
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p->'images', '[]'::jsonb)) AS value WHERE value ~* '^https://'),
    v_eta, coalesce(nullif(p->>'transportation', ''), 'Air Freight'), nullif(p->>'carrierRole', ''), coalesce(p->>'carrierName', ''),
    (p#>>'{route,origin,lat}')::double precision, (p#>>'{route,origin,lng}')::double precision,
    (p#>>'{route,destination,lat}')::double precision, (p#>>'{route,destination,lng}')::double precision,
    coalesce(p#>>'{route,origin,detail}', p#>>'{route,origin,label}'), coalesce(p#>>'{route,destination,detail}', p#>>'{route,destination,label}'),
    'scheduled', jsonb_build_array(public.shipment_event('created', 'Shipment created from customer request')), 'processing', false, 0, false, false
  );
  UPDATE public.shipment_requests SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), shipment_id = v_id WHERE id = p_request_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_shipment_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_shipment_request(uuid) TO authenticated;
