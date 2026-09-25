import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { ChatMessage, ChatRole, ChatThreadSummary, MediaAttachment } from "../types/chat";
import { devDataEnabled, subscribeDevData } from "../demo/devDataStore";
import { deleteDemoMessage, getDemoMessages, getDemoThreadSummary, isDemoChatTarget, isDemoThreadId, listDemoThreads, markDemoThreadRead, sendDemoMessage, subscribeDemoChat } from "../demo/demoChatStore";

type ChatThreadRow = {
  id: string;
  tracking_id: string;
  participant_role: 'sender' | 'receiver';
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_for_admin: number | null;
  unread_for_user: number | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  thread_id: string;
  tracking_id: string;
  sender_role: ChatRole;
  sender_name: string | null;
  sender_avatar_url: string | null;
  text: string | null;
  media: MediaAttachment[] | null;
  created_at: string;
  animate_typing?: boolean | null;
  typing_speed_ms?: number | null;
  reply_to_message_id?: string | null;
  support_profile_id?: string | null;
  deleted_at?: string | null;
};

const CHAT_MEDIA_BUCKET = "chat-media";

async function hydrateChatMedia(media: MediaAttachment[] | null | undefined): Promise<MediaAttachment[] | undefined> {
  if (!media?.length) return media || undefined;
  return Promise.all(media.map(async attachment => {
    if (!attachment.storagePath) return attachment;
    const { data, error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).createSignedUrl(attachment.storagePath, 60 * 60);
    if (error || !data?.signedUrl) return attachment;
    return { ...attachment, url: data.signedUrl };
  }));
}

const toThreadSummary = (row: ChatThreadRow): ChatThreadSummary => ({
  id: row.id,
  trackingId: row.tracking_id,
  participantRole: row.participant_role,
  lastMessageAt: row.last_message_at
    ? new Date(row.last_message_at).getTime()
    : undefined,
  lastMessagePreview: row.last_message_preview,
  unreadForAdmin: row.unread_for_admin ?? 0,
  unreadForUser: row.unread_for_user ?? 0,
});

const toMessage = (row: ChatMessageRow): ChatMessage => ({
  id: row.id,
  trackingId: row.tracking_id,
  sender: row.sender_role,
  senderName: row.sender_name || undefined,
  senderAvatarUrl: row.sender_avatar_url || undefined,
  text: row.deleted_at ? undefined : row.text || undefined,
  media: !row.deleted_at && Array.isArray(row.media) ? row.media : undefined,
  createdAt: new Date(row.created_at).getTime(),
  animateTyping: row.animate_typing ?? false,
  typingSpeedMs: row.typing_speed_ms ?? undefined,
  replyToMessageId: row.reply_to_message_id ?? undefined,
  supportProfileId: row.support_profile_id ?? undefined,
  deletedAt: row.deleted_at ? new Date(row.deleted_at).getTime() : undefined,
});

const hydrateMessage = async (message: ChatMessage): Promise<ChatMessage> => ({
  ...message,
  media: await hydrateChatMedia(message.media),
});

/**
 * Resolves quoted replies. Customers never see deleted support messages or
 * quotes of them; admins get a content-free "deleted" marker instead.
 */
const withReplyTargets = (messages: ChatMessage[], viewer: ChatRole): ChatMessage[] => {
  const byId = new Map(messages.map(message => [message.id, message]));
  const visible = viewer === 'user' ? messages.filter(message => !message.deletedAt) : messages;
  return visible.map(message => {
    const target = message.replyToMessageId ? byId.get(message.replyToMessageId) : undefined;
    if (!target) return message;
    if (target.deletedAt) return viewer === 'user' ? { ...message, replyToMessageId: undefined, replyTo: undefined } : { ...message, replyTo: { id: target.id, sender: target.sender, senderName: target.senderName, deleted: true } };
    return { ...message, replyTo: { id: target.id, sender: target.sender, senderName: target.senderName, text: target.text, media: target.media, supportProfileId: target.supportProfileId } };
  });
};

