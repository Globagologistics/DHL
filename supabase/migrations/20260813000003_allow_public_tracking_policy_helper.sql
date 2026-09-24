-- The public shipment/checkpoint SELECT policies call this boolean helper to
-- distinguish admins from ordinary visitors.  anon needs EXECUTE permission
-- for the policy expression itself; the function exposes no row data and
-- returns only whether the current JWT belongs to an approved admin.
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon;
