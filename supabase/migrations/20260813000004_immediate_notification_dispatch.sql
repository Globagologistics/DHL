-- Immediate, asynchronous notification dispatch. The durable outbox remains
-- authoritative: this trigger only queues a secure HTTP callback and never
-- lets a callback problem roll back a shipment/chat transaction.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.request_immediate_notification_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  dispatch_url TEXT;
  dispatch_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO dispatch_url
  FROM vault.decrypted_secrets
  WHERE name = 'notification_dispatch_url'
  LIMIT 1;

  SELECT decrypted_secret INTO dispatch_secret
  FROM vault.decrypted_secrets
  WHERE name = 'notification_dispatch_secret'
  LIMIT 1;

  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RAISE WARNING 'Immediate notification dispatch is not configured; recovery sweeper will process event %', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-dispatch-secret', dispatch_secret
    ),
    body := jsonb_build_object('event_id', NEW.id)::jsonb,
    timeout_milliseconds := 10_000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Immediate notification dispatch could not be queued for event %: %', NEW.id, SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS notification_event_immediate_dispatch_trigger ON public.notification_events;
CREATE TRIGGER notification_event_immediate_dispatch_trigger
AFTER INSERT ON public.notification_events
FOR EACH ROW EXECUTE FUNCTION public.request_immediate_notification_dispatch();

REVOKE ALL ON FUNCTION public.request_immediate_notification_dispatch() FROM PUBLIC, anon, authenticated;
