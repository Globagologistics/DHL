-- Permanent, synthetic portfolio shipment. This migration never creates an
-- administrator: it reuses the first real admin profile when one exists.
-- If the owner has not provisioned an admin yet, it safely waits until the
-- deployment checklist's explicit admin-provisioning step is complete.

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS shipments_demo_tracking_idx ON public.shipments (tracking_number) WHERE is_demo;

DO $$
DECLARE
  v_admin uuid;
  v_shipment uuid;
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_admin
  FROM public.users
  WHERE user_type = 'admin'
    AND id <> '00000000-0000-0000-0000-000000000000'::uuid
  ORDER BY created_at NULLS LAST, id
  LIMIT 1;

  -- No fake/default account is created. Rerun after a real admin exists.
  IF v_admin IS NULL THEN RETURN; END IF;

  SELECT id INTO v_shipment FROM public.shipments WHERE tracking_number = '010101010101' LIMIT 1;
  IF v_shipment IS NULL THEN
    INSERT INTO public.shipments (
      admin_id, sender_name, sender_phone, sender_email, receiver_name, receiver_phone, receiver_email,
      pickup_location, delivery_address, transportation, package_name, images, cost, paid,
      status, is_published, published_at, tracking_number, is_demo,
      lifecycle_state, lifecycle_events, currency, payment_status, payment_responsibility,
      estimated_delivery_at, origin_lat, origin_lng, destination_lat, destination_lng,
      origin_location_label, destination_location_label, current_checkpoint_index
    ) VALUES (
      v_admin, 'Olivia Reed', '+1 212 555 0132', 'olivia.reed@example.invalid', 'Daniel Carter', '+1 213 555 0148', 'daniel.carter@example.invalid',
      'New York City, New York, United States', 'Los Angeles, California, United States', 'Air Freight', 'Portfolio demonstration package',
      ARRAY[]::text[], 0, true, 'in_transit', true, v_now - interval '1 day', '010101010101', true,
      'in_transit', jsonb_build_array(jsonb_build_object('kind','created','title','Synthetic portfolio shipment created','at',v_now - interval '2 days')),
      'USD', 'paid', 'sender', v_now + interval '1 day',
      40.714, -74.006, 34.052, -118.244,
      'New York City, New York, United States', 'Los Angeles, California, United States', 2
    ) RETURNING id INTO v_shipment;

    INSERT INTO public.checkpoints (shipment_id, location, checkpoint_order, status, created_at, updated_at)
    VALUES
      (v_shipment, 'New York, NY · Processed at origin facility', 1, 'completed', v_now - interval '30 hours', v_now - interval '30 hours'),
      (v_shipment, 'Louisville, KY · Arrived at transit hub', 2, 'completed', v_now - interval '14 hours', v_now - interval '14 hours'),
      (v_shipment, 'Los Angeles, CA · Processed at destination facility', 3, 'current', v_now - interval '3 hours', v_now - interval '3 hours'),
      (v_shipment, 'Los Angeles, CA · Out for delivery', 4, 'pending', v_now + interval '6 hours', v_now + interval '6 hours');
  ELSE
    UPDATE public.shipments SET is_demo = true WHERE id = v_shipment;
  END IF;
END $$;

COMMENT ON COLUMN public.shipments.is_demo IS 'Synthetic portfolio data: external customer delivery must be suppressed.';
