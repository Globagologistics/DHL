-- The immediate dispatch trigger must return the inserted notification event
-- after successfully queueing its asynchronous pg_net callback.
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

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Immediate notification dispatch could not be queued for event %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.request_immediate_notification_dispatch() FROM PUBLIC, anon, authenticated;
