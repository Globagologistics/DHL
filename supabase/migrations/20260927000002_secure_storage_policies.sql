-- Storage is public only where assets are deliberately customer-visible.
-- Uploads are never generally available to anon/authenticated roles.

INSERT INTO storage.buckets (id, name, public) VALUES
  ('shipment-images', 'shipment-images', true),
  ('driver-images', 'driver-images', true),
  ('route-screenshots', 'route-screenshots', true),
  ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public bucket read" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket insert" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket update" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload operational media" ON storage.objects;
DROP POLICY IF EXISTS "Public request images can be uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Chat participants can read chat media" ON storage.objects;
DROP POLICY IF EXISTS "Chat participants can upload chat media" ON storage.objects;

CREATE POLICY "Admins can upload operational media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
  AND lower(coalesce(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND coalesce(nullif(metadata ->> 'size', '')::bigint, 0) BETWEEN 1 AND 10485760
);

CREATE POLICY "Public request images can be uploaded"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'shipment-images'
  AND (storage.foldername(name))[1] = 'requests'
  AND lower(coalesce(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp')
  AND coalesce(nullif(metadata ->> 'size', '')::bigint, 0) BETWEEN 1 AND 10485760
);

-- Private chat attachments are stored below <shipment-uuid>/ and are readable
-- only by the admin or authenticated shipment participant.
CREATE POLICY "Chat participants can read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  AND public.current_user_can_access_chat((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Chat participants can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
  AND public.current_user_can_access_chat((storage.foldername(name))[1]::uuid)
  AND lower(coalesce(metadata ->> 'mimetype', '')) IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm')
  AND coalesce(nullif(metadata ->> 'size', '')::bigint, 0) BETWEEN 1 AND 10485760
);
