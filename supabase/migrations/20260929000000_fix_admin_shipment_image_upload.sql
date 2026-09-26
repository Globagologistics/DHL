-- Package image uploads always failed with "new row violates row-level
-- security policy", for admins and for the public request form alike.
--
-- Root cause: the INSERT policies added in 20260927000002 test
--   metadata ->> 'mimetype'  and  metadata ->> 'size'
-- but storage-api evaluates INSERT on storage.objects while reserving the
-- object name, before the file is transferred and before `metadata` is
-- written. `metadata` is therefore NULL at policy-evaluation time, so
--   lower(coalesce(metadata ->> 'mimetype', '')) IN ('image/jpeg', ...)
-- is always false and
--   coalesce(nullif(metadata ->> 'size', '')::bigint, 0) BETWEEN 1 AND ...
-- is always 0. Both conjuncts can never be satisfied, so every upload was
-- rejected regardless of the file.
--
-- Fix: keep content-type and size limits, but enforce them where storage-api
-- can actually apply them — on the bucket — and leave the policies to do what
-- policies can do: decide *who* may write *where*. No bucket becomes
-- anonymously writable: anon may still only write below requests/.

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('shipment-images', 'driver-images', 'route-screenshots');

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
WHERE id = 'chat-media';

-- Administrators keep full write access to operational media buckets.
DROP POLICY IF EXISTS "Admins can upload operational media" ON storage.objects;
CREATE POLICY "Admins can upload operational media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
);

-- Anonymous customers may write only inside requests/, never anywhere else.
DROP POLICY IF EXISTS "Public request images can be uploaded" ON storage.objects;
CREATE POLICY "Public request images can be uploaded"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'shipment-images'
  AND (storage.foldername(name))[1] = 'requests'
);

-- Chat attachments carried the identical impossible predicate.
DROP POLICY IF EXISTS "Chat participants can upload chat media" ON storage.objects;
CREATE POLICY "Chat participants can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  AND public.current_user_can_access_chat((storage.foldername(name))[1]::uuid)
);

-- A draft's images are uploaded before the shipment row exists, so the admin
-- must also be able to replace and tidy up its own objects while the wizard is
-- still open. DELETE already exists (20260928000000); UPDATE covers upsert.
DROP POLICY IF EXISTS "Admins can replace operational media" ON storage.objects;
CREATE POLICY "Admins can replace operational media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
)
WITH CHECK (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
);
