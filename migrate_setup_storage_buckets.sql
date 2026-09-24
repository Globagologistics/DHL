-- Run this in the Supabase SQL editor if product image uploads fail.
-- It creates/updates the public storage buckets used by the app and permits uploads.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES
      ('shipment-images', 'shipment-images', true),
      ('driver-images', 'driver-images', true),
      ('route-screenshots', 'route-screenshots', true),
      ('chat-media', 'chat-media', true)
    ON CONFLICT (id) DO UPDATE
      SET public = EXCLUDED.public;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "Public bucket read" ON storage.objects;
    CREATE POLICY "Public bucket read" ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots', 'chat-media'));

    DROP POLICY IF EXISTS "Public bucket insert" ON storage.objects;
    CREATE POLICY "Public bucket insert" ON storage.objects
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots', 'chat-media'));

    DROP POLICY IF EXISTS "Public bucket update" ON storage.objects;
    CREATE POLICY "Public bucket update" ON storage.objects
      FOR UPDATE
      TO anon, authenticated
      USING (bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots', 'chat-media'))
      WITH CHECK (bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots', 'chat-media'));

    DROP POLICY IF EXISTS "Public bucket delete" ON storage.objects;
    CREATE POLICY "Public bucket delete" ON storage.objects
      FOR DELETE
      TO anon, authenticated
      USING (bucket_id IN ('shipment-images', 'driver-images', 'route-screenshots', 'chat-media'));
  END IF;
END $$;
