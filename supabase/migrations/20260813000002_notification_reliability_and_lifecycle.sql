-- Harden notification-triggering mutations and complete the existing outbox
-- lifecycle. This is additive and preserves existing shipment records.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS internal_status_note TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_responsibility TEXT NOT NULL DEFAULT 'sender';

-- Existing rows keep their boolean compatibility field and receive the
-- corresponding explicit payment status.
UPDATE public.shipments
SET payment_status = CASE WHEN paid THEN 'paid' ELSE 'unpaid' END
WHERE payment_status IS NULL OR payment_status NOT IN ('unpaid', 'pending', 'paid');

UPDATE public.shipments
SET currency = 'USD'
WHERE currency IS NULL OR btrim(currency) = '';

UPDATE public.shipments
SET payment_responsibility = 'sender'
WHERE payment_responsibility IS NULL OR payment_responsibility NOT IN ('sender', 'receiver', 'company');

DO $$
DECLARE constraint_name TEXT;
BEGIN
  -- The original schema did not name its status CHECK constraint. Remove only
  -- shipment CHECK constraints which constrain the status column.
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.shipments'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.shipments DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_status_lifecycle_check CHECK (status IN (
    'processing', 'pickup_scheduled', 'picked_up', 'in_transit',
    'customs_processing', 'on_hold', 'delayed', 'out_for_delivery',
    'delivered', 'cancelled', 'returned', 'paused', 'stopped'
  )),
  ADD CONSTRAINT shipments_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid')),
  ADD CONSTRAINT shipments_payment_responsibility_check CHECK (payment_responsibility IN ('sender', 'receiver', 'company')),
  ADD CONSTRAINT shipments_currency_not_blank CHECK (btrim(currency) <> '');

CREATE OR REPLACE FUNCTION public.sync_shipment_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.paid THEN
      NEW.payment_status := 'paid';
    ELSE
      NEW.payment_status := COALESCE(NULLIF(NEW.payment_status, ''), 'unpaid');
    END IF;
    NEW.paid := NEW.payment_status = 'paid';
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    NEW.paid := NEW.payment_status = 'paid';
  ELSIF NEW.paid IS DISTINCT FROM OLD.paid THEN
    NEW.payment_status := CASE WHEN NEW.paid THEN 'paid' ELSE 'unpaid' END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_shipment_payment_status_trigger ON public.shipments;
DROP TRIGGER IF EXISTS apply_shipment_payment_status_trigger ON public.shipments;
CREATE TRIGGER apply_shipment_payment_status_trigger
BEFORE INSERT OR UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.sync_shipment_payment_status();

ALTER TABLE public.notification_events
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS claim_token UUID;

DO $$
DECLARE constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.notification_events'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.notification_events DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_event_type_check CHECK (event_type IN (
    'shipment_published', 'shipment_status_changed', 'on_hold', 'released',
    'delayed', 'cancelled', 'payment_pending', 'payment_confirmed',
    'delivered', 'terminated', 'chat_customer_message', 'chat_admin_reply'
  ));

CREATE OR REPLACE FUNCTION public.notification_customer_status(shipment public.shipments)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN shipment.terminated THEN 'terminated'
    WHEN shipment.status = 'cancelled' THEN 'cancelled'
    WHEN shipment.status = 'delivered' THEN 'delivered'
    WHEN shipment.stopped OR shipment.paused OR shipment.status IN ('on_hold', 'paused', 'stopped') THEN 'on_hold'
    ELSE shipment.status
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

  IF NOT NEW.is_published THEN
    RETURN NEW;
  END IF;

  IF NOT OLD.is_published AND NEW.is_published THEN
    PERFORM public.queue_notification_event(
      NEW.id, 'shipment_published', NEW.id::TEXT || ':shipment_published',
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

  -- Keep this priority order: termination makes stopped=true, but it must not
  -- also create an on-hold notification.
  IF NOT OLD.terminated AND NEW.terminated THEN
    PERFORM public.queue_notification_event(NEW.id, 'terminated', event_key || ':terminated',
      jsonb_build_object('reason', NULLIF(NEW.customer_status_reason, ''), 'occurred_at', NEW.terminate_timestamp));
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    PERFORM public.queue_notification_event(NEW.id, 'cancelled', event_key || ':cancelled',
      jsonb_build_object('reason', NULLIF(NEW.customer_status_reason, ''), 'occurred_at', NEW.cancelled_at));
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    NEW.delivered_at := COALESCE(NEW.delivered_at, NOW());
    PERFORM public.queue_notification_event(NEW.id, 'delivered', event_key || ':delivered',
      jsonb_build_object('occurred_at', NEW.delivered_at));
  ELSIF old_customer_status <> 'on_hold' AND new_customer_status = 'on_hold' THEN
    PERFORM public.queue_notification_event(NEW.id, 'on_hold', event_key || ':on_hold',
      jsonb_build_object('reason', COALESCE(NULLIF(NEW.customer_status_reason, ''), NULLIF(NEW.stop_reason, '')), 'occurred_at', COALESCE(NEW.stop_timestamp, NEW.pause_timestamp, NOW())));
  ELSIF old_customer_status = 'on_hold' AND new_customer_status <> 'on_hold' AND NOT OLD.terminated THEN
    PERFORM public.queue_notification_event(NEW.id, 'released', event_key || ':released',
      jsonb_build_object('previous_reason', NULLIF(OLD.customer_status_reason, ''), 'occurred_at', NOW()));
  ELSIF OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'pending' THEN
    PERFORM public.queue_notification_event(NEW.id, 'payment_pending', event_key || ':payment_pending',
      jsonb_build_object('occurred_at', NOW()));
  ELSIF NOT OLD.paid AND NEW.paid THEN
    PERFORM public.queue_notification_event(NEW.id, 'payment_confirmed', event_key || ':payment_confirmed',
      jsonb_build_object('occurred_at', NOW()));
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delayed' THEN
    PERFORM public.queue_notification_event(NEW.id, 'delayed', event_key || ':delayed',
      jsonb_build_object('reason', NULLIF(NEW.customer_status_reason, ''), 'estimated_delivery_at', NEW.estimated_delivery_at, 'occurred_at', NOW()));
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.queue_notification_event(NEW.id, 'shipment_status_changed', event_key || ':status_changed',
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status, 'reason', NULLIF(NEW.customer_status_reason, ''), 'estimated_delivery_at', NEW.estimated_delivery_at));
  END IF;

  RETURN NEW;
