-- Buske Logistics Supabase Schema (Full)
-- Safe to run multiple times.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT auth.uid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'sender', 'receiver')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Default admin for development/demo
INSERT INTO public.users (id, email, user_type, full_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@buske.local', 'admin', 'Default Admin')
ON CONFLICT (id) DO NOTHING;

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id),
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_email TEXT,
  pickup_location TEXT,
  delivery_address TEXT NOT NULL,
  warehouse TEXT,
  transportation TEXT NOT NULL,
  package_name TEXT,
  images TEXT[] DEFAULT '{}',
  cost NUMERIC(10, 2),
  paid BOOLEAN DEFAULT FALSE,
  vehicles_count INT,
  vehicle_type TEXT,
  driver_name TEXT,
  driver_experience TEXT,
  driver_image_url TEXT,
  route_screenshot_url TEXT,
  countdown_duration INT, -- seconds
  countdown_start_time TIMESTAMP WITH TIME ZONE,
  paused BOOLEAN DEFAULT FALSE,
  pause_timestamp TIMESTAMP WITH TIME ZONE,
  stopped BOOLEAN DEFAULT FALSE,
  stop_reason TEXT,
  stop_timestamp TIMESTAMP WITH TIME ZONE,
  terminated BOOLEAN DEFAULT FALSE,
  terminate_timestamp TIMESTAMP WITH TIME ZONE,
  progress_bar_paused BOOLEAN DEFAULT FALSE,
  current_checkpoint_index INT DEFAULT 0,
  status TEXT DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'paused', 'stopped', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoints
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  checkpoint_order INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Threads
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  last_message_sender TEXT CHECK (last_message_sender IN ('user', 'admin')),
  unread_for_admin INT DEFAULT 0,
  unread_for_user INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_tracking_id ON public.chat_threads(tracking_id);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  tracking_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  sender_name TEXT,
  sender_avatar_url TEXT,
  text TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  animate_typing BOOLEAN DEFAULT FALSE,
  typing_speed_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chat_message_has_content CHECK (
    (text IS NOT NULL AND length(trim(text)) > 0)
    OR (media IS NOT NULL AND jsonb_array_length(media) > 0)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_admin_id ON public.shipments(admin_id);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_email ON public.shipments(sender_email);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_email ON public.shipments(receiver_email);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_checkpoints_shipment_id ON public.checkpoints(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tracking_id ON public.chat_messages(tracking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id, created_at);

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure terminated shipments are stopped
CREATE OR REPLACE FUNCTION public.enforce_terminated_stopped()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.terminated THEN
    NEW.stopped := TRUE;
    IF NEW.stop_timestamp IS NULL THEN
      NEW.stop_timestamp := NOW();
    END IF;
    IF NEW.status IS NULL OR NEW.status <> 'stopped' THEN
      NEW.status := 'stopped';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Chat thread updater on new message
CREATE OR REPLACE FUNCTION public.update_chat_thread_on_message()
RETURNS TRIGGER AS $$
DECLARE
  preview TEXT;
BEGIN
  IF NEW.text IS NOT NULL AND length(trim(NEW.text)) > 0 THEN
    preview := left(trim(NEW.text), 160);
  ELSIF NEW.media IS NOT NULL AND jsonb_array_length(NEW.media) > 0 THEN
    preview := 'Media attachment';
  ELSE
    preview := NULL;
  END IF;

  UPDATE public.chat_threads
  SET updated_at = NOW(),
      last_message_at = NEW.created_at,
      last_message_sender = NEW.sender_role,
      last_message_preview = preview,
      unread_for_admin = CASE WHEN NEW.sender_role = 'user' THEN unread_for_admin + 1 ELSE unread_for_admin END,
      unread_for_user = CASE WHEN NEW.sender_role = 'admin' THEN unread_for_user + 1 ELSE unread_for_user END
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_shipments_updated_at ON public.shipments;
CREATE TRIGGER set_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_checkpoints_updated_at ON public.checkpoints;
CREATE TRIGGER set_checkpoints_updated_at
BEFORE UPDATE ON public.checkpoints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_chat_threads_updated_at ON public.chat_threads;
CREATE TRIGGER set_chat_threads_updated_at
BEFORE UPDATE ON public.chat_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS enforce_terminated_stopped_trigger ON public.shipments;
CREATE TRIGGER enforce_terminated_stopped_trigger
BEFORE INSERT OR UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.enforce_terminated_stopped();

DROP TRIGGER IF EXISTS chat_message_insert_trigger ON public.chat_messages;
CREATE TRIGGER chat_message_insert_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_chat_thread_on_message();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies (basic)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
CREATE POLICY "Users can insert themselves" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Permissive shipment policies for development (tighten for production)
DROP POLICY IF EXISTS "Allow shipment creation" ON public.shipments;
CREATE POLICY "Allow shipment creation" ON public.shipments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow shipment viewing" ON public.shipments;
CREATE POLICY "Allow shipment viewing" ON public.shipments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow shipment updates" ON public.shipments;
CREATE POLICY "Allow shipment updates" ON public.shipments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow shipment deletion" ON public.shipments;
CREATE POLICY "Allow shipment deletion" ON public.shipments
  FOR DELETE USING (true);

-- Checkpoints policies
DROP POLICY IF EXISTS "Allow checkpoint viewing" ON public.checkpoints;
CREATE POLICY "Allow checkpoint viewing" ON public.checkpoints
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow checkpoint creation" ON public.checkpoints;
CREATE POLICY "Allow checkpoint creation" ON public.checkpoints
  FOR INSERT WITH CHECK (true);

-- Chat policies (permissive for now)
DROP POLICY IF EXISTS "Allow chat thread read" ON public.chat_threads;
CREATE POLICY "Allow chat thread read" ON public.chat_threads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow chat thread write" ON public.chat_threads;
CREATE POLICY "Allow chat thread write" ON public.chat_threads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow chat thread update" ON public.chat_threads;
CREATE POLICY "Allow chat thread update" ON public.chat_threads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow chat message read" ON public.chat_messages;
CREATE POLICY "Allow chat message read" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow chat message write" ON public.chat_messages;
CREATE POLICY "Allow chat message write" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Storage buckets + policies (guarded)
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
    -- Storage policies (public buckets for development)
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

-- Realtime publication (safe add)
DO $$
DECLARE
  t TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['shipments', 'checkpoints', 'chat_threads', 'chat_messages'] LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime'
          AND n.nspname = 'public'
          AND c.relname = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

-- Replica identity for full change payloads
ALTER TABLE public.shipments REPLICA IDENTITY FULL;
ALTER TABLE public.checkpoints REPLICA IDENTITY FULL;
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
