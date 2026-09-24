import { DEMO_SHIPMENT_RECORD_ID, buildDemoShipment, isDemoShipmentEnabled } from './demoShipment';
import { applyTransition, deriveLifecycleState, makeEvent } from '../features/shipments/lifecycle';
import type { LifecycleAction } from '../features/shipments/lifecycle';
import type { ShipmentRequest, ShipmentRequestPayload } from '../features/shipments/types';
import type { Shipment, ShipmentWithCheckpoints } from '../types/database';

/**
 * Development data store: a local stand-in for the shipment, request and
 * notification tables so the complete admin/customer workflow can be
 * exercised before the production Supabase project exists.
 *
 * - Enabled only by isDemoShipmentEnabled() (DEV build + VITE_ENABLE_DEMO_SHIPMENT).
 * - Records use the real database row shape (ShipmentWithCheckpoints).
 * - Persisted in localStorage and synced across tabs, so the customer view
 *   and the admin console in two tabs see the same data.
 * - Seeds the demo shipment 010101010101; anything else must be created
 *   through the normal forms. No number is valid unless a record exists.
 */

const KEY = 'dhl-dev-data-v2';
const SEED_VERSION = 2;

export type DevNotification = { id: string; shipmentId: string; trackingNumber: string | null; type: string; message: string; createdAt: string };
type DevState = { version: number; shipments: ShipmentWithCheckpoints[]; requests: ShipmentRequest[]; notifications: DevNotification[] };

const listeners = new Set<() => void>();

function seed(): DevState {
  const demo = buildDemoShipment();
  return {
    version: SEED_VERSION,
    shipments: [demo],
    requests: [],
    notifications: [{ id: 'dev-note-1', shipmentId: demo.id, trackingNumber: demo.tracking_number || null, type: 'shipment_published', message: 'Shipment published and tracking number issued.', createdAt: demo.published_at || demo.created_at }],
  };
}

let memory: DevState | null = null;

function read(): DevState {
  if (memory) return memory;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null') as DevState | null;
    if (parsed?.version === SEED_VERSION) { memory = parsed; return parsed; }
  } catch { /* reseed below */ }
  memory = seed();
  persist(memory, false);
  return memory;
}

function persist(state: DevState, notify = true) {
  memory = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota: keep in memory for this tab */ }
  if (notify) listeners.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    memory = null;
    listeners.forEach(listener => listener());
  });
}

export const devDataEnabled = () => isDemoShipmentEnabled();

export function subscribeDevData(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// ---------- Shipments ----------

export function listDevShipments(): ShipmentWithCheckpoints[] {
  if (!devDataEnabled()) return [];
  return read().shipments.filter(shipment => !shipment.deleted_at);
}

/** Finds by record id, or by 12-digit tracking number (published shipments only). */
export function findDevShipment(reference: string | null | undefined): ShipmentWithCheckpoints | null {
  if (!devDataEnabled() || !reference) return null;
  const value = reference.trim();
  const digits = /^[\d\s-]+$/.test(value) ? value.replace(/\D/g, '') : '';
  return read().shipments.find(shipment => !shipment.deleted_at && (shipment.id === value || (digits.length === 12 && shipment.is_published && shipment.tracking_number === digits))) || null;
}

export const isDevShipmentId = (id: string | null | undefined) => Boolean(id && devDataEnabled() && read().shipments.some(shipment => shipment.id === id));

/** "Daniel Carter · 0101 0101 0101" for admin lists, or null for non-development records. */
export function devShipmentLabel(id: string | null | undefined): string | null {
  const shipment = id ? findDevShipment(id) : null;
  if (!shipment) return null;
  const ref = shipment.tracking_number ? shipment.tracking_number.replace(/(\d{4})(?=\d)/g, '$1 ') : 'Not published';
  return `${shipment.receiver_name || 'Customer'} · ${ref}`;
}

function replaceShipment(next: ShipmentWithCheckpoints) {
  const state = read();
  persist({ ...state, shipments: state.shipments.map(item => item.id === next.id ? next : item) });
}

export function createDevShipment(row: Partial<Shipment>): ShipmentWithCheckpoints {
  const now = new Date().toISOString();
  const id = row.id || crypto.randomUUID();
  const shipment = {
    admin_id: 'dev-admin', sender_name: '', sender_phone: '', receiver_name: '', receiver_phone: '', delivery_address: '',
    transportation: 'Air Freight', paid: false, paused: false, stopped: false, terminated: false, current_checkpoint_index: 0,
    status: 'processing', is_published: false, lifecycle_state: 'scheduled', images: [],
    ...row,
    id, tracking_number: null, created_at: now, updated_at: now, checkpoints: [],
    lifecycle_events: [makeEvent('created', 'Shipment created', now)],
  } as ShipmentWithCheckpoints;
  const state = read();
  persist({ ...state, shipments: [shipment, ...state.shipments] });
  return shipment;
}

export function updateDevShipment(id: string, patch: Partial<Shipment>): ShipmentWithCheckpoints {
  const current = findDevShipment(id);
  if (!current) throw new Error('Shipment not found.');
  const next = { ...current, ...patch, id, updated_at: new Date().toISOString() } as ShipmentWithCheckpoints;
  replaceShipment(next);
  return next;
}

/** Collision-checked 12-digit number (first digit never 0), like generate_tracking_number(). */
function nextTrackingNumber(): string {
  const taken = new Set(read().shipments.map(shipment => shipment.tracking_number).filter(Boolean));
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint32Array(2));
    const candidate = String(100000000000 + ((bytes[0] * 4294967296 + bytes[1]) % 900000000000));
    if (!taken.has(candidate)) return candidate;
  }
}

