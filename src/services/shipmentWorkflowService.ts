import { supabase } from '../lib/supabase';
import { uploadImage } from './shipmentService';
import { addDevShipmentUpdate, createDevShipment, devDataEnabled, isDevShipmentId, softDeleteDevShipment, transitionDevShipment, updateDevShipment } from '../demo/devDataStore';
import type { LifecycleAction } from '../features/shipments/lifecycle';
import type { RoutePoint, ShipmentDraft, ShipmentRoute } from '../features/shipments/types';
import type { Shipment } from '../types/database';

/**
 * Shipment workflow: create → publish → start → pause/stop/… → deliver.
 *
 * Production path: Supabase inserts plus the SECURITY DEFINER RPCs from
 * migration 20260926000000 (publish_shipment, transition_shipment,
 * add_shipment_update, soft_delete_shipment), which enforce admin access and
 * the same transition rules as src/features/shipments/lifecycle.ts.
 *
 * Development path: when the development data store is enabled and no admin
 * is signed in (dev bypass), records live in src/demo/devDataStore.ts.
 */

export type PackagePhoto = { id: string; url: string; file?: File };

const MIGRATION_HINT = 'This action needs the shipment-lifecycle migration (20260926000000), applied during deployment.';

function friendly(error: { message?: string; code?: string } | null, fallback: string): Error {
  const message = error?.message || '';
  if (error?.code === 'PGRST204' || error?.code === '42703' || error?.code === 'PGRST202' || /does not exist|could not find/i.test(message)) return new Error(MIGRATION_HINT);
  if (error?.code === '42501' || /admin access required|permission denied/i.test(message)) return new Error('Only the administrator can do this. Sign in with the admin account.');
  // Server-side rule violations are written for people (for example "Enter a reason").
  if (error?.code === 'P0001' && message) return new Error(message);
  return new Error(fallback);
}

/** Development writes when the store is on and nobody is signed in (dev bypass). */
export async function usesDevelopmentWrites(): Promise<boolean> {
  if (!devDataEnabled()) return false;
  const { data } = await supabase.auth.getSession();
  return !data?.session;
}

const numberOrNull = (value: string) => { const parsed = Number(value); return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null; };

/** Wizard values → shipment columns (lifecycle columns are set separately). */
export function draftToRow(draft: ShipmentDraft): Partial<Shipment> {
  const estimate = draft.estimatedDelivery ? new Date(draft.estimatedDelivery) : null;
  return {
    sender_name: draft.senderName.trim(),
    sender_phone: draft.senderPhone.trim(),
    pickup_location: draft.pickupLocation.trim(),
    receiver_name: draft.receiverName.trim(),
    receiver_phone: draft.receiverPhone.trim(),
    receiver_email: draft.receiverEmail.trim(),
    delivery_address: draft.deliveryAddress.trim(),
    package_name: draft.packageName.trim(),
    package_value: numberOrNull(draft.packageValue),
    currency: draft.currency,
    payment_status: draft.paymentStatus,
    paid: draft.paymentStatus === 'paid',
    outstanding_amount: draft.paymentStatus === 'pending' ? numberOrNull(draft.outstandingAmount) : null,
    estimated_delivery_at: estimate && Number.isFinite(estimate.getTime()) ? estimate.toISOString() : null,
    transportation: draft.transportation,
    carrier_role: draft.carrierRole.trim() || null,
    driver_name: draft.carrierName.trim(),
    images: draft.images,
    origin_lat: draft.route.origin?.lat ?? null,
    origin_lng: draft.route.origin?.lng ?? null,
    destination_lat: draft.route.destination?.lat ?? null,
    destination_lng: draft.route.destination?.lng ?? null,
    origin_location_label: draft.route.origin ? draft.route.origin.detail || draft.route.origin.label || null : null,
    destination_location_label: draft.route.destination ? draft.route.destination.detail || draft.route.destination.label || null : null,
  };
}

