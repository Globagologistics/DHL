-- Additive chat metadata. Existing authorization, realtime publication and messages remain unchanged.
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS support_profile_id text;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_support_profile_id_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_support_profile_id_check
  CHECK (support_profile_id IS NULL OR support_profile_id IN ('support_emily', 'support_lauren', 'support_sophia'));

CREATE INDEX IF NOT EXISTS chat_messages_reply_to_message_id_idx
  ON public.chat_messages(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;

-- The current SELECT policy already permits conversation members to read both
-- the reply target and source message. No RLS policy is widened by this change.
