-- Customer-facing tracking numbers: exactly 12 numeric digits.
-- shipments.id stays the UUID primary key used by checkpoints, chat, storage
-- paths and notifications; tracking_number is the reference customers type.
-- Updating only tracking_number does not change status or payment fields, so
-- the backfill below does not queue customer notifications.

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_number text;

-- Random (not sequential) so numbers cannot be enumerated in order.
-- The first digit is never 0 so the number survives spreadsheets and CSV tools.
-- SECURITY DEFINER so the uniqueness check sees every row regardless of RLS.
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate text;
BEGIN
  LOOP
    v_candidate := (100000000000 + floor(random() * 900000000000))::bigint::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_number = v_candidate);
  END LOOP;
  RETURN v_candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_tracking_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_tracking_number() TO authenticated, service_role;

-- One UPDATE per row so each uniqueness check sees the previous assignments.
DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN SELECT id FROM public.shipments WHERE tracking_number IS NULL LOOP
    UPDATE public.shipments SET tracking_number = public.generate_tracking_number() WHERE id = v_row.id;
  END LOOP;
END;
$$;

ALTER TABLE public.shipments ALTER COLUMN tracking_number SET DEFAULT public.generate_tracking_number();
ALTER TABLE public.shipments ALTER COLUMN tracking_number SET NOT NULL;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_tracking_number_format;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_tracking_number_format CHECK (tracking_number ~ '^[0-9]{12}$');

CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_number_key ON public.shipments(tracking_number);

-- Tracking numbers are assigned by the database, never edited from the browser.
CREATE OR REPLACE FUNCTION public.keep_tracking_number_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.tracking_number IS DISTINCT FROM OLD.tracking_number THEN
    NEW.tracking_number := OLD.tracking_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_tracking_number_immutable_trigger ON public.shipments;
CREATE TRIGGER keep_tracking_number_immutable_trigger
BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.keep_tracking_number_immutable();
