-- Admin-only removal of SUPPORT messages from a customer conversation.
-- The row stays (so replies keep their reference) but its text and media are
-- moved to an admin-only audit table. Customers' clients drop rows with
-- deleted_at set, so the message disappears completely; admins see a marker.
-- Emails or notifications already sent about a message cannot be recalled.

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- A deleted message has no content; everything else still must.
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_message_has_content;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_message_has_content CHECK (
  deleted_at IS NOT NULL
  OR (text IS NOT NULL AND length(trim(text)) > 0)
  OR (media IS NOT NULL AND jsonb_array_length(media) > 0)
);

CREATE TABLE IF NOT EXISTS public.chat_message_deletions (
  message_id uuid PRIMARY KEY REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL,
  original_text text,
  original_media jsonb,
  deleted_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_message_deletions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_message_deletions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chat_message_deletions TO authenticated;
DROP POLICY IF EXISTS "Admins can read deletion audit" ON public.chat_message_deletions;
CREATE POLICY "Admins can read deletion audit" ON public.chat_message_deletions FOR SELECT TO authenticated USING (public.current_user_is_admin());

-- Authorization lives here, not in the UI: admins only, support-sent messages only.
CREATE OR REPLACE FUNCTION public.delete_support_message(p_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.chat_messages%ROWTYPE; v_last public.chat_messages%ROWTYPE;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO m FROM public.chat_messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found' USING ERRCODE = 'P0001'; END IF;
  IF m.sender_role <> 'admin' THEN RAISE EXCEPTION 'Only support messages can be deleted.' USING ERRCODE = 'P0001'; END IF;
  IF m.deleted_at IS NOT NULL THEN RETURN; END IF;

  INSERT INTO public.chat_message_deletions(message_id, thread_id, original_text, original_media, deleted_by)
  VALUES (m.id, m.thread_id, m.text, m.media, auth.uid());
  UPDATE public.chat_messages SET text = NULL, media = '[]'::jsonb, deleted_at = now(), deleted_by = auth.uid() WHERE id = m.id;

  -- Keep the inbox preview from showing the deleted text.
  SELECT * INTO v_last FROM public.chat_messages WHERE thread_id = m.thread_id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1;
  UPDATE public.chat_threads SET
    last_message_preview = CASE WHEN v_last.id IS NULL THEN NULL ELSE left(coalesce(v_last.text, 'Attachment'), 140) END,
    last_message_at = coalesce(v_last.created_at, last_message_at)
  WHERE id = m.thread_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_support_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_support_message(uuid) TO authenticated;
