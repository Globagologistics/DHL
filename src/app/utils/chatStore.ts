import { useSyncExternalStore } from "react";

export type ChatRole = "user" | "admin";
export type MediaType = "image" | "video";

export interface MediaAttachment {
  id: string;
  url: string;
  type: MediaType;
  name: string;
}

export interface Message {
  id: string;
  trackingId: string;
  sender: ChatRole;
  senderName?: string;
  senderAvatarUrl?: string;
  text?: string;
  media?: MediaAttachment[];
  createdAt: number;
  animateTyping?: boolean;
  typingSpeedMs?: number;
}

export interface Thread {
  trackingId: string;
  messages: Message[];
  unreadForAdmin: number;
  unreadForUser: number;
}

interface ChatState {
  threads: Record<string, Thread>;
}

let state: ChatState = {
  threads: {},
};

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getState = () => state;

const ensureThread = (trackingId: string) => {
  const existing = state.threads[trackingId];
  if (existing) return existing;

  const newThread: Thread = {
    trackingId,
    messages: [],
    unreadForAdmin: 0,
    unreadForUser: 0,
  };

  state = {
    ...state,
    threads: {
      ...state.threads,
      [trackingId]: newThread,
    },
  };
  emit();
  return newThread;
};

export const createThread = (trackingId: string) => {
  if (!trackingId) return;
  ensureThread(trackingId);
};

export const sendMessage = (payload: {
  trackingId: string;
  sender: ChatRole;
  senderName?: string;
  senderAvatarUrl?: string;
  text?: string;
  media?: MediaAttachment[];
  animateTyping?: boolean;
  typingSpeedMs?: number;
}) => {
  const trackingId = payload.trackingId.trim();
  if (!trackingId) return;

  const thread = ensureThread(trackingId);
  const message: Message = {
    id: createId(),
    trackingId,
    sender: payload.sender,
    senderName: payload.senderName,
    senderAvatarUrl: payload.senderAvatarUrl,
    text: payload.text?.trim() || undefined,
    media: payload.media && payload.media.length > 0 ? payload.media : undefined,
    createdAt: Date.now(),
    animateTyping: payload.animateTyping,
    typingSpeedMs: payload.typingSpeedMs,
  };

  const updatedThread: Thread = {
    ...thread,
    messages: [...thread.messages, message],
    unreadForAdmin:
      payload.sender === "user" ? thread.unreadForAdmin + 1 : thread.unreadForAdmin,
    unreadForUser:
      payload.sender === "admin" ? thread.unreadForUser + 1 : thread.unreadForUser,
  };

  state = {
    ...state,
    threads: {
      ...state.threads,
      [trackingId]: updatedThread,
    },
  };
  emit();
};

export const markThreadRead = (trackingId: string, role: ChatRole) => {
  const thread = state.threads[trackingId];
  if (!thread) return;

  const updatedThread: Thread = {
    ...thread,
    unreadForAdmin: role === "admin" ? 0 : thread.unreadForAdmin,
    unreadForUser: role === "user" ? 0 : thread.unreadForUser,
  };

  state = {
    ...state,
    threads: {
      ...state.threads,
      [trackingId]: updatedThread,
    },
  };
  emit();
};

export const useChatStore = () =>
  useSyncExternalStore(subscribe, getState, getState);
