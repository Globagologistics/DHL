import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as shipmentService from '../../services/shipmentService';
import { supabase } from '../../lib/supabase';
import type { Shipment as DBShipment, Checkpoint as DBCheckpoint, ShipmentWithCheckpoints } from '../../types/database';

export interface Checkpoint extends DBCheckpoint {
  id: string;
  location: string;
  pauseTimestamp?: string;
}

export interface Shipment {
  id: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  pickupLocation?: string;
  deliveryAddress: string;
  warehouse: string;
  transportation: string;
  packageName: string;
  images?: string[];
  imageFiles?: File[];
  cost?: number;
  paid: boolean;
  currency?: string;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  paymentResponsibility?: 'sender' | 'receiver' | 'company';
  checkpoints: Checkpoint[];
  currentCheckpointIndex: number;
  vehiclesCount?: number;
  vehicleType?: string;
  driverName?: string;
  driverExperience?: string;
  stopped?: boolean;
  stopReason?: string | null;
  stopTimestamp?: string | null;
  paused?: boolean;
  countdownDuration?: number;
  countdownStartTime?: string;
  pauseTimestamp?: string | null;
  terminated?: boolean;
  terminateTimestamp?: string | null;
  routeScreenshot?: File | FileList;
  admin_id?: string;
  status?: string;
}

