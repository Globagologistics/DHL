import { supabase } from '../lib/supabase';
import { uploadImageToPath } from './shipmentService';
import { addDevShipmentUpdate, createDevShipment, devDataEnabled, findDevShipment, isDevShipmentId, softDeleteDevShipment, transitionDevShipment, updateDevShipment } from '../demo/devDataStore';
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

export type PhotoStatus = 'uploading' | 'uploaded' | 'failed';

/**
 * A package image in the form. `url` is what the browser shows and what the
 * shipment record stores; `path` is the Supabase Storage object key, kept so
 * the image can be removed again. `file` exists only between choosing a file
 * and a successful upload (and for a retry), and is never persisted.
 */
export type PackagePhoto = { id: string; url: string; path?: string; name?: string; status?: PhotoStatus; error?: string; file?: File };

export const PACKAGE_IMAGE_BUCKET = 'shipment-images';
export const PACKAGE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Matches the shipment-images bucket limit set in migration 20260929000000. */
export const PACKAGE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const extensionFor = (file: File) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[file.type] || 'bin';

/**
 * Deterministic, admin-scoped object key. The folder is the draft id, which
 * becomes the shipment id on creation, so an image uploaded during the wizard
 * already sits at its permanent location and never needs to be moved.
 */
export const packagePhotoPath = (scope: 'shipments' | 'requests', draftId: string, photoId: string, file: File) =>
  `${scope}/${draftId}/${photoId}.${extensionFor(file)}`;

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
 * Uploads one chosen image straight away, so the form can survive a refresh
 * and so a storage problem surfaces while the admin is still on that step
 * rather than at submit. Returns the photo with its canonical reference, or
 * with status 'failed' and a readable reason.
 */
export async function uploadPackagePhoto(photo: PackagePhoto, scope: 'shipments' | 'requests', draftId: string): Promise<PackagePhoto> {
  const file = photo.file;
  if (!file) return { ...photo, status: 'uploaded' };
  if (await usesDevelopmentWrites()) {
    try { return { ...photo, url: await toCompactDataUrl(file), file: undefined, status: 'uploaded' }; }
    catch { return { ...photo, status: 'failed', error: 'The image could not be prepared.' }; }
  }
  const path = packagePhotoPath(scope, draftId, photo.id, file);
  const { url, error } = await uploadImageToPath(PACKAGE_IMAGE_BUCKET, file, path);
  if (error || !url) {
    if (import.meta.env.DEV) console.warn('Package image upload failed:', { path, error });
    return { ...photo, status: 'failed', error: uploadMessage(error) };
  }
  return { ...photo, url, path, file: undefined, status: 'uploaded', error: undefined };
}

/**
 * Removes a draft image so a discarded or replaced picture leaves nothing
 * behind. storage-api answers 200 with an empty list when RLS hides the row,
 * so an empty result is reported rather than treated as success.
 */
export async function removePackagePhoto(photo: PackagePhoto): Promise<boolean> {
  if (!photo.path) return true;
  try {
    const { data, error } = await supabase.storage.from(PACKAGE_IMAGE_BUCKET).remove([photo.path]);
    const removed = !error && Array.isArray(data) && data.length > 0;
    if (!removed && import.meta.env.DEV) console.warn('Package image was not removed from storage:', { path: photo.path, error });
    return removed;
  } catch (cause) {
    if (import.meta.env.DEV) console.warn('Package image removal failed:', cause);
    return false;
  }
}

function uploadMessage(error: string | null): string {
  const text = error || '';
  if (/row-level security|Unauthorized|AccessDenied/i.test(text)) return 'Storage refused this upload. Sign in with the administrator account and try again.';
  if (/mime type|InvalidMimeType/i.test(text)) return 'That file type is not accepted. Use JPEG, PNG or WebP.';
  if (/exceeded the maximum|EntityTooLarge|Payload too large/i.test(text)) return 'That image is larger than 10 MB.';
  if (/Bucket not found/i.test(text)) return 'The shipment-images bucket is missing from this Supabase project.';
  if (/timed out|Failed to fetch|NetworkError/i.test(text)) return 'The upload could not reach storage. Check the connection and retry.';
  return text || 'Could not upload. Please try again.';
}

/**
 * Every photo must already be stored before a shipment is written, so no
 * blob:, data: or local path can ever reach the database.
 */
export function packagePhotoUrls(photos: PackagePhoto[]): string[] {
  const pending = photos.filter(photo => photo.status === 'uploading');
  if (pending.length) throw new Error('Wait for the package images to finish uploading.');
  const failed = photos.filter(photo => photo.status === 'failed' || !photo.url);
  if (failed.length) throw new Error('Retry or remove the images that failed to upload.');
  const local = photos.filter(photo => /^(blob:|data:)/i.test(photo.url) && !photo.url.startsWith('data:image/'));
  if (local.length) throw new Error('Some images are still only in this browser. Re-add them and wait for the upload.');
  return photos.map(photo => photo.url);
}

/**
 * Creates a SCHEDULED shipment. Nothing is published or moving yet.
 * `draftId` is the id the wizard already used as the image folder, so the
 * uploaded objects belong to this shipment from the start.
 */
export async function createScheduledShipment(draft: ShipmentDraft, photos: PackagePhoto[], draftId?: string): Promise<string> {
  const id = draftId || crypto.randomUUID();
  const development = await usesDevelopmentWrites();
  const images = packagePhotoUrls(photos);
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

/**
 * Reads the shipment back from the database after creating it. The draft is
 * only discarded once this succeeds, so a write that silently did not land
 * never costs the admin their work.
 */
export async function confirmShipmentExists(id: string): Promise<Shipment> {
  if (isDevShipmentId(id)) {
    const row = findDevShipment(id);
    if (!row) throw new Error('The shipment could not be confirmed. Your draft has been kept.');
    return row as Shipment;
  }
  const { data, error } = await supabase.from('shipments').select('*').eq('id', id).limit(1);
  const row = (data as Shipment[] | null)?.[0];
  if (error || !row) throw new Error('The shipment was not found after saving. Your draft has been kept — please try again.');
  return row;
}

export async function updateShipmentDetails(id: string, draft: ShipmentDraft, photos: PackagePhoto[]): Promise<void> {
  const development = isDevShipmentId(id);
  const images = packagePhotoUrls(photos);
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