const makeFileId = () => {
  try {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  } catch {
    return `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

const uploadChatMedia = async (
  files: File[],
  trackingId: string
): Promise<MediaAttachment[]> => {
  if (files.length === 0) return [];

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const fileId = makeFileId();
      const filePath = `${trackingId}/${fileId}-${file.name}`;
      const { error } = await supabase.storage
        .from(CHAT_MEDIA_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (error) {
        console.error("Failed to upload chat media:", error);
        return null;
      }

      return {
        id: fileId,
        url: filePath,
        storagePath: filePath,
        type: file.type.startsWith("video/") ? "video" : "image",
        name: file.name,
      } as MediaAttachment;
    })
  );

  return uploaded.filter(Boolean) as MediaAttachment[];
};

export async function ensureChatThread(trackingId: string): Promise<ChatThreadSummary | null> {
  const trimmed = trackingId.trim();
  if (!trimmed) return null;
  // Development-store shipments use the shared local conversation.
  if (isDemoChatTarget(trimmed)) return getDemoThreadSummary(trimmed);

  const { data, error } = await supabase
    .rpc("ensure_chat_thread", { p_tracking_id: trimmed })
    .single();

  if (error) {
    console.error("Failed to ensure chat thread:", error);
    return null;
  }

  return toThreadSummary(data as ChatThreadRow);
}

const ensureThreadRow = async (trackingId: string): Promise<Pick<ChatThreadRow, 'id' | 'tracking_id'> | null> => {
  const trimmed = trackingId.trim();
  if (!trimmed) return null;

  const thread = await ensureChatThread(trimmed);
  return thread ? { id: thread.id, tracking_id: thread.trackingId } : null;
};

export async function sendChatMessage(payload: {
  trackingId: string;
  threadId?: string;
  sender: ChatRole;
  text?: string;
  senderName?: string;
  senderAvatarUrl?: string;
  mediaFiles?: File[];
  media?: MediaAttachment[];
  animateTyping?: boolean;
  typingSpeedMs?: number;
  replyToMessageId?: string;
  supportProfileId?: string;
}) {
  const trimmed = payload.trackingId.trim();
  if (!trimmed) return { data: null, error: "Missing tracking ID" };
  if (isDemoThreadId(payload.threadId) || isDemoChatTarget(trimmed)) {
    const message = sendDemoMessage(payload.threadId || trimmed, payload);
    return message ? { data: message, error: null } : { data: null, error: "Message is empty" };
  }

  const thread = payload.threadId
    ? { id: payload.threadId, tracking_id: trimmed }
    : await ensureThreadRow(trimmed);
  if (!thread) {
    return { data: null, error: "Failed to create chat thread" };
  }

  const uploads = payload.mediaFiles
    ? await uploadChatMedia(payload.mediaFiles, trimmed)
    : [];
  const combinedMedia = [...(payload.media || []), ...uploads];
  const cleanedText = payload.text?.trimEnd() || null;

  if (!cleanedText && combinedMedia.length === 0) {
    return { data: null, error: "Message is empty" };
  }

  const insertRow = {
    thread_id: thread.id,
    tracking_id: trimmed,
    sender_role: payload.sender,
    sender_name: payload.senderName || null,
    sender_avatar_url: payload.senderAvatarUrl || null,
    text: cleanedText,
    media: combinedMedia,
    animate_typing: payload.animateTyping ?? false,
    typing_speed_ms: payload.typingSpeedMs ?? null,
    reply_to_message_id: payload.replyToMessageId || null,
    support_profile_id: payload.supportProfileId || null,
  };
  let { data, error } = await supabase
    .from("chat_messages")
    .insert([insertRow])
    .select("*")
    .single();

  // Protect current production chat while the additive migration is waiting to
  // be applied. Reply/persona metadata will simply be unavailable there.
  if (error && (error.code === 'PGRST204' || /reply_to_message_id|support_profile_id/i.test(error.message || ''))) {
    const { reply_to_message_id: _reply, support_profile_id: _profile, ...legacyRow } = insertRow;
    ({ data, error } = await supabase.from("chat_messages").insert([legacyRow]).select("*").single());
  }

  if (error) {
    console.error("Failed to send chat message:", error);
    return { data: null, error: error.message };
  }

  return { data: await hydrateMessage(toMessage(data as ChatMessageRow)), error: null };
}

/**
 * Admin-only. Removes a SUPPORT message from the customer's conversation.
 * Authorization is enforced server-side by delete_support_message (migration
 * 20260926000001): only admins, only support-sent messages. Emails or
 * notifications already sent about the message cannot be recalled.
 */
export async function deleteSupportMessage(threadId: string, messageId: string): Promise<string | null> {
  if (isDemoThreadId(threadId)) {
    try { deleteDemoMessage(threadId, messageId); return null; } catch (error) { return error instanceof Error ? error.message : 'Message could not be deleted.'; }
  }
  const { error } = await supabase.rpc('delete_support_message', { p_message_id: messageId });
  if (error) {
    console.error('Failed to delete support message:', error);
    return /function .* does not exist|could not find the function/i.test(error.message || '') ? 'Message deletion needs the chat-deletion migration (Part Two).' : 'Message could not be deleted. Please try again.';
  }
  return null;
}

export async function markThreadRead(threadId: string, role: ChatRole) {
  const trimmed = threadId.trim();
  if (!trimmed) return;
  if (isDemoThreadId(trimmed)) {
    markDemoThreadRead(trimmed, role);
    return;
  }

  const updates =
    role === "admin" ? { unread_for_admin: 0 } : { unread_for_user: 0 };

  const { error } = await supabase
    .from("chat_threads")
    .update(updates)
    .eq("id", trimmed);

  if (error) {
    console.error("Failed to mark thread read:", error);
  }
}

export function useChatThreads() {
  const [realThreads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [devThreads, setDevThreads] = useState<ChatThreadSummary[]>(() => listDemoThreads());

  // Development conversations appear alongside real threads.
  useEffect(() => {
    if (!devDataEnabled()) return;
    const refresh = () => setDevThreads(listDemoThreads());
    const offChat = subscribeDemoChat(refresh);
    const offData = subscribeDevData(refresh);
    return () => { offChat(); offData(); };
  }, []);

  const threads = useMemo(
    () => [...devThreads, ...realThreads].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)),
    [devThreads, realThreads]
  );

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Failed to fetch chat threads:", error);
      setThreads([]);
      setLoading(false);
      return;
    }

    const mapped = (data as ChatThreadRow[]).map(toThreadSummary);
    mapped.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    setThreads(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThreads();

    const channel = supabase
      .channel("chat-threads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_threads" },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchThreads]);

  return { threads, loading, refresh: fetchThreads };
}

/**
 * Conversation messages for one viewer. `viewer` decides deletion handling:
 * 'user' drops deleted support messages entirely; 'admin' keeps an audit marker.
 */
export function useChatMessages(trackingId: string, threadId?: string, viewer: ChatRole = 'user') {
  const [rawMessages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [devMessages, setDevMessages] = useState<ChatMessage[] | null>(null);

  useEffect(() => {
    let active = true;

    if (isDemoThreadId(threadId) || isDemoChatTarget(trackingId.trim())) {
      const target = threadId || trackingId.trim();
      setDevMessages(getDemoMessages(target, viewer));
      setLoading(false);
      const unsubscribe = subscribeDemoChat(() => { if (active) setDevMessages(getDemoMessages(target, viewer)); });
      return () => { active = false; unsubscribe(); };
    }
    setDevMessages(null);

    const fetchMessages = async () => {
      const trimmed = trackingId.trim();
      if (!trimmed) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const resolvedThread = threadId ? null : await ensureChatThread(trimmed);
      const activeThreadId = threadId || resolvedThread?.id;
      if (!activeThreadId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", activeThreadId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Failed to fetch chat messages:", error);
        setMessages([]);
        setLoading(false);
        return;
      }

      setMessages(await Promise.all((data as ChatMessageRow[]).map(row => hydrateMessage(toMessage(row)))));
      setLoading(false);
    };

    fetchMessages();

    const trimmed = trackingId.trim();
    if (!trimmed) return () => {};

    const activeThreadId = threadId;
    if (!activeThreadId) return () => {};
    const channel = supabase
      .channel(`chat-messages-${activeThreadId}-${viewer}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
          const newRow = payload.new as ChatMessageRow;
          const oldRow = payload.old as ChatMessageRow;

          if (payload.eventType === "INSERT" && newRow) {
            void hydrateMessage(toMessage(newRow)).then(next => {
              setMessages((prev) => prev.some((msg) => msg.id === next.id) ? prev : [...prev, next]);
            });
          }

          // A deletion arrives as an UPDATE with deleted_at set.
          if (payload.eventType === "UPDATE" && newRow) {
            void hydrateMessage(toMessage(newRow)).then(next => {
              setMessages((prev) => prev.map((msg) => (msg.id === next.id ? next : msg)));
            });
          }

          if (payload.eventType === "DELETE" && oldRow) {
            setMessages((prev) => prev.filter((msg) => msg.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      channel.unsubscribe();
    };
  }, [trackingId, threadId, viewer]);

  const messages = useMemo(() => {
    if (devMessages) return devMessages;
    return withReplyTargets([...rawMessages].sort((a, b) => a.createdAt - b.createdAt), viewer);
  }, [devMessages, rawMessages, viewer]);

  return { messages, loading };
}