interface AdminContextType {
  shipments: Shipment[];
  addShipment: (data: Partial<Shipment>, publish?: boolean) => Promise<void>;
  updateShipment: (id: string, data: Partial<Shipment>) => Promise<void>;
  stopShipment: (id: string, reason: string) => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const AdminContext = createContext<AdminContextType>({
  shipments: [],
  addShipment: async () => {},
  updateShipment: async () => {},
  stopShipment: async () => {},
  togglePause: async () => {},
  deleteShipment: async () => {},
  isAdmin: false,
  loading: false,
  error: null,
  clearError: () => {},
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>('');

  // Helper: convert stored path or URL to a usable public URL from Supabase Storage
  const resolveStorageUrl = (pathOrUrl: string | null | undefined, bucket: 'shipment-images' | 'driver-images' | 'route-screenshots' = 'shipment-images'): string => {
    if (!pathOrUrl) return '';
    if (typeof pathOrUrl === 'string' && pathOrUrl.startsWith('http')) return pathOrUrl;
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(pathOrUrl);
      return (data as { publicUrl: string })?.publicUrl || pathOrUrl;
    } catch (e) {
      return pathOrUrl;
    }
  };

  // Initialize admin ID from authenticated user
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setAdminId('');
          setIsAdmin(false);
          return;
        }
        console.log('✅ Authenticated user found:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();
        if (profileError || profile?.user_type !== 'admin') {
          setAdminId('');
          setIsAdmin(false);
          return;
        }
        setAdminId(user.id);
        setIsAdmin(true);
      } catch {
        setAdminId('');
        setIsAdmin(false);
      }
    };

    void initializeAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void initializeAdmin();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch shipments on mount
  useEffect(() => {
    if (!adminId) {
      console.log('⏳ AdminContext: waiting for adminId before fetching shipments');
      return;
    }

    const fetchShipments = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching shipments for admin ID:', adminId);
        
        const { data, error } = await shipmentService.getAdminShipments(adminId);
        if (error) {
          console.error('❌ Error fetching shipments:', error);
          // display more detail for 500 server errors if available
          if (typeof error === 'object' && error !== null) {
            console.error('   detailed error object:', error);
          }
          setError(error);
          setShipments([]);
          return;
        }

        if (!data || data.length === 0) {
          console.log('📦 No shipments found for this admin');
          setShipments([]);
          setError(null);
          return;
        }

        console.log('✅ Fetched', data.length, 'shipments');
        
        // Transform DB shipments to local format
        const transformedShipments: Shipment[] = (data as ShipmentWithCheckpoints[]).map((ship: ShipmentWithCheckpoints) => {
          console.log(`📦 Transforming shipment ${ship.id} with ${ship.checkpoints?.length || 0} checkpoints`);
          return {
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            senderEmail: ship.sender_email,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email || '',
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          };
        });
        
        setShipments(transformedShipments);
        setError(null);
        console.log('✅ Shipments loaded successfully:', transformedShipments.length);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch shipments';
        console.error('❌ Exception in fetchShipments:', errorMsg);
        setError(errorMsg);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to real-time changes (only when adminId is present)
    const subscription = supabase
      .channel('admin-shipments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments', filter: `admin_id=eq.${adminId}` },
        () => {
          // Refetch shipments on any change
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      try {
        subscription.unsubscribe();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, [adminId]);

  const addShipment = useCallback(
    async (
      data: Partial<Shipment>,
      publish: boolean = true
    ) => {
      try {
        setLoading(true);
        setError(null);
        const id = data.id ?? crypto.randomUUID();
        
        console.log('🚀 addShipment: Starting shipment creation with ID:', id);
        console.log('📊 Admin ID:', adminId);
        
        // Use image URLs directly and upload device-selected images into Storage.
        const imageUrls: string[] = Array.isArray(data.images) ? data.images.filter((u: string) => u && u.trim() !== "") : [];
        const imageFiles: File[] = Array.isArray(data.imageFiles) ? data.imageFiles : [];
        for (const file of imageFiles) {
          const { url, error } = await shipmentService.uploadImage('shipment-images', file, id);
          if (error || !url) {
            throw new Error(error || `Failed to upload ${file.name}`);
          }
          imageUrls.push(url);
        }

        // Upload route screenshot if provided
        let routeImageUrl: string | undefined = undefined;
        if (data.routeScreenshot) {
          const rs = data.routeScreenshot as File | FileList | null;
          const file = rs instanceof File ? rs : rs instanceof FileList ? rs[0] : null;
          if (file) {
            const { url, error } = await shipmentService.uploadImage('route-screenshots', file, id);
            if (!error && url) {
              routeImageUrl = url;
            }
          }
        }

        // Create shipment in Supabase
        const shipmentData: Partial<DBShipment> & { id: string; admin_id: string } = {
          id,
          admin_id: adminId,
          sender_name: data.senderName || '',
          sender_phone: data.senderPhone || '',
          sender_email: data.senderEmail || '',
          receiver_name: data.receiverName || '',
          receiver_phone: data.receiverPhone || '',
          receiver_email: data.receiverEmail || '',
          pickup_location: data.pickupLocation || '',
          delivery_address: data.deliveryAddress || '',
          warehouse: data.warehouse || '',
          transportation: data.transportation || '', // Fixed: was transportation_type
          package_name: data.packageName || '',
          images: imageUrls,
          cost: data.cost || 0,
          paid: data.paid || false,
          currency: data.currency || 'USD',
          payment_status: data.paymentStatus || (data.paid ? 'paid' : 'unpaid'),
          payment_responsibility: data.paymentResponsibility || 'sender',
          vehicles_count: data.vehiclesCount || 0, // Fixed: was vehicle_count
          vehicle_type: data.vehicleType || '',
          driver_name: data.driverName || '',
          driver_experience: data.driverExperience || '',
          route_screenshot_url: routeImageUrl, // Fixed: was route_screenshot
          countdown_duration: (data.countdownDuration || 24) * 3600, // Convert hours to seconds for storage
          countdown_start_time: data.countdownStartTime || new Date().toISOString(),
          status: 'in_transit',
          // A new record remains a draft until checkpoints have been written.
          // Publication is the explicit UPDATE below that queues the outbox event.
          is_published: false,
          current_checkpoint_index: 0, // Start at first checkpoint
          paused: false,
          stopped: false,
        };

        console.log('📝 Shipment Data to save:', shipmentData);

        const { data: newShipment, error } = await shipmentService.createShipment(shipmentData);
        if (error || !newShipment) {
          const errorMsg = error || 'Failed to create shipment';
          console.error('❌ Shipment creation failed:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('✅ Shipment created successfully:', newShipment.id);

        // Create checkpoints
        if (data.checkpoints && data.checkpoints.length > 0) {
          console.log('📍 Creating', data.checkpoints.length, 'checkpoints...');
          const checkpointData: Partial<DBCheckpoint>[] = data.checkpoints.map((cp: Checkpoint) => ({
            location: cp.location,
            status: 'pending' as const,
          }));
          const { data: createdCheckpoints, error: checkpointError } = await shipmentService.createCheckpoints(id, checkpointData);
          if (checkpointError) {
            console.error('❌ Checkpoint creation failed:', checkpointError);
            throw new Error('Failed to create checkpoints: ' + checkpointError);
          }
          console.log('✅ Checkpoints created:', createdCheckpoints?.length || 0);
        }

        // The primary Create Shipment action creates an active shipment. This
        // UPDATE triggers shipment_published only after all creation work has succeeded.
        if (publish) {
          const { error: publishError } = await shipmentService.updateShipment(newShipment.id, {
            is_published: true,
          });
          if (publishError) {
            throw new Error(`Shipment was created but could not be published: ${publishError}`);
          }
        }

        // Refresh shipments
        console.log('🔄 Refreshing shipments list...');
        const { data: refreshedShipments, error: fetchError } = await shipmentService.getAdminShipments(adminId);
        if (fetchError) {
          console.error('❌ Failed to fetch refreshed shipments:', fetchError);
          throw new Error('Failed to refresh shipments: ' + fetchError);
        }

        if (refreshedShipments && refreshedShipments.length > 0) {
          const transformedShipments: Shipment[] = (refreshedShipments as ShipmentWithCheckpoints[]).map((ship) => ({
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email,
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          }));
          setShipments(transformedShipments);
          console.log('✅ Shipments list updated:', transformedShipments.length, 'total shipments');
        } else {
          console.warn('⚠️ No shipments returned after creation');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Error in addShipment:', errorMsg);
        setError(errorMsg);
        throw error; // Rethrow to let the form know there was an error
      } finally {
        setLoading(false);
      }
    },
    [adminId]
  );

  const updateShipment = useCallback(
    async (id: string, data: Partial<Shipment>) => {
      try {
        setLoading(true);
        const updateData: Partial<DBShipment> = {};
        const imageUrls: string[] = Array.isArray(data.images)
          ? data.images.filter((u: string) => u && u.trim() !== "")
          : [];
        const imageFiles: File[] = Array.isArray(data.imageFiles) ? data.imageFiles : [];

        for (const file of imageFiles) {
          const { url, error } = await shipmentService.uploadImage('shipment-images', file, id);
          if (error || !url) {
            throw new Error(error || `Failed to upload ${file.name}`);
          }
          imageUrls.push(url);
        }
        
        // Map fields to database column names
        if (data.senderName) updateData.sender_name = data.senderName;
        if (data.senderPhone) updateData.sender_phone = data.senderPhone;
        if (data.senderEmail !== undefined) updateData.sender_email = data.senderEmail;
        if (data.receiverName) updateData.receiver_name = data.receiverName;
        if (data.receiverPhone) updateData.receiver_phone = data.receiverPhone;
        if (data.receiverEmail) updateData.receiver_email = data.receiverEmail;
        if (data.pickupLocation) updateData.pickup_location = data.pickupLocation;
        if (data.deliveryAddress) updateData.delivery_address = data.deliveryAddress;
        if (data.warehouse) updateData.warehouse = data.warehouse;
        if (data.transportation) updateData.transportation = data.transportation;
        if (data.packageName) updateData.package_name = data.packageName;
        if (data.images !== undefined || data.imageFiles !== undefined) updateData.images = imageUrls;
        if (data.cost !== undefined) updateData.cost = data.cost;
        if (data.paid !== undefined) updateData.paid = data.paid;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.paymentStatus !== undefined) updateData.payment_status = data.paymentStatus;
        if (data.paymentResponsibility !== undefined) updateData.payment_responsibility = data.paymentResponsibility;
        if (data.vehiclesCount !== undefined) updateData.vehicles_count = data.vehiclesCount;
        if (data.vehicleType !== undefined) updateData.vehicle_type = data.vehicleType;
        if (data.driverName !== undefined) updateData.driver_name = data.driverName;
        if (data.driverExperience !== undefined) updateData.driver_experience = data.driverExperience;
        if (data.countdownDuration !== undefined) updateData.countdown_duration = data.countdownDuration * 3600;
        if (data.countdownStartTime) updateData.countdown_start_time = data.countdownStartTime;
        if (data.paused !== undefined) updateData.paused = data.paused;
        if (data.currentCheckpointIndex !== undefined) updateData.current_checkpoint_index = data.currentCheckpointIndex;

        const { error } = await shipmentService.updateShipment(id, updateData);
        if (error) throw new Error(error);

        // Refresh shipments
        const { data: refreshedShipments } = await shipmentService.getAdminShipments(adminId);
        if (refreshedShipments) {
          const transformedShipments: Shipment[] = (refreshedShipments as ShipmentWithCheckpoints[]).map((ship: ShipmentWithCheckpoints) => ({
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            senderEmail: ship.sender_email,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email || '',
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          }));
          setShipments(transformedShipments);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error updating shipment:', error);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [adminId]
  );

  const stopShipment = useCallback(
    async (id: string, reason: string) => {
      try {
        const { error } = await shipmentService.updateShipment(id, {
          stopped: true,
          stop_reason: reason,
          status: 'stopped',
        });
        if (error) throw new Error(error);

        // Refresh shipments
        const { data: refreshedShipments } = await shipmentService.getAdminShipments(adminId);
        if (refreshedShipments) {
          const transformedShipments: Shipment[] = (refreshedShipments as ShipmentWithCheckpoints[]).map((ship: ShipmentWithCheckpoints) => ({
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            senderEmail: ship.sender_email,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email || '',
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          }));
          setShipments(transformedShipments);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error stopping shipment:', error);
        setError(errorMsg);
      }
    },
    [adminId]
  );

  const togglePause = useCallback(
    async (id: string) => {
      try {
        const shipment = shipments.find(s => s.id === id);
        if (!shipment) return;

        let updateData: Partial<DBShipment> = {};
        
        if (!shipment.paused) {
          // Pausing
          updateData = {
            paused: true,
            pause_timestamp: new Date().toISOString(),
          };
        } else {
          // Resuming
          if (shipment.pauseTimestamp && shipment.countdownStartTime) {
            const pauseTime = new Date(shipment.pauseTimestamp).getTime();
            const startTime = new Date(shipment.countdownStartTime).getTime();
            const now = Date.now();
            const pausedDuration = now - pauseTime;
            const newStartTime = new Date(startTime + pausedDuration).toISOString();
            updateData = {
              paused: false,
              countdown_start_time: newStartTime,
              pause_timestamp: null,
            };
          } else {
            updateData = {
              paused: false,
              pause_timestamp: null,
            };
          }
        }

        const { error } = await shipmentService.updateShipment(id, updateData);
        if (error) throw new Error(error);

        // Refresh shipments
        const { data: refreshedShipments } = await shipmentService.getAdminShipments(adminId);
        if (refreshedShipments) {
          const transformedShipments: Shipment[] = (refreshedShipments as ShipmentWithCheckpoints[]).map((ship: ShipmentWithCheckpoints) => ({
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            senderEmail: ship.sender_email,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email || '',
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          }));
          setShipments(transformedShipments);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error toggling pause:', error);
        setError(errorMsg);
      }
    },
    [shipments, adminId]
  );

  const deleteShipment = useCallback(
    async (id: string) => {
      try {
        const { error } = await shipmentService.deleteShipment(id);
        if (error) throw new Error(error);

        // Refresh shipments
        const { data: refreshedShipments } = await shipmentService.getAdminShipments(adminId);
        if (refreshedShipments) {
          const transformedShipments: Shipment[] = (refreshedShipments as ShipmentWithCheckpoints[]).map((ship: ShipmentWithCheckpoints) => ({
            id: ship.id,
            senderName: ship.sender_name,
            senderPhone: ship.sender_phone,
            senderEmail: ship.sender_email,
            receiverName: ship.receiver_name,
            receiverPhone: ship.receiver_phone,
            receiverEmail: ship.receiver_email || '',
            pickupLocation: ship.pickup_location,
            deliveryAddress: ship.delivery_address,
            warehouse: ship.warehouse || '',
            transportation: ship.transportation,
            packageName: ship.package_name || '',
            images: (ship.images || []).map((i: string) => resolveStorageUrl(i, 'shipment-images')),
            cost: ship.cost,
            paid: ship.paid,
            currency: ship.currency,
            paymentStatus: ship.payment_status,
            paymentResponsibility: ship.payment_responsibility,
            vehiclesCount: ship.vehicles_count,
            vehicleType: ship.vehicle_type,
            driverName: ship.driver_name,
            driverExperience: ship.driver_experience,
            stopped: ship.stopped,
            stopReason: ship.stop_reason,
            stopTimestamp: ship.stop_timestamp,
            terminated: ship.terminated,
            terminateTimestamp: ship.terminate_timestamp,
            paused: ship.paused,
            countdownDuration: ship.countdown_duration ? ship.countdown_duration / 3600 : 0,
            countdownStartTime: ship.countdown_start_time,
            pauseTimestamp: ship.pause_timestamp,
            admin_id: ship.admin_id,
            status: ship.status,
            checkpoints: (ship.checkpoints || []) as Checkpoint[],
            currentCheckpointIndex: ship.current_checkpoint_index || 0,
          }));
          setShipments(transformedShipments);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error deleting shipment:', error);
        setError(errorMsg);
      }
    },
    [adminId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        shipments,
        addShipment,
        updateShipment,
        deleteShipment,
        stopShipment,
        togglePause,
        isAdmin,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
