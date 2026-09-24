export interface User {
  id: string;
  email: string;
  user_type: 'admin' | 'sender' | 'receiver';
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  shipment_id: string;
  location: string;
  checkpoint_order: number;
  status: 'pending' | 'current' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  admin_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  pickup_location?: string;
  delivery_address: string;
  warehouse?: string;
  transportation: string;
  package_name?: string;
  cost?: number;
  paid: boolean;
  vehicles_count?: number;
  vehicle_type?: string;
  driver_name?: string;
  driver_experience?: string;
  driver_image_url?: string;
  route_screenshot_url?: string;
  
  // Countdown Timer Fields (stored in seconds)
  countdown_duration?: number; // seconds until arrival
  countdown_start_time?: string;
  
  // Image URLs uploaded separately to storage
  images?: string[];
  
  // Pause/Resume Fields
  paused: boolean;
  pause_timestamp?: string | null;
  
  // Stop Fields
  stopped: boolean;
  stop_reason?: string | null;
  stop_timestamp?: string | null;
  
  // Terminate Fields
  terminated?: boolean;
  terminate_timestamp?: string | null;
  
  // Progress Bar Visual Pause (independent of shipment pause)
  progress_bar_paused?: boolean;

  // Publication is an explicit lifecycle transition. Draft shipments do not
  // create customer notification events until is_published becomes true.
  is_published?: boolean;
  published_at?: string;
  customer_status_reason?: string | null;
  cancelled_at?: string | null;
  delivered_at?: string | null;
  estimated_delivery_at?: string | null;
  internal_status_note?: string | null;
  currency?: string;
  payment_status?: 'unpaid' | 'pending' | 'paid';
  payment_responsibility?: 'sender' | 'receiver' | 'company';
  
  // Tracking
  current_checkpoint_index: number;
  status: 'processing' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'customs_processing' | 'on_hold' | 'delayed' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'paused' | 'stopped';
  
  created_at: string;
  updated_at: string;
}

export interface ShipmentWithCheckpoints extends Shipment {
  checkpoints: Checkpoint[];
}
