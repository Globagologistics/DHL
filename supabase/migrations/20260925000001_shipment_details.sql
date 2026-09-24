-- Structured shipment details collected by the guided wizard: companies,
-- structured addresses, shipment type, pieces, weight, dimensions and the
-- customer reference. pickup_location and delivery_address keep the composed
-- single-line addresses that tracking, chat and email already display.

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipment_details jsonb;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_details_shape;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_details_shape CHECK (
  shipment_details IS NULL
  OR (jsonb_typeof(shipment_details) = 'object' AND octet_length(shipment_details::text) <= 8192)
);

-- Carry the same details from an approved public request into the shipment.
-- Identical to 20260924000000 except for the shipment_details column.
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
    vehicles_count,vehicle_type,driver_name,driver_experience,countdown_duration,countdown_start_time,status,is_published,current_checkpoint_index,paused,stopped,
    shipment_details
  ) VALUES (
    v_id,auth.uid(),v_request.sender_name,coalesce(v_payload->>'senderPhone',''),coalesce(v_payload->>'senderEmail',''),
    v_request.recipient_name,coalesce(v_payload->>'receiverPhone',''),coalesce(v_payload->>'receiverEmail',''),
    v_request.origin,v_request.destination,'',coalesce(v_payload->>'transportation','Air Freight'),coalesce(v_payload->>'packageName',''),
    ARRAY(SELECT value FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_payload->'images')='array' THEN v_payload->'images' ELSE '[]'::jsonb END) AS value WHERE value ~* '^https?://'),
    coalesce(nullif(v_payload->>'cost','')::numeric,0),coalesce(v_payload->>'paymentStatus','unpaid')='paid',coalesce(v_payload->>'currency','USD'),
    coalesce(v_payload->>'paymentStatus','unpaid'),coalesce(v_payload->>'paymentResponsibility','sender'),
    coalesce(nullif(v_payload->>'vehiclesCount','')::integer,0),v_payload->>'vehicleType',coalesce(v_payload->>'driverName',''),coalesce(v_payload->>'driverExperience',''),
    coalesce(nullif(v_payload->>'countdownDuration','')::integer,24)*3600,now(),'in_transit',false,0,false,false,
    CASE WHEN jsonb_typeof(v_payload->'details')='object' AND octet_length((v_payload->'details')::text) <= 8192 THEN v_payload->'details' ELSE NULL END
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
