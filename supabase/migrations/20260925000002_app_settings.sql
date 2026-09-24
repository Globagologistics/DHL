-- Operational settings the administrator edits in Admin > Settings.
-- Only NON-SECRET values live here. SMTP passwords and other credentials are
-- never written to this table; they go to server-only storage (Supabase Vault
-- or equivalent) through an authenticated server function. See
-- docs/phase-2-deployment.md.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY CHECK (key IN ('application', 'whatsapp', 'notification_preferences', 'email')),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT app_settings_value_object CHECK (jsonb_typeof(value) = 'object'),
  CONSTRAINT app_settings_value_size CHECK (octet_length(value::text) <= 16384)
);

-- Visibility is decided by the key, never by the browser, so an admin cannot
-- accidentally publish private configuration.
CREATE OR REPLACE FUNCTION public.apply_app_settings_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.is_public := NEW.key IN ('application', 'whatsapp');
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  -- Defence in depth: refuse anything that looks like a stored credential.
  IF NEW.value ?| ARRAY['password', 'appPassword', 'smtpPassword', 'secret', 'serviceRoleKey', 'apiToken'] THEN
    RAISE EXCEPTION 'Credentials must not be stored in app_settings';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_app_settings_metadata_trigger ON public.app_settings;
CREATE TRIGGER apply_app_settings_metadata_trigger
BEFORE INSERT OR UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.apply_app_settings_metadata();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;

DROP POLICY IF EXISTS "Public settings are readable" ON public.app_settings;
CREATE POLICY "Public settings are readable" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (is_public OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can create settings" ON public.app_settings;
CREATE POLICY "Admins can create settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Empty rows; the application supplies defaults for missing fields.
INSERT INTO public.app_settings (key, value) VALUES
  ('application', '{}'::jsonb),
  ('whatsapp', '{}'::jsonb),
  ('notification_preferences', '{}'::jsonb),
  ('email', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
