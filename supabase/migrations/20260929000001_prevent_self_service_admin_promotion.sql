-- Privilege escalation: "Users can insert themselves" (20260812000000) allowed
-- ANY authenticated user to insert their own public.users row with
-- user_type = 'admin', and "Users can update their own data" allowed the same
-- through UPDATE. Because public.current_user_is_admin() trusts that column,
-- anyone able to sign up could grant themselves full administrator rights.
--
-- A normal signup does not need either route: the SECURITY DEFINER trigger
-- public.create_profile_for_auth_user() (20260813000001) already creates the
-- profile with user_type = 'sender'. The self-service policies are therefore
-- narrowed to non-admin values only.
--
-- Administrator promotion is from now on a deliberate owner action performed
-- with the service role (SQL editor or a trusted server function), never
-- something an account can do to itself. Existing administrator rows are not
-- touched by this migration and keep working unchanged.

-- Reads the caller's stored role without re-entering the policies below.
CREATE OR REPLACE FUNCTION public.current_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_type() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_type() TO authenticated;

-- INSERT: only your own row, and never as an administrator.
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own non-admin profile" ON public.users;
CREATE POLICY "Users can insert their own non-admin profile"
ON public.users FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = id
  AND user_type IN ('sender', 'receiver')
);

-- UPDATE: your own row, and user_type must stay exactly as stored. This blocks
-- self-promotion to admin and also stops an admin silently demoting itself
-- through the browser client.
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND user_type IS NOT DISTINCT FROM public.current_user_type()
);
