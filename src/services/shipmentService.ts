import { supabase } from '../lib/supabase';
import type { Shipment, Checkpoint } from '../types/database';

const IMAGE_UPLOAD_TIMEOUT_MS = 30000;

function sanitizeStorageFileName(fileName: string) {
  const safeName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeName || 'product-image';
}

async function withTimeout<T>(promise: Promise<T>, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), IMAGE_UPLOAD_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function createShipment(shipmentData: Partial<Shipment>) {
  try {
    console.log('📦 Creating shipment with ID:', shipmentData.id);
    console.log('Admin ID:', shipmentData.admin_id);
    
    const { data, error } = await supabase
      .from('shipments')
      .insert([shipmentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }
    
    console.log('✅ Shipment created successfully:', data?.id);
    return { data, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create shipment';
    console.error('❌ Error creating shipment:', errorMsg, error);
    return {
      data: null,
      error: errorMsg,
    };
  }
}

export async function updateShipment(id: string, updates: Partial<Shipment>) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update shipment',
    };
  }
}

export async function deleteShipment(id: string) {
  try {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete shipment',
    };
  }
}

export async function getShipment(id: string) {
  try {
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        *,
        checkpoints (*)
      `)
      .eq('id', id)
      .single();

    if (shipmentError) throw shipmentError;

    // Order checkpoints by checkpoint_order
    if (shipment?.checkpoints) {
      shipment.checkpoints.sort((a: any, b: any) => (a.checkpoint_order || 0) - (b.checkpoint_order || 0));
    }

    return {
      data: shipment,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch shipment',
    };
  }
}

export async function getAdminShipments(adminId: string) {
  try {
    const response = await supabase
      .from('shipments')
      .select(`
        *,
        checkpoints (*)
      `)
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    // log full supabase response for debugging
    console.debug('Supabase getAdminShipments response:', response);

    const { data, error, status, statusText } = response as any;
    if (error) {
      // capture helpful metadata when a server error occurs
      console.error('Supabase error fetching admin shipments', {
        adminId,
        status,
        statusText,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    // propagate message but keep debug info in console
    const msg = error instanceof Error ? error.message : 'Failed to fetch shipments';
    return {
      data: [],
      error: msg,
    };
  }
}

export async function createCheckpoints(shipmentId: string, checkpoints: Partial<Checkpoint>[]) {
  try {
    console.log(`📍 Creating ${checkpoints.length} checkpoints for shipment ${shipmentId}`);
    
    const checkpointsWithShipmentId = checkpoints.map((cp, index) => ({
      ...cp,
      shipment_id: shipmentId,
      checkpoint_order: index + 1,
    }));

    console.log('Checkpoint data to insert:', checkpointsWithShipmentId);

    const { data, error } = await supabase
      .from('checkpoints')
      .insert(checkpointsWithShipmentId)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('✅ Checkpoints created successfully:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create checkpoints';
    console.error('❌ Error creating checkpoints:', errorMsg);
    return {
      data: null,
      error: errorMsg,
    };
  }
}

export async function uploadImage(
  bucket: 'shipment-images' | 'driver-images' | 'route-screenshots',
  file: File,
  shipmentId: string
) {
  try {
    const fileName = `${shipmentId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeStorageFileName(file.name)}`;
    const uploadResult = await withTimeout(
      supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      }),
      `Image upload timed out. Check that the Supabase "${bucket}" bucket exists and allows uploads.`
    ) as { error: Error | null };
    const { error: uploadError } = uploadResult;

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: publicUrl.publicUrl, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
