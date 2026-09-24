import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Shipment, Checkpoint, ShipmentWithCheckpoints } from '../types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Hook to fetch all shipments for admin
export function useAdminShipments(adminId: string) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data, error: err } = await supabase
          .from('shipments')
          .select('*')
          .eq('admin_id', adminId)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setShipments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`admin-shipments-${adminId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `admin_id=eq.${adminId}`,
        },
        (payload: RealtimePostgresChangesPayload<Shipment>) => {
          if (payload.eventType === 'DELETE') {
            setShipments((prev) => prev.filter((s) => s.id !== (payload.old as any).id));
          } else {
            setShipments((prev) =>
              [(payload.new as Shipment), ...prev.filter((s) => s.id !== (payload.new as any).id)]
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [adminId]);

  return { shipments, loading, error };
}

// Hook to fetch shipment with checkpoints
export function useShipmentWithCheckpoints(shipmentId: string) {
  const [shipment, setShipment] = useState<ShipmentWithCheckpoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shipmentId || !shipmentId.trim()) {
      setShipment(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchShipment = async () => {
      try {
        const { data: shipmentData, error: shipmentErr } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', shipmentId)
          .single();

        if (shipmentErr) throw shipmentErr;

        const { data: checkpointsData, error: checkpointsErr } = await supabase
          .from('checkpoints')
          .select('*')
          .eq('shipment_id', shipmentId)
          .order('checkpoint_order', { ascending: true });

        if (checkpointsErr) throw checkpointsErr;

        setShipment({
          ...shipmentData,
          checkpoints: checkpointsData || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shipment');
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`shipment-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipmentId}`,
        },
        (payload: RealtimePostgresChangesPayload<Shipment>) => {
          setShipment((prev) =>
            prev ? { ...prev, ...(payload.new as any) } : null
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [shipmentId]);

  return { shipment, loading, error };
}

// Hook to create shipment
export async function createShipment(shipmentData: Partial<Shipment>) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .insert([shipmentData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create shipment',
    };
  }
}

// Hook to update shipment
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

// Hook to upload image to storage
export async function uploadImage(
  bucket: 'shipment-images' | 'driver-images' | 'route-screenshots',
  file: File,
  shipmentId: string
) {
  try {
    const fileName = `${shipmentId}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

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

// Hook to fetch user shipments for tracking
export function useUserShipments(email: string) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data, error: err } = await supabase
          .from('shipments')
          .select('*')
          .or(`sender_email.eq.${email},receiver_email.eq.${email}`)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setShipments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchShipments();
    }
  }, [email]);

  return { shipments, loading, error };
}