END;
$$;

-- Atomically select work for one worker invocation. SKIP LOCKED prevents a
-- second scheduled/manual invocation from sending the same event concurrently.
CREATE OR REPLACE FUNCTION public.claim_notification_events(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.notification_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A worker crash must not strand events indefinitely.
  UPDATE public.notification_events
  SET status = 'failed',
      attempt_count = attempt_count + 1,
      last_error = COALESCE(last_error, 'Notification worker claim expired'),
      next_attempt_at = NOW(),
      claim_token = NULL,
      claimed_at = NULL
  WHERE status = 'processing'
    AND claimed_at < NOW() - INTERVAL '15 minutes';

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.notification_events
    WHERE status IN ('pending', 'failed')
      AND attempt_count < 3
      AND next_attempt_at <= NOW()
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  )
  UPDATE public.notification_events AS event
  SET status = 'processing',
      claimed_at = NOW(),
      claim_token = gen_random_uuid()
  FROM candidates
  WHERE event.id = candidates.id
  RETURNING event.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin');
$$;

-- Shipment mutations are the source of notification events, therefore browser
-- clients may mutate only shipments owned by an authenticated admin.
DROP POLICY IF EXISTS "Allow shipment creation" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment viewing" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment updates" ON public.shipments;
DROP POLICY IF EXISTS "Allow shipment deletion" ON public.shipments;
DROP POLICY IF EXISTS "Published shipments can be tracked" ON public.shipments;
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can create own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can delete own shipments" ON public.shipments;

CREATE POLICY "Published shipments can be tracked"
ON public.shipments FOR SELECT TO anon, authenticated
USING (is_published OR public.current_user_is_admin());

CREATE POLICY "Admins can create own shipments"
ON public.shipments FOR INSERT TO authenticated
WITH CHECK (public.current_user_is_admin() AND admin_id = auth.uid());

CREATE POLICY "Admins can update own shipments"
ON public.shipments FOR UPDATE TO authenticated
USING (public.current_user_is_admin() AND admin_id = auth.uid())
WITH CHECK (public.current_user_is_admin() AND admin_id = auth.uid());

CREATE POLICY "Admins can delete own shipments"
ON public.shipments FOR DELETE TO authenticated
USING (public.current_user_is_admin() AND admin_id = auth.uid());

DROP POLICY IF EXISTS "Allow checkpoint viewing" ON public.checkpoints;
DROP POLICY IF EXISTS "Allow checkpoint creation" ON public.checkpoints;
DROP POLICY IF EXISTS "Admins can manage shipment checkpoints" ON public.checkpoints;
DROP POLICY IF EXISTS "Published shipment checkpoints can be tracked" ON public.checkpoints;

CREATE POLICY "Published shipment checkpoints can be tracked"
ON public.checkpoints FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.is_published OR public.current_user_is_admin())));

CREATE POLICY "Admins can manage shipment checkpoints"
ON public.checkpoints FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.admin_id = auth.uid() AND public.current_user_is_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.admin_id = auth.uid() AND public.current_user_is_admin()));

