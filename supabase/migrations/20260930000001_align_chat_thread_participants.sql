-- Second half of the customer-reply failure.
--
-- Observed in production: shipment 871499324774 has sender_email = '' (the
-- admin wizard stores an empty sender email) and receiver_email =
-- 'mary@gmail.com'. The only thread on it is participant_role = 'sender',
-- because an administrator opened the conversation first and
-- ensure_chat_thread's admin branch falls back to 'sender' when no thread
-- exists yet. The customer is the receiver, so the receiver could never be
-- authorized for that sender thread: reads returned zero rows (RLS filters
-- silently) and every write was refused.
--
-- A 'sender' thread on a shipment with no sender email is unreachable by
-- definition — no account can ever match ''. Two changes:
--   1. ensure_chat_thread opens the thread of a participant who can exist.
--   2. Existing unreachable sender threads are re-pointed at the receiver, so
--      replies already sent by support stay with the conversation.

CREATE OR REPLACE FUNCTION public.ensure_chat_thread(p_tracking_id UUID)
RETURNS SETOF public.chat_threads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT := lower(nullif(auth.jwt() ->> 'email', ''));
  v_shipment public.shipments%ROWTYPE;
  v_thread public.chat_threads;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to open a chat thread';
  END IF;

  SELECT * INTO v_shipment FROM public.shipments WHERE id = p_tracking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shipment was not found';
  END IF;

  IF public.current_user_is_admin() THEN
    -- Reopen the existing conversation when there is one.
    SELECT * INTO v_thread
    FROM public.chat_threads
    WHERE tracking_id = p_tracking_id
    ORDER BY updated_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN NEXT v_thread;
      RETURN;
    END IF;

    -- Otherwise start the conversation for a participant who can actually
    -- sign in. Preferring 'sender' unconditionally created threads no
    -- customer could ever reach.
    v_role := CASE
      WHEN nullif(lower(v_shipment.sender_email), '') IS NOT NULL THEN 'sender'
      WHEN nullif(lower(v_shipment.receiver_email), '') IS NOT NULL THEN 'receiver'
      ELSE 'sender'
    END;
  ELSIF v_email IS NOT NULL AND nullif(lower(v_shipment.sender_email), '') = v_email THEN
    v_role := 'sender';
  ELSIF v_email IS NOT NULL AND nullif(lower(v_shipment.receiver_email), '') = v_email THEN
    v_role := 'receiver';
  ELSE
    RAISE EXCEPTION 'You are not authorized to open this chat thread';
  END IF;

  INSERT INTO public.chat_threads (tracking_id, participant_role)
  VALUES (p_tracking_id, v_role)
  ON CONFLICT (tracking_id, participant_role) DO UPDATE
    SET updated_at = public.chat_threads.updated_at
  RETURNING * INTO v_thread;

  RETURN NEXT v_thread;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_chat_thread(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_chat_thread(UUID) TO authenticated, service_role;

-- Repair: a sender thread on a shipment with no sender email can never be
-- opened by a customer. Re-point it at the receiver, but only when that would
-- not collide with a receiver thread that already exists.
UPDATE public.chat_threads t
SET participant_role = 'receiver'
FROM public.shipments s
WHERE s.id = t.tracking_id
  AND t.participant_role = 'sender'
  AND nullif(lower(s.sender_email), '') IS NULL
  AND nullif(lower(s.receiver_email), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_threads other
    WHERE other.tracking_id = t.tracking_id AND other.participant_role = 'receiver'
  );
