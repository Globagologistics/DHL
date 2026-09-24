import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import type { ChatRole } from "../../../types/chat";
import { markThreadRead, sendChatMessage, useChatMessages } from "../../../hooks/useChat";
import { cn } from "../ui/utils";

interface ChatThreadProps {
  trackingId: string;
  threadId: string;
  role: ChatRole;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  accentClassName?: string;
  alertNotice?: string | null;
  statusNotice?: string | null;
  statusTone?: "info" | "success";
  agentTypingLabel?: string | null;
}

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
  name: string;
};

const createMediaAttachments = (files: FileList | null): PendingAttachment[] => {
  if (!files) return [];

  return Array.from(files)
    .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
    .map((file) => ({
      id: `${file.name}_${file.size}_${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
    }));
};

function TypedText({
  text,
  speedMs = 28,
}: {
  text: string;
  speedMs?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) {
      setDisplayed(text);
      return;
    }
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        doneRef.current = true;
        window.clearInterval(interval);
      }
    }, speedMs);
    return () => window.clearInterval(interval);
  }, [text, speedMs]);

  return <span>{displayed}</span>;
}

export function ChatThread({
  trackingId,
  threadId,
  role,
  title,
  subtitle,
  headerAction,
  accentClassName = "bg-[#1E40AF]",
  alertNotice,
  statusNotice,
  statusTone = "info",
  agentTypingLabel,
}: ChatThreadProps) {
  const { messages, loading } = useChatMessages(trackingId, threadId);
  const [draft, setDraft] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const adminAvatarUrl =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s";

  useEffect(() => {
    if (!trackingId) return;
    markThreadRead(threadId, role);
  }, [threadId, role, messages.length]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!activeImageUrl) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageUrl(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeImageUrl]);

  const isTouchInput =
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);

  const resizeComposer = () => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  };

  useEffect(() => {
    resizeComposer();
  }, [draft]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text && pendingMedia.length === 0) return;

    setSending(true);
    setSendError(null);
    const { error } = await sendChatMessage({
      trackingId,
      threadId,
      sender: role,
      text,
      mediaFiles: pendingMedia.map((item) => item.file),
    });

    if (error) {
      setSendError("Message could not be sent. Please try again.");
      setSending(false);
      return;
    }

    setDraft("");
    pendingMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingMedia([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setSending(false);
  };

  const lastSeenLabel = useMemo(() => {
    if (!messages.length) return "No messages yet";
    const last = messages[messages.length - 1];
    return `Last update ${new Date(last.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [messages]);

  const typingIndicator = draft.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {headerAction}
            <div>
              <div className="text-lg font-black tracking-tighter text-white">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-xs uppercase tracking-[0.25em] text-white/50">
              Tracking ID
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {trackingId}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              Online
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-white/50">{lastSeenLabel}</div>
        {alertNotice && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
            {alertNotice}
          </div>
        )}
        {statusNotice && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold",
              statusTone === "success"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : "border-sky-400/40 bg-sky-500/10 text-sky-200"
            )}
          >
            {statusNotice}
          </div>
        )}
      </div>

      <div className="ios-scroll flex-1 overflow-y-auto overscroll-contain px-6 py-6">
        <div className="space-y-4">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Loading messages...
            </div>
          )}
          {messages.map((message) => {
            const isMe = message.sender === role;
            const isAdminMessage = message.sender === "admin";
            const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex items-end gap-3",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {isAdminMessage && (
                    <img
                      src={message.senderAvatarUrl || adminAvatarUrl}
                      alt="Company avatar"
                      className="h-9 w-9 rounded-full object-cover shadow-md"
                    />
                  )}
                  <div className="flex max-w-[78%] flex-col gap-2">
                    {isAdminMessage && message.senderName && (
                      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        {message.senderName}
                      </div>
                    )}
                  {message.text && (
                    <div
                      className={cn(
                        "inline-flex w-fit rounded-3xl px-4 py-3 text-sm shadow-lg",
                        isMe
                          ? cn(
                              accentClassName,
                              "text-white rounded-br-2xl shadow-[0_16px_30px_rgba(15,23,42,0.35)]"
                            )
                          : "rounded-bl-2xl border border-white/15 bg-white/10 text-white/85 backdrop-blur-xl shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {message.animateTyping ? (
                          <TypedText
                            text={message.text}
                            speedMs={message.typingSpeedMs}
                          />
                        ) : (
                          message.text
                        )}
                      </p>
                    </div>
                  )}

                  {message.media && message.media.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {message.media.map((item) =>
                        item.type === "image" ? (
                          <img
                            key={item.id}
                            src={item.url}
                            alt={item.name}
                            className="h-40 w-full cursor-zoom-in rounded-2xl object-cover"
                            loading="lazy"
                            onClick={() => setActiveImageUrl(item.url)}
                          />
                        ) : (
                          <video
                            key={item.id}
                            src={item.url}
                            controls
                            className="h-40 w-full rounded-2xl object-cover"
                          />
                        )
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "text-[10px] uppercase tracking-[0.3em] text-white/40",
                      isMe ? "text-right" : "text-left"
                    )}
                  >
                    {timestamp}
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
          {agentTypingLabel && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <div className="flex h-6 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:240ms]" />
              </div>
              <span>{agentTypingLabel}</span>
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 px-6 py-4 backdrop-blur-2xl">
        {pendingMedia.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
            {pendingMedia.map((item) => (
              <div
                key={item.id}
                className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20"
              >
                {item.type === "image" ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={item.previewUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {typingIndicator && (
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white/40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white/60" />
            </span>
            Typing...
          </div>
        )}
        {sendError && (
          <div className="mb-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {sendError}
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const attachments = createMediaAttachments(event.target.files);
                if (attachments.length > 0) {
                  setPendingMedia((prev) => [...prev, ...attachments]);
                }
              }}
            />
            <Paperclip className="h-5 w-5" />
          </label>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSendError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !isTouchInput) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder="Type a message..."
            enterKeyHint={isTouchInput ? "enter" : "send"}
            className="min-h-11 max-h-36 flex-1 resize-none overflow-y-auto rounded-3xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm leading-6 text-white/90 placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setActiveImageUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={activeImageUrl}
              alt="Attachment preview"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setActiveImageUrl(null)}
              className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
