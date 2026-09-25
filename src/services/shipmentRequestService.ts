import { supabase } from '../lib/supabase';
import { approveDevRequest, devDataEnabled, isDevRequestId, listDevRequests, rejectDevRequest, submitDevRequest, updateDevRequest } from '../demo/devDataStore';
import { draftToRow, storePackagePhotos } from './shipmentWorkflowService';
import type { PackagePhoto } from './shipmentWorkflowService';
import type { ShipmentDraft, ShipmentRequest, ShipmentRequestPayload } from '../features/shipments/types';

export type { ShipmentRequest, ShipmentRequestPayload };

/**
 * Public shipment requests. A request never becomes a live shipment by
 * itself: approval creates a SCHEDULED shipment, which the admin publishes
 * (tracking number) and starts separately.
 */

const MIGRATION_HINT = 'Shipment requests need the request migrations (applied during deployment).';

/** Only the customer-facing fields of a draft travel in a new request. */
export function requestPayloadFromDraft(draft: ShipmentDraft, images: string[]): ShipmentRequestPayload {
  return {
    ...draft,
    senderName: draft.senderName.trim(), senderPhone: draft.senderPhone.trim(), pickupLocation: draft.pickupLocation.trim(),
    receiverName: draft.receiverName.trim(), receiverPhone: draft.receiverPhone.trim(), receiverEmail: draft.receiverEmail.trim(), deliveryAddress: draft.deliveryAddress.trim(),
    packageName: draft.packageName.trim(), packageValue: draft.packageValue.trim(), outstandingAmount: draft.outstandingAmount.trim(),
    carrierRole: draft.carrierRole.trim(), carrierName: draft.carrierName.trim(), images, checkpoints: [],
    estimatedDeliveryAt: draft.estimatedDelivery ? new Date(draft.estimatedDelivery).toISOString() : undefined,
  };
}

export async function submitShipmentRequest(draft: ShipmentDraft, photos: PackagePhoto[]): Promise<string> {
  const development = devDataEnabled();
  const images = await storePackagePhotos(photos, `requests/${crypto.randomUUID()}`, development);
  const payload = requestPayloadFromDraft(draft, images);
  if (development) return submitDevRequest(payload);
  const { data, error } = await supabase.rpc('submit_shipment_request', { p_payload: payload });
  if (error) throw new Error('Your request could not be submitted right now. Please try again shortly.');
  return data as string;
}

export async function listShipmentRequests(): Promise<ShipmentRequest[]> {
  const development = listDevRequests();
  const { data, error } = await supabase.from('shipment_requests').select('id,sender_name,recipient_name,origin,destination,status,payload,created_at,reviewed_at,shipment_id,rejection_reason').order('created_at', { ascending: false }).limit(500);
  if (error && !devDataEnabled()) throw new Error(MIGRATION_HINT);
  return [...development, ...((error ? [] : data) || []) as ShipmentRequest[]].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Saves admin edits (including operational fields) on a pending request. */
export async function updateShipmentRequest(id: string, payload: ShipmentRequestPayload): Promise<void> {
  const columns = { payload, sender_name: payload.senderName, recipient_name: payload.receiverName, origin: payload.pickupLocation, destination: payload.deliveryAddress };
  if (isDevRequestId(id)) { updateDevRequest(id, columns); return; }
  const { data, error } = await supabase.from('shipment_requests').update(columns).eq('id', id).eq('status', 'pending').select('id').maybeSingle();
  if (error || !data) throw new Error('The request could not be saved. It may already have been reviewed.');
}

/** Returns the new SCHEDULED shipment's id. */
export async function approveShipmentRequest(id: string, draft: ShipmentDraft): Promise<string> {
  if (isDevRequestId(id)) return approveDevRequest(id, draftToRow(draft));
  // The server needs an absolute time; datetime-local values carry no timezone.
  await updateShipmentRequest(id, { ...requestPayloadFromDraft(draft, draft.images), ...draft, estimatedDeliveryAt: draftToRow(draft).estimated_delivery_at ?? undefined });
  const { data, error } = await supabase.rpc('approve_shipment_request', { p_request_id: id });
  if (error || !data) throw new Error(error?.message && !/does not exist/i.test(error.message) ? error.message : 'Approval failed. Please try again.');
  return data as string;
}

export async function rejectShipmentRequest(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error('Enter a reason for rejecting this request.');
  if (isDevRequestId(id)) { rejectDevRequest(id, reason); return; }
  const { error } = await supabase.rpc('reject_shipment_request', { p_request_id: id, p_reason: reason.trim() });
  if (error) throw new Error('The request could not be rejected. Please try again.');
}