-- Notification monitoring and retry are intentionally admin-only.
DROP POLICY IF EXISTS "Admins can read notification events" ON public.notification_events;
DROP POLICY IF EXISTS "Admins can read notification deliveries" ON public.notification_deliveries;
CREATE POLICY "Admins can read notification events"
ON public.notification_events FOR SELECT TO authenticated USING (public.current_user_is_admin());
CREATE POLICY "Admins can read notification deliveries"
ON public.notification_deliveries FOR SELECT TO authenticated USING (public.current_user_is_admin());

CREATE OR REPLACE FUNCTION public.retry_notification_delivery(p_delivery_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_event_id UUID;
BEGIN
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Admin authorization is required';
  END IF;

  UPDATE public.notification_deliveries
  SET delivery_status = 'pending', attempt_count = 0, error_summary = NULL
  WHERE id = p_delivery_id AND delivery_status = 'failed'
  RETURNING event_id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.notification_events
  SET status = 'pending', attempt_count = 0, next_attempt_at = NOW(),
      last_error = NULL, processed_at = NULL, claim_token = NULL, claimed_at = NULL
  WHERE id = v_event_id;
  RETURN TRUE;
END;
$$;

-- Separate sender and receiver conversations without changing the existing
-- message payload model. Historic single-party rows are retained as sender
-- threads; all newly created threads are isolated by participant role.
ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS participant_role TEXT NOT NULL DEFAULT 'sender';

ALTER TABLE public.chat_threads
  DROP CONSTRAINT IF EXISTS chat_threads_participant_role_check;
ALTER TABLE public.chat_threads
  ADD CONSTRAINT chat_threads_participant_role_check CHECK (participant_role IN ('sender', 'receiver'));

DROP INDEX IF EXISTS public.idx_chat_threads_tracking_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_tracking_participant
  ON public.chat_threads (tracking_id, participant_role);

CREATE OR REPLACE FUNCTION public.current_user_can_access_chat_participant(p_shipment_id UUID, p_participant_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      public.current_user_is_admin()
      OR EXISTS (
        SELECT 1 FROM public.shipments s
        WHERE s.id = p_shipment_id
          AND (
            (p_participant_role = 'sender' AND lower(COALESCE(auth.jwt() ->> 'email', '')) = lower(COALESCE(s.sender_email, '')))
            OR (p_participant_role = 'receiver' AND lower(COALESCE(auth.jwt() ->> 'email', '')) = lower(COALESCE(s.receiver_email, '')))
          )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_access_chat_thread(p_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_threads t
    WHERE t.id = p_thread_id
      AND public.current_user_can_access_chat_participant(t.tracking_id, t.participant_role)
  );
$$;

DROP POLICY IF EXISTS "Authenticated shipment parties can read chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Authenticated shipment parties can create chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Authenticated shipment parties can update their chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Authenticated shipment parties can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated shipment parties can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow chat thread read" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat thread write" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat thread update" ON public.chat_threads;
DROP POLICY IF EXISTS "Allow chat message read" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow chat message write" ON public.chat_messages;

CREATE POLICY "Authorized participants can read isolated chat threads"
ON public.chat_threads FOR SELECT TO authenticated
USING (public.current_user_can_access_chat_participant(tracking_id, participant_role));
CREATE POLICY "Authorized participants can create isolated chat threads"
ON public.chat_threads FOR INSERT TO authenticated
WITH CHECK (public.current_user_can_access_chat_participant(tracking_id, participant_role));
CREATE POLICY "Authorized participants can update isolated chat threads"
ON public.chat_threads FOR UPDATE TO authenticated
USING (public.current_user_can_access_chat_participant(tracking_id, participant_role))
WITH CHECK (public.current_user_can_access_chat_participant(tracking_id, participant_role));
CREATE POLICY "Authorized participants can read isolated messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.current_user_can_access_chat_thread(thread_id));
CREATE POLICY "Authorized participants can send isolated messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_can_access_chat_thread(thread_id)
  AND ((public.current_user_is_admin() AND sender_role = 'admin') OR (NOT public.current_user_is_admin() AND sender_role = 'user'))
);

CREATE OR REPLACE FUNCTION public.record_chat_notification_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE recipient_role TEXT;
BEGIN
  SELECT participant_role INTO recipient_role FROM public.chat_threads WHERE id = NEW.thread_id;
  PERFORM public.queue_notification_event(
    NEW.tracking_id,
    CASE WHEN NEW.sender_role = 'admin' THEN 'chat_admin_reply' ELSE 'chat_customer_message' END,
    'chat:' || NEW.id::TEXT,
    jsonb_build_object('sender_role', NEW.sender_role, 'sender_name', NEW.sender_name, 'message_id', NEW.id, 'participant_role', recipient_role)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_events(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_events(INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.retry_notification_delivery(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_notification_delivery(UUID) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.current_user_can_access_chat_participant(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_can_access_chat_thread(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_can_access_chat_participant(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_can_access_chat_thread(UUID) TO authenticated, service_role;
