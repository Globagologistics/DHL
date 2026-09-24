import { supabase } from '../lib/supabase';
import type { ShipmentDraft } from '../features/shipment-form/ShipmentWizard';

export type ShipmentRequest = {
  id:string; sender_name:string; recipient_name:string; origin:string; destination:string;
  status:'pending'|'approved'|'rejected'; payload:Omit<ShipmentDraft,'imageFiles'>;
  created_at:string; reviewed_at:string|null; shipment_id:string|null; rejection_reason:string|null;
};

export async function submitShipmentRequest(draft:ShipmentDraft) {
  const { imageFiles: _files, ...payload } = draft;
  const { data,error } = await supabase.rpc('submit_shipment_request',{p_payload:payload});
  if (error) throw new Error('Request could not be submitted. The shipment-request service may not be available yet.');
  return data as string;
}

export async function listShipmentRequests():Promise<ShipmentRequest[]> {
  const { data,error } = await supabase.from('shipment_requests').select('id,sender_name,recipient_name,origin,destination,status,payload,created_at,reviewed_at,shipment_id,rejection_reason').order('created_at',{ascending:false}).limit(500);
  if (error) throw new Error('Shipment requests are unavailable. Apply the request migration to enable this queue.');
  return (data||[]) as ShipmentRequest[];
}

export async function updateShipmentRequest(id:string,payload:ShipmentRequest['payload']) {
  const { data,error } = await supabase.from('shipment_requests').update({payload,sender_name:payload.senderName,recipient_name:payload.receiverName,origin:payload.pickupLocation,destination:payload.deliveryAddress}).eq('id',id).eq('status','pending').select('id').maybeSingle();
  if (error || !data) throw new Error(error?.message||'Pending request could not be updated.');
}

export async function approveShipmentRequest(id:string):Promise<string> {
  const { data,error } = await supabase.rpc('approve_shipment_request',{p_request_id:id});
  if (error || !data) throw new Error(error?.message||'Request approval failed.');
  return data as string;
}

export async function rejectShipmentRequest(id:string,reason:string) {
  const { error } = await supabase.rpc('reject_shipment_request',{p_request_id:id,p_reason:reason.trim()});
  if (error) throw new Error(error.message);
}