/** Local datetime-local string (YYYY-MM-DDTHH:mm) for an ISO timestamp. */
export function toDateTimeLocal(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function draftFromShipment(shipment: Shipment): ShipmentDraft {
  const point = (lat?: number | null, lng?: number | null, label?: string | null) => (lat != null && lng != null ? { lat, lng, label: label?.split(',').slice(0, 2).join(',') || undefined, detail: label || undefined, source: 'selected' as const } : null);
  return {
    senderName: shipment.sender_name || '', senderPhone: shipment.sender_phone || '', pickupLocation: shipment.pickup_location || '',
    receiverName: shipment.receiver_name || '', receiverPhone: shipment.receiver_phone || '', receiverEmail: shipment.receiver_email || '', deliveryAddress: shipment.delivery_address || '',
    packageName: shipment.package_name || '', packageValue: shipment.package_value != null ? String(shipment.package_value) : '', currency: shipment.currency || 'USD',
    paymentStatus: shipment.payment_status || (shipment.paid ? 'paid' : 'unpaid'), outstandingAmount: shipment.outstanding_amount != null ? String(shipment.outstanding_amount) : '',
    images: (shipment.images || []).filter(Boolean),
    estimatedDelivery: toDateTimeLocal(shipment.estimated_delivery_at),
    transportation: (shipment.transportation as ShipmentDraft['transportation']) || 'Air Freight',
    carrierRole: shipment.carrier_role || '', carrierName: shipment.driver_name || '',
    route: { origin: point(shipment.origin_lat, shipment.origin_lng, shipment.origin_location_label), destination: point(shipment.destination_lat, shipment.destination_lng, shipment.destination_location_label) },
  };
}

/** Downscales a photo to a compact JPEG data URL (development store only). */
async function toCompactDataUrl(file: File, maxSize = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

/**
 * Resolves the uploader's photos to stored URLs in their current order:
 * existing URLs are kept, new files are uploaded to the shipment-images bucket
 * (or stored compactly in development).
 */
export async function storePackagePhotos(photos: PackagePhoto[], folder: string, development: boolean): Promise<string[]> {
  const urls: string[] = [];
  for (const photo of photos) {
    if (!photo.file) { urls.push(photo.url); continue; }
    if (development) { urls.push(await toCompactDataUrl(photo.file)); continue; }
    const { url, error } = await uploadImage('shipment-images', photo.file, folder);
    if (error || !url) throw new Error(`“${photo.file.name}” could not be uploaded. Please try again.`);
    urls.push(url);
  }
  return urls;
}

/** Creates a SCHEDULED shipment. Nothing is published or moving yet. */
export async function createScheduledShipment(draft: ShipmentDraft, photos: PackagePhoto[]): Promise<string> {
  const id = crypto.randomUUID();
  const development = await usesDevelopmentWrites();
  const images = await storePackagePhotos(photos, id, development);
  const row = { ...draftToRow({ ...draft, images }), id };
  if (development) return createDevShipment(row).id;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('Sign in with the administrator account to create shipments.');
  const { error } = await supabase.from('shipments').insert([{
    ...row,
    admin_id: auth.user.id,
    sender_email: '',
    warehouse: '',
    lifecycle_state: 'scheduled',
    status: 'processing',
    is_published: false,
    paused: false,
    stopped: false,
    current_checkpoint_index: 0,
  }]);
  if (error) throw friendly(error, 'The shipment could not be created. Please try again.');
  return id;
}

export async function updateShipmentDetails(id: string, draft: ShipmentDraft, photos: PackagePhoto[]): Promise<void> {
  const development = isDevShipmentId(id);
  const images = await storePackagePhotos(photos, id, development);
  const row = draftToRow({ ...draft, images });
  if (development) { updateDevShipment(id, row); return; }
  const { error } = await supabase.from('shipments').update(row).eq('id', id);
  if (error) throw friendly(error, 'Changes could not be saved. Please try again.');
}

/** Assigns the 12-digit tracking number (server-generated) and makes the shipment trackable. */
export async function publishShipment(id: string): Promise<string> {
  if (isDevShipmentId(id)) return transitionDevShipment(id, 'publish').tracking_number || '';
  const { data, error } = await supabase.rpc('publish_shipment', { p_shipment_id: id });
  if (error || !data) throw friendly(error, 'The shipment could not be published. Please try again.');
  return data as string;
}

export async function transitionShipment(id: string, action: Exclude<LifecycleAction, 'publish'>, reason = ''): Promise<void> {
  if (isDevShipmentId(id)) { transitionDevShipment(id, action, reason); return; }
  const { error } = await supabase.rpc('transition_shipment', { p_shipment_id: id, p_action: action, p_reason: reason.trim() || null });
  if (error) throw friendly(error, 'The shipment status could not be changed. Please try again.');
}

/**
 * Posts a customer-visible tracking update. With a gazetteer location the update
 * becomes a route checkpoint (multi-leg map, current marker position).
 */
export async function addShipmentUpdate(id: string, title: string, location: string, point?: RoutePoint | null): Promise<void> {
  if (!title.trim()) throw new Error('Enter the update customers should see.');
  if (isDevShipmentId(id)) { addDevShipmentUpdate(id, title.trim(), location.trim(), point || null); return; }
  const { error } = await supabase.rpc('add_shipment_update', { p_shipment_id: id, p_title: title.trim(), p_location: location.trim() || null, p_lat: point?.lat ?? null, p_lng: point?.lng ?? null });
  if (error) throw friendly(error, 'The update could not be posted. Please try again.');
}

export async function setShipmentRoute(id: string, route: ShipmentRoute): Promise<void> {
  const patch = {
    origin_lat: route.origin?.lat ?? null, origin_lng: route.origin?.lng ?? null,
    destination_lat: route.destination?.lat ?? null, destination_lng: route.destination?.lng ?? null,
    origin_location_label: route.origin ? route.origin.detail || route.origin.label || null : null,
    destination_location_label: route.destination ? route.destination.detail || route.destination.label || null : null,
  };
  if (isDevShipmentId(id)) { updateDevShipment(id, patch); return; }
  const { error } = await supabase.from('shipments').update(patch).eq('id', id);
  if (error) throw friendly(error, 'The route could not be saved. Please try again.');
}

/** Admin-set position along the route (0–100), or null to follow the journey timeline. */
export async function setRouteProgress(id: string, value: number | null): Promise<void> {
  const route_progress = value == null ? null : Math.round(Math.min(100, Math.max(0, value)));
  if (isDevShipmentId(id)) { updateDevShipment(id, { route_progress }); return; }
  const { error } = await supabase.from('shipments').update({ route_progress }).eq('id', id);
  if (error) throw friendly(error, 'Route progress could not be saved.');
}

/** Hides the shipment from lists and tracking while keeping its history. */
export async function softDeleteShipment(id: string): Promise<void> {
  if (isDevShipmentId(id)) { softDeleteDevShipment(id); return; }
  const { error } = await supabase.rpc('soft_delete_shipment', { p_shipment_id: id });
  if (error) throw friendly(error, 'The shipment could not be deleted.');
}
