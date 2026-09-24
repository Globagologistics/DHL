import { supabase } from '../lib/supabase';
import { findDevShipment } from '../demo/devDataStore';

/** Customer tracking numbers are exactly 12 numeric digits. */
export const TRACKING_NUMBER_LENGTH = 12;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECENT_TRACKING_KEY = 'dhl-recent-tracking-number';

export const normalizeTrackingInput = (value: string) => value.replace(/\D/g, '').slice(0, TRACKING_NUMBER_LENGTH);
export const isTrackingNumber = (value: string) => /^\d{12}$/.test(value);
/** Older links and admin screens use the shipment's UUID record id. */
export const isShipmentRecordId = (value: string) => UUID_PATTERN.test(value);
export const formatTrackingNumber = (value: string) => isTrackingNumber(value) ? value.replace(/(\d{4})(?=\d)/g, '$1 ') : value;

/** The reference to show a person: the 12-digit number once the database provides one. */
export const trackingReferenceFor = (shipment: { id: string; tracking_number?: string | null }) => shipment.tracking_number || shipment.id;
export const displayTrackingReference = (shipment: { id: string; tracking_number?: string | null }) =>
  shipment.tracking_number ? formatTrackingNumber(shipment.tracking_number) : shipment.id.slice(0, 13).toUpperCase();

/**
 * Accepts a 12-digit number (spaces or dashes allowed) or a legacy UUID and
 * returns the column to query, or null when the reference cannot be valid.
 */
export function resolveShipmentReference(reference: string): { column: 'tracking_number' | 'id'; value: string } | null {
  const trimmed = reference.trim();
  if (isShipmentRecordId(trimmed)) return { column: 'id', value: trimmed };
  if (/^[\d\s-]+$/.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, '');
    if (isTrackingNumber(digits)) return { column: 'tracking_number', value: digits };
  }
  return null;
}

export type TrackingLookupResult =
  | { status: 'found'; shipmentId: string; trackingNumber: string | null }
  | { status: 'not_found' }
  | { status: 'error' };

type ShipmentReferenceRow = { id: string; tracking_number?: string | null };
type QueryError = { code?: string; message?: string } | null;

const LOOKUP_TIMEOUT_MS = 15_000;

/**
 * Before migration 20260925000000 the tracking_number column does not exist.
 * No shipment can then carry a 12-digit number, so the honest answer for a
 * well-formed number is "not found", not a connection problem.
 */
export function isMissingTrackingColumn(error: QueryError) {
  return Boolean(error && (error.code === '42703' || (/tracking_number/i.test(error.message || '') && /does not exist|could not find/i.test(error.message || ''))));
}

export function withLookupTimeout<T>(request: PromiseLike<T>): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error('Shipment lookup timed out')), LOOKUP_TIMEOUT_MS); });
  return Promise.race([Promise.resolve(request), timeout]).finally(() => window.clearTimeout(timer));
}

/**
 * Resolves a customer reference to a shipment. Only a completed request with
 * no matching row is 'not_found'; network failures, timeouts and server
 * errors are 'error', so a technical problem is never shown as a wrong number.
 */
export async function lookupShipmentReference(reference: string): Promise<TrackingLookupResult> {
  // Development data store (only when VITE_ENABLE_DEMO_SHIPMENT is on in a dev build).
  const devShipment = findDevShipment(reference);
  if (devShipment) return { status: 'found', shipmentId: devShipment.id, trackingNumber: devShipment.tracking_number ?? null };
  const target = resolveShipmentReference(reference);
  if (!target) return { status: 'not_found' };
  try {
    // select('*') works before and after the tracking_number migration.
    const { data, error } = await withLookupTimeout<{ data: unknown; error: QueryError }>(supabase.from('shipments').select('*').eq(target.column, target.value).limit(1));
    if (error) {
      if (target.column === 'tracking_number' && isMissingTrackingColumn(error)) return { status: 'not_found' };
      if (import.meta.env.DEV) console.warn('Shipment lookup failed:', error);
      return { status: 'error' };
    }
    const row = (data as ShipmentReferenceRow[] | null)?.[0];
    return row ? { status: 'found', shipmentId: row.id, trackingNumber: row.tracking_number ?? null } : { status: 'not_found' };
  } catch {
    return { status: 'error' };
  }
}

/** Remembers the last found tracking number for this tab so WhatsApp can reference it. */
export function rememberTrackingNumber(value: string) {
  try { sessionStorage.setItem(RECENT_TRACKING_KEY, value); } catch { /* storage unavailable */ }
}

export function recentTrackingNumber(): string | null {
  try { return sessionStorage.getItem(RECENT_TRACKING_KEY); } catch { return null; }
}
