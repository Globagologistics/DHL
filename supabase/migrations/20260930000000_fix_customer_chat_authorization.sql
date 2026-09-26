-- Customers could open a support conversation but every send was rejected with
-- "new row violates row-level security policy for table chat_messages".
--
-- The INSERT policy on public.chat_messages (20260813000002) reads:
--   current_user_can_access_chat_thread(thread_id)
--   AND ((is_admin AND sender_role = 'admin') OR (NOT is_admin AND sender_role = 'user'))
-- The browser chooses sender_role itself, so the role a caller may write is
-- decided by the client and then re-checked against who they are. Anyone whose
-- account is an administrator — including an operator opening the customer
-- support screen in the same signed-in browser — sends sender_role = 'user'
-- from the customer UI and is rejected by the second conjunct. Reading works
-- because SELECT under RLS silently returns zero rows instead of raising, so
-- the conversation still appears to open.
--
-- Two fixes, both server-side:
--   1. A SECURITY DEFINER RPC that decides the sender role itself, so the
--      browser can no longer propose one at all.
--   2. The participant predicate no longer treats a missing email as a match.

-- ---------------------------------------------------------------------------
-- 1. Close the empty-string match.
--
-- The predicate compared COALESCE(jwt email, '') with COALESCE(shipment email,
-- '').  createScheduledShipment stores sender_email = '', so any authenticated
-- session whose JWT carries no email claim matched '' = '' and was treated as
-- the sender of every shipment. Both sides are now NULL-ed, and NULL never
-- matches.
-- ---------------------------------------------------------------------------
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
          AND nullif(lower(auth.jwt() ->> 'email'), '') IS NOT NULL
          AND nullif(lower(auth.jwt() ->> 'email'), '') = CASE p_participant_role
                WHEN 'sender' THEN nullif(lower(s.sender_email), '')
                WHEN 'receiver' THEN nullif(lower(s.receiver_email), '')
              END
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- 2. The customer's only write path.
--
-- sender_role is assigned here, never accepted from the caller, so a customer
-- cannot post as 'admin' or 'support'. Knowing a tracking number is still not
-- authorization: the caller must be the participant this thread belongs to.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_customer_chat_message(
  p_thread_id uuid,
  p_text text DEFAULT NULL,
  p_media jsonb DEFAULT '[]'::jsonb,
  p_reply_to_message_id uuid DEFAULT NULL
)
RETURNS SETOF public.chat_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread public.chat_threads%ROWTYPE;
  v_text text := nullif(btrim(coalesce(p_text, '')), '');
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
  v_item jsonb;
  v_row public.chat_messages%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to send a message' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_thread FROM public.chat_threads WHERE id = p_thread_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation was not found' USING ERRCODE = 'P0001';
  END IF;

  -- Authorization is per participant thread, not per tracking number.
  IF NOT public.current_user_can_access_chat_participant(v_thread.tracking_id, v_thread.participant_role) THEN
    RAISE EXCEPTION 'You are not authorized to write to this conversation' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(v_media) <> 'array' THEN
    RAISE EXCEPTION 'Attachment payload is invalid' USING ERRCODE = 'P0001';
  END IF;
  IF v_text IS NULL AND jsonb_array_length(v_media) = 0 THEN
    RAISE EXCEPTION 'Message is empty' USING ERRCODE = 'P0001';
  END IF;
  IF length(coalesce(v_text, '')) > 4000 THEN
    RAISE EXCEPTION 'Message is too long' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(v_media) > 4 THEN
    RAISE EXCEPTION 'Too many attachments' USING ERRCODE = 'P0001';
  END IF;

  -- An attachment may only reference this shipment's own chat-media folder.
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_media) LOOP
    IF coalesce(v_item ->> 'storagePath', '') NOT LIKE (v_thread.tracking_id::text || '/%') THEN
      RAISE EXCEPTION 'Attachment does not belong to this conversation' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  IF p_reply_to_message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.chat_messages WHERE id = p_reply_to_message_id AND thread_id = p_thread_id
  ) THEN
    RAISE EXCEPTION 'The quoted message is not part of this conversation' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.chat_messages (thread_id, tracking_id, sender_role, text, media, reply_to_message_id)
  VALUES (p_thread_id, v_thread.tracking_id, 'user', v_text, v_media, p_reply_to_message_id)
  RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.send_customer_chat_message(uuid, text, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_customer_chat_message(uuid, text, jsonb, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The permanent demo shipment must survive an accidental delete.
--    soft_delete_shipment (20260926000000) is reused unchanged otherwise:
--    admin-only, sets deleted_at, refuses shipments that are already moving.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_shipment(p_shipment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v public.shipments%ROWTYPE;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.shipments WHERE id = p_shipment_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found' USING ERRCODE = 'P0001'; END IF;
  IF coalesce(v.is_demo, false) THEN
    RAISE EXCEPTION 'The permanent demo shipment cannot be deleted.' USING ERRCODE = 'P0001';
  END IF;
  IF public.derive_lifecycle_state(v) IN ('in_transit', 'paused', 'stopped') THEN
    RAISE EXCEPTION 'Active shipments cannot be deleted. Stop or terminate them first.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.shipments SET deleted_at = now() WHERE id = p_shipment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_shipment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_shipment(uuid) TO authenticated;
