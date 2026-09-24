-- Replace the development-only public chat policies with authenticated,
-- shipment-participant policies. This does not make the public tracking page
-- private; it only protects chat threads and messages.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND user_type = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_access_chat(p_shipment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      public.current_user_is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.shipments AS shipment
        WHERE shipment.id = p_shipment_id
          AND nullif(lower(auth.jwt() ->> 'email'), '') IS NOT NULL
          AND nullif(lower(auth.jwt() ->> 'email'), '') IN (
            nullif(lower(shipment.sender_email), ''),
            nullif(lower(shipment.receiver_email), '')
          )
      )
    );
$$;

-- Create the app profile as part of a real Auth signup. `user_type` defaults
-- to sender; operations staff must be promoted to `admin` server-side.
CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'sender',
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_profile_on_auth_user ON auth.users;
CREATE TRIGGER create_profile_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

DROP POLICY IF EXISTS "Allow chat thread read" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat thread write" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat thread update" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat message read" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow chat message write" ON public.chat_messages;

CREATE POLICY "Authenticated shipment parties can read chat threads"
ON public.chat_threads FOR SELECT TO authenticated
USING (public.current_user_can_access_chat(tracking_id));

CREATE POLICY "Authenticated shipment parties can create chat threads"
ON public.chat_threads FOR INSERT TO authenticated
WITH CHECK (public.current_user_can_access_chat(tracking_id));

CREATE POLICY "Authenticated shipment parties can update their chat threads"
ON public.chat_threads FOR UPDATE TO authenticated
USING (public.current_user_can_access_chat(tracking_id))
WITH CHECK (public.current_user_can_access_chat(tracking_id));

CREATE POLICY "Authenticated shipment parties can read messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.current_user_can_access_chat(tracking_id));

CREATE POLICY "Authenticated shipment parties can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_can_access_chat(tracking_id)
  AND (
    (public.current_user_is_admin() AND sender_role = 'admin')
    OR (NOT public.current_user_is_admin() AND sender_role = 'user')
  )
);

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_can_access_chat(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_can_access_chat(UUID) TO authenticated, service_role;
