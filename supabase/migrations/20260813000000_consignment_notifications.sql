-- Transactional consignment notifications.
-- This migration only queues events. Delivery is performed asynchronously by the
-- server-side notification worker so an SMTP failure never rolls back a shipment.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS customer_status_reason TEXT;

CREATE TABLE IF NOT EXISTS public.shipment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  customer_visible_reason TEXT,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'shipment_published', 'shipment_status_changed', 'on_hold', 'released',
    'payment_confirmed', 'delivered', 'terminated', 'chat_customer_message', 'chat_admin_reply'
  )),
  idempotency_key TEXT NOT NULL UNIQUE,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.notification_events(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'sender', 'receiver')),
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  provider TEXT NOT NULL DEFAULT 'gmail_smtp',
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  error_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_deliveries_event_recipient_key UNIQUE (event_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_shipment_status_history_shipment_created
  ON public.shipment_status_history (shipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_dispatch
  ON public.notification_events (status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_event
  ON public.notification_deliveries (event_id, delivery_status);

CREATE OR REPLACE FUNCTION public.notification_customer_status(shipment public.shipments)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN shipment.terminated THEN 'terminated'
    WHEN shipment.status = 'delivered' THEN 'delivered'
    WHEN shipment.stopped OR shipment.paused THEN 'on_hold'
    ELSE 'in_transit'
  END;
$$;

CREATE OR REPLACE FUNCTION public.queue_notification_event(
  p_shipment_id UUID,
  p_event_type TEXT,
  p_idempotency_key TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_events (shipment_id, event_type, idempotency_key, event_payload)
  VALUES (p_shipment_id, p_event_type, p_idempotency_key, COALESCE(p_payload, '{}'::jsonb))
  ON CONFLICT (idempotency_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_shipment_notification_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_customer_status TEXT;
  new_customer_status TEXT;
  event_key TEXT;
BEGIN
  IF NOT OLD.is_published AND NEW.is_published THEN
    NEW.published_at := COALESCE(NEW.published_at, NOW());
  END IF;

  -- A draft may be edited freely. No customer event is emitted until publication.
  IF NOT NEW.is_published THEN
    RETURN NEW;
  END IF;

  IF NOT OLD.is_published AND NEW.is_published THEN
    PERFORM public.queue_notification_event(
      NEW.id,
      'shipment_published',
      NEW.id::TEXT || ':shipment_published',
      jsonb_build_object('published_at', NEW.published_at)
    );
  END IF;

  old_customer_status := public.notification_customer_status(OLD);
  new_customer_status := public.notification_customer_status(NEW);

  IF old_customer_status IS DISTINCT FROM new_customer_status THEN
    INSERT INTO public.shipment_status_history (
      shipment_id, previous_status, new_status, customer_visible_reason, changed_by
    ) VALUES (
      NEW.id, old_customer_status, new_customer_status,
      NULLIF(NEW.customer_status_reason, ''), auth.uid()
    );
  END IF;

  event_key := NEW.id::TEXT || ':' || NEW.updated_at::TEXT;

  IF NOT OLD.terminated AND NEW.terminated THEN
    PERFORM public.queue_notification_event(NEW.id, 'terminated', event_key || ':terminated',
      jsonb_build_object('reason', NULLIF(NEW.customer_status_reason, ''), 'occurred_at', NEW.terminate_timestamp));
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    PERFORM public.queue_notification_event(NEW.id, 'delivered', event_key || ':delivered',
      jsonb_build_object('occurred_at', NOW()));
  ELSIF NOT OLD.stopped AND NEW.stopped THEN
    PERFORM public.queue_notification_event(NEW.id, 'on_hold', event_key || ':on_hold',
      jsonb_build_object('reason', COALESCE(NULLIF(NEW.customer_status_reason, ''), NULLIF(NEW.stop_reason, '')), 'occurred_at', NEW.stop_timestamp));
  ELSIF NOT OLD.paused AND NEW.paused THEN
    PERFORM public.queue_notification_event(NEW.id, 'on_hold', event_key || ':on_hold',
      jsonb_build_object('reason', NULLIF(NEW.customer_status_reason, ''), 'occurred_at', NEW.pause_timestamp));
  ELSIF (OLD.stopped OR OLD.paused) AND NOT (NEW.stopped OR NEW.paused) THEN
    PERFORM public.queue_notification_event(NEW.id, 'released', event_key || ':released',
      jsonb_build_object('occurred_at', NOW()));
  ELSIF NOT OLD.paid AND NEW.paid THEN
    PERFORM public.queue_notification_event(NEW.id, 'payment_confirmed', event_key || ':payment_confirmed',
      jsonb_build_object('occurred_at', NOW()));
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.queue_notification_event(NEW.id, 'shipment_status_changed', event_key || ':status_changed',
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'reason', NULLIF(NEW.customer_status_reason, '')));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_chat_notification_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.queue_notification_event(
    NEW.tracking_id,
    CASE WHEN NEW.sender_role = 'admin' THEN 'chat_admin_reply' ELSE 'chat_customer_message' END,
    'chat:' || NEW.id::TEXT,
    jsonb_build_object('sender_role', NEW.sender_role, 'sender_name', NEW.sender_name, 'message_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipment_notification_event_trigger ON public.shipments;
CREATE TRIGGER shipment_notification_event_trigger
BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.record_shipment_notification_events();

DROP TRIGGER IF EXISTS chat_notification_event_trigger ON public.chat_messages;
CREATE TRIGGER chat_notification_event_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.record_chat_notification_event();

DROP TRIGGER IF EXISTS set_notification_events_updated_at ON public.notification_events;
CREATE TRIGGER set_notification_events_updated_at
BEFORE UPDATE ON public.notification_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_notification_deliveries_updated_at ON public.notification_deliveries;
CREATE TRIGGER set_notification_deliveries_updated_at
BEFORE UPDATE ON public.notification_deliveries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.shipment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- No browser policy is deliberately created for event and delivery logs. They are
-- accessible only through the Supabase service-role used by the server worker.
REVOKE ALL ON public.shipment_status_history, public.notification_events, public.notification_deliveries FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_notification_event(UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_notification_event(UUID, TEXT, TEXT, JSONB) TO service_role;
