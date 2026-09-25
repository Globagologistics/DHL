-- Admin uploads are transactional from the application's point of view: if a
-- later image fails, the client may remove only the freshly uploaded objects.
-- Public request uploads intentionally do not receive delete permission.
DROP POLICY IF EXISTS "Admins can delete operational media" ON storage.objects;
CREATE POLICY "Admins can delete operational media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots')
  AND public.current_user_is_admin()
);
