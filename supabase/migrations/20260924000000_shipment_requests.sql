-- Public request intake is separate from published shipments. Apply this
-- migration deliberately; no client-side shortcut can approve a shipment.
CREATE TABLE IF NOT EXISTS public.shipment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name text NOT NULL,
  recipient_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  shipment_id uuid REFERENCES public.shipments(id),
  rejection_reason text,
  CONSTRAINT shipment_requests_payload_size CHECK (octet_length(payload::text) <= 32768),
  CONSTRAINT shipment_requests_pending_unreviewed CHECK (status <> 'pending' OR (reviewed_at IS NULL AND reviewed_by IS NULL AND shipment_id IS NULL))
);
CREATE INDEX IF NOT EXISTS shipment_requests_status_created_idx ON public.shipment_requests(status,created_at DESC);
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipment_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON public.shipment_requests TO authenticated;
DROP POLICY IF EXISTS "Admins can read shipment requests" ON public.shipment_requests;
CREATE POLICY "Admins can read shipment requests" ON public.shipment_requests FOR SELECT TO authenticated USING (public.current_user_is_admin());
DROP POLICY IF EXISTS "Admins can edit pending shipment requests" ON public.shipment_requests;
CREATE POLICY "Admins can edit pending shipment requests" ON public.shipment_requests FOR UPDATE TO authenticated USING (public.current_user_is_admin() AND status='pending') WITH CHECK (public.current_user_is_admin() AND status='pending' AND reviewed_at IS NULL AND shipment_id IS NULL);

CREATE OR REPLACE FUNCTION public.submit_shipment_request(p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR octet_length(p_payload::text) > 32768 THEN
    RAISE EXCEPTION 'Invalid request payload';
  END IF;
  IF length(trim(coalesce(p_payload->>'senderName',''))) NOT BETWEEN 1 AND 160
    OR length(trim(coalesce(p_payload->>'receiverName',''))) NOT BETWEEN 1 AND 160
    OR length(trim(coalesce(p_payload->>'pickupLocation',''))) NOT BETWEEN 1 AND 500
    OR length(trim(coalesce(p_payload->>'deliveryAddress',''))) NOT BETWEEN 1 AND 500
    OR length(trim(coalesce(p_payload->>'senderEmail',''))) NOT BETWEEN 3 AND 254
    OR length(trim(coalesce(p_payload->>'receiverEmail',''))) NOT BETWEEN 3 AND 254
    OR length(trim(coalesce(p_payload->>'packageName',''))) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Required request fields are missing or too long';
  END IF;
  IF jsonb_typeof(p_payload->'images') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_payload->'checkpoints') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_payload->'images') > 6
    OR jsonb_array_length(p_payload->'checkpoints') > 12
    OR p_payload->>'senderEmail' !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_payload->>'receiverEmail' !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid email or shipment details';
  END IF;
  INSERT INTO public.shipment_requests(sender_name,recipient_name,origin,destination,payload)
  VALUES(trim(p_payload->>'senderName'),trim(p_payload->>'receiverName'),trim(p_payload->>'pickupLocation'),trim(p_payload->>'deliveryAddress'),p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_shipment_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_shipment_request(jsonb) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.approve_shipment_request(p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request public.shipment_requests%ROWTYPE; v_id uuid := gen_random_uuid(); v_payload jsonb;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO v_request FROM public.shipment_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  v_payload := v_request.payload;
  IF length(trim(coalesce(v_request.sender_name,'')))=0
    OR length(trim(coalesce(v_request.recipient_name,'')))=0
    OR length(trim(coalesce(v_request.origin,'')))=0
    OR length(trim(coalesce(v_request.destination,'')))=0
    OR length(trim(coalesce(v_payload->>'packageName','')))=0
    OR jsonb_typeof(v_payload->'images') IS DISTINCT FROM 'array'
    OR jsonb_typeof(v_payload->'checkpoints') IS DISTINCT FROM 'array'
    OR jsonb_array_length(v_payload->'images') > 6
    OR jsonb_array_length(v_payload->'checkpoints') > 12 THEN
    RAISE EXCEPTION 'Complete the required shipment details before approval';
  END IF;
  IF length(trim(coalesce(v_payload->>'vehicleType','')))=0 THEN RAISE EXCEPTION 'Vehicle type is required before approval'; END IF;
  INSERT INTO public.shipments (
    id,admin_id,sender_name,sender_phone,sender_email,receiver_name,receiver_phone,receiver_email,
    pickup_location,delivery_address,warehouse,transportation,package_name,images,cost,paid,currency,payment_status,payment_responsibility,
    vehicles_count,vehicle_type,driver_name,driver_experience,countdown_duration,countdown_start_time,status,is_published,current_checkpoint_index,paused,stopped
  ) VALUES (
    v_id,auth.uid(),v_request.sender_name,coalesce(v_payload->>'senderPhone',''),coalesce(v_payload->>'senderEmail',''),
    v_request.recipient_name,coalesce(v_payload->>'receiverPhone',''),coalesce(v_payload->>'receiverEmail',''),
    v_request.origin,v_request.destination,'',coalesce(v_payload->>'transportation','Air Freight'),coalesce(v_payload->>'packageName',''),
    ARRAY(SELECT value FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_payload->'images')='array' THEN v_payload->'images' ELSE '[]'::jsonb END) AS value WHERE value ~* '^https?://'),
    coalesce(nullif(v_payload->>'cost','')::numeric,0),coalesce(v_payload->>'paymentStatus','unpaid')='paid',coalesce(v_payload->>'currency','USD'),
    coalesce(v_payload->>'paymentStatus','unpaid'),coalesce(v_payload->>'paymentResponsibility','sender'),
    coalesce(nullif(v_payload->>'vehiclesCount','')::integer,0),v_payload->>'vehicleType',coalesce(v_payload->>'driverName',''),coalesce(v_payload->>'driverExperience',''),
    coalesce(nullif(v_payload->>'countdownDuration','')::integer,24)*3600,now(),'in_transit',false,0,false,false
  );
  INSERT INTO public.checkpoints(shipment_id,location,checkpoint_order,status)
  SELECT v_id,trim(value),ordinality,'pending' FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_payload->'checkpoints')='array' THEN v_payload->'checkpoints' ELSE '[]'::jsonb END) WITH ORDINALITY AS checkpoint(value,ordinality) WHERE trim(value)<>'';
  UPDATE public.shipments SET is_published=true WHERE id=v_id;
  UPDATE public.shipment_requests SET status='approved',reviewed_at=now(),reviewed_by=auth.uid(),shipment_id=v_id WHERE id=p_request_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_shipment_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_shipment_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_shipment_request(p_request_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.shipment_requests SET status='rejected',reviewed_at=now(),reviewed_by=auth.uid(),rejection_reason=left(trim(coalesce(p_reason,'')),500)
  WHERE id=p_request_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request is not pending'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.reject_shipment_request(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reject_shipment_request(uuid,text) TO authenticated;

-- Let authorized operators inspect the existing status audit trail.
GRANT SELECT ON public.shipment_status_history TO authenticated;
DROP POLICY IF EXISTS "Admins can read shipment status history" ON public.shipment_status_history;
CREATE POLICY "Admins can read shipment status history" ON public.shipment_status_history FOR SELECT TO authenticated USING (public.current_user_is_admin());

-- Earlier migrations added admin RLS for delivery monitoring but did not
-- restore table SELECT after the initial revoke. Keep browser access read-only.
GRANT SELECT ON public.notification_deliveries TO authenticated;
