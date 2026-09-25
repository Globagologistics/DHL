-- Clean baseline for a new Supabase project.  This is the only foundational
-- schema source; later migrations add workflow features and tighten policies.
-- It deliberately contains no synthetic administrator or development data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('admin', 'sender', 'receiver')),
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users(id),
  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  sender_email text,
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  receiver_email text,
  pickup_location text,
  delivery_address text NOT NULL,
  warehouse text,
  transportation text NOT NULL,
  package_name text,
  images text[] NOT NULL DEFAULT '{}',
  cost numeric(10,2),
  paid boolean NOT NULL DEFAULT false,
  vehicles_count integer,
  vehicle_type text,
  driver_name text,
  driver_experience text,
  driver_image_url text,
  route_screenshot_url text,
  countdown_duration integer,
  countdown_start_time timestamptz,
  paused boolean NOT NULL DEFAULT false,
  pause_timestamp timestamptz,
  stopped boolean NOT NULL DEFAULT false,
  stop_reason text,
  stop_timestamp timestamptz,
  terminated boolean NOT NULL DEFAULT false,
  terminate_timestamp timestamptz,
  progress_bar_paused boolean NOT NULL DEFAULT false,
  current_checkpoint_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'paused', 'stopped', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  location text NOT NULL,
  checkpoint_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender text CHECK (last_message_sender IN ('user', 'admin')),
  unread_for_admin integer NOT NULL DEFAULT 0,
  unread_for_user integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_chat_threads_tracking_id ON public.chat_threads(tracking_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  tracking_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin')),
  sender_name text,
  sender_avatar_url text,
  text text,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  animate_typing boolean NOT NULL DEFAULT false,
  typing_speed_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_message_has_content CHECK (
    (text IS NOT NULL AND length(trim(text)) > 0)
    OR jsonb_array_length(media) > 0
  )
);

CREATE INDEX idx_shipments_admin_id ON public.shipments(admin_id);
CREATE INDEX idx_shipments_sender_email ON public.shipments(sender_email);
CREATE INDEX idx_shipments_receiver_email ON public.shipments(receiver_email);
CREATE INDEX idx_shipments_created_at ON public.shipments(created_at);
CREATE INDEX idx_checkpoints_shipment_id ON public.checkpoints(shipment_id);
CREATE INDEX idx_chat_messages_tracking_id ON public.chat_messages(tracking_id, created_at);
CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages(thread_id, created_at);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_terminated_stopped()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.terminated THEN
    NEW.stopped := true;
    NEW.stop_timestamp := coalesce(NEW.stop_timestamp, now());
    NEW.status := 'stopped';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chat_thread_on_message()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE preview text;
BEGIN
  preview := CASE
    WHEN NEW.text IS NOT NULL AND length(trim(NEW.text)) > 0 THEN left(trim(NEW.text), 160)
    WHEN jsonb_array_length(NEW.media) > 0 THEN 'Media attachment'
  END;
  UPDATE public.chat_threads
  SET updated_at = now(), last_message_at = NEW.created_at,
      last_message_sender = NEW.sender_role, last_message_preview = preview,
      unread_for_admin = CASE WHEN NEW.sender_role = 'user' THEN unread_for_admin + 1 ELSE unread_for_admin END,
      unread_for_user = CASE WHEN NEW.sender_role = 'admin' THEN unread_for_user + 1 ELSE unread_for_user END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_checkpoints_updated_at BEFORE UPDATE ON public.checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_chat_threads_updated_at BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER enforce_terminated_stopped_trigger BEFORE INSERT OR UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_terminated_stopped();
CREATE TRIGGER chat_message_insert_trigger AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_thread_on_message();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- The initial baseline grants no browser access.  The security migrations that
-- follow define public tracking, admin, and authenticated-chat access.
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert themselves" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Storage buckets are created here, but object policies are intentionally
-- deferred until the complete security model is available in a later migration.
INSERT INTO storage.buckets (id, name, public) VALUES
  ('shipment-images', 'shipment-images', true),
  ('driver-images', 'driver-images', true),
  ('route-screenshots', 'route-screenshots', true),
  ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['shipments', 'checkpoints', 'chat_threads', 'chat_messages'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND n.nspname = 'public' AND c.relname = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END;
$$;

ALTER TABLE public.shipments REPLICA IDENTITY FULL;
ALTER TABLE public.checkpoints REPLICA IDENTITY FULL;
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
