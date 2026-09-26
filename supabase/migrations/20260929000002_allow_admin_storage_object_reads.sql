-- Removing a draft image silently did nothing: storage-api deletes with
-- DELETE ... RETURNING, and Postgres needs a SELECT policy to see the row it
-- is deleting. Migration 20260927000002 dropped "Public bucket read" without
-- adding any SELECT policy on storage.objects, so the delete matched zero rows
-- and still returned HTTP 200 with an empty array. Discarded drafts and
-- replaced images therefore left orphaned objects behind.
--
-- The same missing SELECT policy is why an upsert (INSERT ... ON CONFLICT DO
-- UPDATE) is rejected as an RLS violation on these buckets.
--
-- This grants row visibility to administrators only. It exposes nothing new:
-- shipment-images, driver-images and route-screenshots are already public
-- buckets whose bytes are served over the public object route without RLS.
-- chat-media stays private and keeps its participant-scoped SELECT policy.

DROP POLICY IF EXISTS "Admins can read operational media rows" ON storage.objects;
CREATE POLICY "Admins can read operational media rows"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
);
