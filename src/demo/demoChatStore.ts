import { activeSupportAgent } from '../config/supportAgents';
import type { ChatMessage, ChatRole, ChatThreadSummary } from '../types/chat';
import { DEMO_SHIPMENT_RECORD_ID, DEMO_TRACKING_ID } from './demoShipment';
import { devDataEnabled, findDevShipment, isDevShipmentId } from './devDataStore';

/**
 * Development chat adapter for development-store shipments. Customer Support
 * and Admin Chat read and write the SAME conversation per shipment (one
 * browser, synced across tabs). Production chat is untouched: every entry
 * point checks that the shipment belongs to the development store.
 *
 * Deletion mirrors the production RPC: the message keeps its row with
 * deletedAt set and its text/media removed, so customers never see it and
 * admins see an audit marker.
 */

const STORAGE_KEY = 'dhl-dev-chat-v2';
const THREAD_PREFIX = 'dev-thread-';

type StoredMessage = Omit<ChatMessage, 'replyTo'>;
type ThreadState = { messages: StoredMessage[]; unreadForAdmin: number; unreadForUser: number };
type ChatState = Record<string, ThreadState>;

export const threadIdFor = (shipmentId: string) => `${THREAD_PREFIX}${shipmentId}`;
const shipmentIdOf = (threadId: string) => threadId.slice(THREAD_PREFIX.length);

export const isDemoThreadId = (threadId?: string | null) => Boolean(threadId && devDataEnabled() && threadId.startsWith(THREAD_PREFIX) && isDevShipmentId(shipmentIdOf(threadId)));
/** A development thread id, or the record id / tracking number of a development shipment. */
export const isDemoChatTarget = (value?: string | null) => isDemoThreadId(value) || Boolean(value && findDevShipment(value));

function seedDemoThread(): ThreadState {
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

const listeners = new Set<() => void>();
let memory: ChatState | null = null;

function read(): ChatState {
  if (memory) return memory;
  try { memory = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as ChatState | null; } catch { memory = null; }
  if (!memory) { memory = { [DEMO_SHIPMENT_RECORD_ID]: seedDemoThread() }; write(memory, false); }
  return memory;
}

function write(state: ChatState, notify = true) {
  memory = state;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* this tab only */ }
  if (notify) listeners.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { memory = null; listeners.forEach(listener => listener()); } });
}

export function subscribeDemoChat(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const threadState = (shipmentId: string): ThreadState => read()[shipmentId] || { messages: [], unreadForAdmin: 0, unreadForUser: 0 };
const resolveShipmentId = (target: string) => target.startsWith(THREAD_PREFIX) ? shipmentIdOf(target) : findDevShipment(target)?.id || target;

/**
 * Messages oldest first. Customers never receive deleted messages or quotes
 * of them; admins receive deleted messages as content-free audit markers.
 */
export function getDemoMessages(target: string, viewer: ChatRole = 'admin'): ChatMessage[] {
  const messages = threadState(resolveShipmentId(target)).messages;
  const visible = viewer === 'user' ? messages.filter(message => !message.deletedAt) : messages;
  const byId = new Map(messages.map(message => [message.id, message]));
  return visible.map(message => {
    const target = message.replyToMessageId ? byId.get(message.replyToMessageId) : undefined;
    if (!target) return message;
    if (target.deletedAt) return viewer === 'user' ? { ...message, replyToMessageId: undefined } : { ...message, replyTo: { id: target.id, sender: target.sender, senderName: target.senderName, deleted: true } };
    return { ...message, replyTo: { id: target.id, sender: target.sender, senderName: target.senderName, text: target.text, media: target.media, supportProfileId: target.supportProfileId } };
  });
}

export function getDemoThreadSummary(target: string): ChatThreadSummary {
  const shipmentId = resolveShipmentId(target);
  const state = threadState(shipmentId);
  const last = [...state.messages].reverse().find(message => !message.deletedAt);
  return {
    id: threadIdFor(shipmentId),
    trackingId: shipmentId,
    participantRole: 'receiver',
    lastMessageAt: last?.createdAt,
    lastMessagePreview: last?.text ?? null,
    unreadForAdmin: state.unreadForAdmin,
    unreadForUser: state.unreadForUser,
  };
}

/** Every development conversation that has at least one message. */
export function listDemoThreads(): ChatThreadSummary[] {
  if (!devDataEnabled()) return [];
  return Object.keys(read()).filter(id => isDevShipmentId(id) && threadState(id).messages.length).map(id => getDemoThreadSummary(id));
}

export function sendDemoMessage(target: string, payload: { sender: ChatRole; text?: string; senderName?: string; senderAvatarUrl?: string; replyToMessageId?: string; supportProfileId?: string }): ChatMessage | null {
  const text = payload.text?.trimEnd();
  if (!text) return null;
  const shipmentId = resolveShipmentId(target);
  const state = read();
  const thread = threadState(shipmentId);
  const message: StoredMessage = {
    id: `dev-msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    trackingId: shipmentId,
    sender: payload.sender,
    text,
    createdAt: Date.now(),
    senderName: payload.senderName,
    senderAvatarUrl: payload.senderAvatarUrl,
    replyToMessageId: payload.replyToMessageId,
    supportProfileId: payload.supportProfileId,
  };
  write({
    ...state,
    [shipmentId]: {
      messages: [...thread.messages, message],
      unreadForAdmin: payload.sender === 'user' ? thread.unreadForAdmin + 1 : thread.unreadForAdmin,
      unreadForUser: payload.sender === 'admin' ? thread.unreadForUser + 1 : thread.unreadForUser,
    },
  });
  return message;
}

/** Admin-only: removes a SUPPORT message from the customer's conversation. */
export function deleteDemoMessage(threadId: string, messageId: string) {
  const shipmentId = resolveShipmentId(threadId);
  const state = read();
  const thread = threadState(shipmentId);
  const target = thread.messages.find(message => message.id === messageId);
  if (!target) throw new Error('Message not found.');
  if (target.sender !== 'admin') throw new Error('Only support messages can be deleted.');
  write({ ...state, [shipmentId]: { ...thread, messages: thread.messages.map(message => message.id === messageId ? { ...message, text: undefined, media: undefined, deletedAt: Date.now() } : message) } });
}

export function markDemoThreadRead(threadId: string, role: ChatRole) {
  const shipmentId = resolveShipmentId(threadId);
  const state = read();
  const thread = threadState(shipmentId);
  if ((role === 'admin' ? thread.unreadForAdmin : thread.unreadForUser) === 0) return;
  write({ ...state, [shipmentId]: role === 'admin' ? { ...thread, unreadForAdmin: 0 } : { ...thread, unreadForUser: 0 } });
}

/** Restores the seed conversation and clears other development chats. */
export function resetDemoChat() {
  write({ [DEMO_SHIPMENT_RECORD_ID]: seedDemoThread() });
}