const notificationTypes: Record<LifecycleAction, string> = { publish: 'shipment_published', start: 'shipment_started', pause: 'on_hold', resume: 'released', stop: 'on_hold', restart: 'released', deliver: 'delivered', cancel: 'cancelled', terminate: 'terminated' };

export function transitionDevShipment(id: string, action: LifecycleAction, reason = ''): ShipmentWithCheckpoints {
  const current = findDevShipment(id);
  if (!current) throw new Error('Shipment not found.');
  const next = applyTransition(current, action, reason, new Date(), action === 'publish' ? nextTrackingNumber() : undefined) as ShipmentWithCheckpoints;
  replaceShipment(next);
  const last = next.lifecycle_events?.[next.lifecycle_events.length - 1];
  addDevNotification({ shipmentId: id, trackingNumber: next.tracking_number || null, type: notificationTypes[action], message: `${last?.title || action}${reason ? ` · ${reason}` : ''}` });
  return next;
}

export function addDevShipmentUpdate(id: string, title: string, location: string, point: { lat: number; lng: number } | null = null) {
  const current = findDevShipment(id);
  if (!current) throw new Error('Shipment not found.');
  const event = { ...makeEvent('update', title, new Date().toISOString(), null, location || null), lat: point?.lat ?? null, lng: point?.lng ?? null };
  replaceShipment({ ...current, lifecycle_events: [...(current.lifecycle_events || []), event], updated_at: event.at });
  addDevNotification({ shipmentId: id, trackingNumber: current.tracking_number || null, type: 'shipment_status_changed', message: `${title}${location ? ` · ${location}` : ''}` });
}

export function softDeleteDevShipment(id: string) {
  const current = findDevShipment(id);
  if (!current) throw new Error('Shipment not found.');
  if (['in_transit', 'paused', 'stopped'].includes(deriveLifecycleState(current))) throw new Error('Active shipments cannot be deleted. Stop or terminate them first.');
  replaceShipment({ ...current, deleted_at: new Date().toISOString() });
}

// ---------- Requests ----------

export const listDevRequests = (): ShipmentRequest[] => devDataEnabled() ? read().requests : [];
export const isDevRequestId = (id: string) => devDataEnabled() && read().requests.some(request => request.id === id);

export function submitDevRequest(payload: ShipmentRequestPayload): string {
  const request: ShipmentRequest = {
    id: crypto.randomUUID(), sender_name: payload.senderName, recipient_name: payload.receiverName,
    origin: payload.pickupLocation, destination: payload.deliveryAddress, status: 'pending', payload,
    created_at: new Date().toISOString(), reviewed_at: null, shipment_id: null, rejection_reason: null,
  };
  const state = read();
  persist({ ...state, requests: [request, ...state.requests] });
  addDevNotification({ shipmentId: '', trackingNumber: null, type: 'shipment_request_submitted', message: `New shipment request from ${payload.senderName}` });
  return request.id;
}

export function updateDevRequest(id: string, patch: Partial<ShipmentRequest>) {
  const state = read();
  const current = state.requests.find(request => request.id === id);
  if (!current) throw new Error('Request not found.');
  if (current.status !== 'pending') throw new Error('Only pending requests can be changed.');
  persist({ ...state, requests: state.requests.map(request => request.id === id ? { ...request, ...patch } : request) });
}

/** Approval creates a SCHEDULED shipment; publishing is a separate admin step. */
export function approveDevRequest(id: string, row: Partial<Shipment>): string {
  const request = read().requests.find(item => item.id === id);
  if (!request || request.status !== 'pending') throw new Error('Request is not pending.');
  const shipment = createDevShipment(row);
  const state = read();
  persist({ ...state, requests: state.requests.map(item => item.id === id ? { ...item, status: 'approved', reviewed_at: new Date().toISOString(), shipment_id: shipment.id } : item) });
  return shipment.id;
}

export function rejectDevRequest(id: string, reason: string) {
  const state = read();
  const request = state.requests.find(item => item.id === id);
  if (!request || request.status !== 'pending') throw new Error('Request is not pending.');
  persist({ ...state, requests: state.requests.map(item => item.id === id ? { ...item, status: 'rejected', reviewed_at: new Date().toISOString(), rejection_reason: reason.trim() } : item) });
}

// ---------- Notifications ----------

export const listDevNotifications = (): DevNotification[] => devDataEnabled() ? [...read().notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];

function addDevNotification(note: Omit<DevNotification, 'id' | 'createdAt'>) {
  const state = read();
  persist({ ...state, notifications: [{ ...note, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...state.notifications].slice(0, 200) });
}

/** Restores the seeded demo shipment and clears development records. */
export function resetDevData() {
  persist(seed());
}

export const DEV_DEMO_ID = DEMO_SHIPMENT_RECORD_ID;
