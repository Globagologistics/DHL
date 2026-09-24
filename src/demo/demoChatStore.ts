import { activeSupportAgent } from '../config/supportAgents';
import type { ChatMessage, ChatRole, ChatThreadSummary } from '../types/chat';
import { DEMO_SHIPMENT_RECORD_ID, DEMO_TRACKING_ID, isDemoShipmentEnabled, isDemoShipmentReference } from './demoShipment';

/**
 * Development chat adapter for the demo shipment only. Customer Support and
 * Admin Chat read and write this ONE conversation, so both sides of the
 * exchange can be inspected before the production backend exists. State lives
 * in localStorage and syncs across tabs through `storage` events. Production
 * chat is untouched: every entry point checks isDemoShipmentEnabled().
 */

export const DEMO_THREAD_ID = 'demo-thread-010101010101';
const STORAGE_KEY = 'dhl-dev-demo-chat-v1';

type StoredMessage = Omit<ChatMessage, 'replyTo'>;
type DemoChatState = { messages: StoredMessage[]; unreadForAdmin: number; unreadForUser: number };

export const isDemoThreadId = (threadId?: string | null) => isDemoShipmentEnabled() && threadId === DEMO_THREAD_ID;
export const isDemoChatTarget = (trackingIdOrThreadId?: string | null) => isDemoThreadId(trackingIdOrThreadId) || isDemoShipmentReference(trackingIdOrThreadId);

function seed(): DemoChatState {
  const agent = activeSupportAgent();
  const now = Date.now();
  const support = (id: string, text: string, createdAt: number): StoredMessage => ({ id, trackingId: DEMO_SHIPMENT_RECORD_ID, sender: 'admin', text, createdAt, senderName: agent.name, senderAvatarUrl: agent.avatar, supportProfileId: agent.id });
  return {
    messages: [
      support('demo-seed-1', `Hello 👋 Welcome to DHL Shipment Support. How can I assist you with shipment ${DEMO_TRACKING_ID} today?`, now - 6 * 60_000),
      { id: 'demo-seed-2', trackingId: DEMO_SHIPMENT_RECORD_ID, sender: 'user', text: 'Hi, I would like to know the latest delivery status.', createdAt: now - 4 * 60_000 },
      support('demo-seed-3', 'Your shipment is currently in transit and is moving through our delivery network.', now - 3 * 60_000),
    ],
    unreadForAdmin: 0,
    unreadForUser: 0,
  };
}

function read(): DemoChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoChatState;
  } catch { /* fall through to a fresh seed */ }
  const fresh = seed();
  write(fresh, false);
  return fresh;
}

const listeners = new Set<() => void>();

function write(state: DemoChatState, notify = true) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable: this tab only */ }
  if (notify) listeners.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  // Another tab (for example Admin Chat) changed the conversation.
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) listeners.forEach(listener => listener()); });
}

export function subscribeDemoChat(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Messages with reply targets resolved, oldest first. */
export function getDemoMessages(): ChatMessage[] {
  const messages = read().messages;
  const byId = new Map(messages.map(message => [message.id, message]));
  return messages.map(message => {
    const target = message.replyToMessageId ? byId.get(message.replyToMessageId) : undefined;
    return target ? { ...message, replyTo: { id: target.id, sender: target.sender, senderName: target.senderName, text: target.text, media: target.media, supportProfileId: target.supportProfileId } } : message;
  });
}

export function getDemoThreadSummary(): ChatThreadSummary {
  const state = read();
  const last = state.messages[state.messages.length - 1];
  return {
    id: DEMO_THREAD_ID,
    trackingId: DEMO_SHIPMENT_RECORD_ID,
    participantRole: 'receiver',
    lastMessageAt: last?.createdAt,
    lastMessagePreview: last?.text ?? null,
    unreadForAdmin: state.unreadForAdmin,
    unreadForUser: state.unreadForUser,
  };
}

export function sendDemoMessage(payload: { sender: ChatRole; text?: string; senderName?: string; senderAvatarUrl?: string; replyToMessageId?: string; supportProfileId?: string }): ChatMessage | null {
  const text = payload.text?.trimEnd();
  if (!text) return null;
  const state = read();
  const message: StoredMessage = {
    id: `demo-msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    trackingId: DEMO_SHIPMENT_RECORD_ID,
    sender: payload.sender,
    text,
    createdAt: Date.now(),
    senderName: payload.senderName,
    senderAvatarUrl: payload.senderAvatarUrl,
    replyToMessageId: payload.replyToMessageId,
    supportProfileId: payload.supportProfileId,
  };
  write({
    messages: [...state.messages, message],
    unreadForAdmin: payload.sender === 'user' ? state.unreadForAdmin + 1 : state.unreadForAdmin,
    unreadForUser: payload.sender === 'admin' ? state.unreadForUser + 1 : state.unreadForUser,
  });
  return message;
}

export function markDemoThreadRead(role: ChatRole) {
  const state = read();
  if ((role === 'admin' ? state.unreadForAdmin : state.unreadForUser) === 0) return;
  write(role === 'admin' ? { ...state, unreadForAdmin: 0 } : { ...state, unreadForUser: 0 });
}

/** Restores the three seed messages (Settings developer helper). */
export function resetDemoChat() {
  write(seed());
}
