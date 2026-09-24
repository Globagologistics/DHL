-- Resolve chat access on the database side. The old browser-side check queried
-- shipments first, which is blocked for a participant when a shipment is not
-- public and did not recognize admin accounts at all.
CREATE OR REPLACE FUNCTION public.ensure_chat_thread(p_tracking_id UUID)
RETURNS SETOF public.chat_threads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT := lower(nullif(auth.jwt() ->> 'email', ''));
  v_thread public.chat_threads;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to open a chat thread';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shipments WHERE id = p_tracking_id) THEN
    RAISE EXCEPTION 'Shipment was not found';
  END IF;

  IF public.current_user_is_admin() THEN
    -- Admins may reopen either participant's existing conversation. If neither
    -- exists, start the sender conversation so support can initiate contact.
    SELECT * INTO v_thread
    FROM public.chat_threads
    WHERE tracking_id = p_tracking_id
    ORDER BY updated_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN NEXT v_thread;
      RETURN;
    END IF;

    v_role := 'sender';
  ELSIF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments
    WHERE id = p_tracking_id AND lower(coalesce(sender_email, '')) = v_email
  ) THEN
    v_role := 'sender';
  ELSIF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments
    WHERE id = p_tracking_id AND lower(coalesce(receiver_email, '')) = v_email
  ) THEN
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
