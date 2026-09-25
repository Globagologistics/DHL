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

/** Structured wizard details stored in shipments.shipment_details (see migration 20260925000001). */
export interface ShipmentDetails {
  shipmentType?: 'document' | 'parcel' | 'freight' | 'other';
  pieces?: number;
  weightKg?: number;
  dimensionsCm?: { length?: number; width?: number; height?: number };
  reference?: string;
  sender?: StructuredAddress;
  recipient?: StructuredAddress;
}

export interface StructuredAddress {
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** Controlled lifecycle (migration 20260926000000). See src/features/shipments/lifecycle.ts. */
export type LifecycleState =
  | 'draft' | 'pending_review' | 'scheduled' | 'awaiting_takeoff' | 'in_transit'
  | 'paused' | 'stopped' | 'delivered' | 'cancelled' | 'terminated';

/** Customer-visible timeline entry appended by lifecycle actions and admin updates. */
export interface ShipmentEvent {
  id: string;
  kind: 'created' | 'published' | 'started' | 'paused' | 'resumed' | 'stopped' | 'restarted' | 'delivered' | 'cancelled' | 'terminated' | 'update';
  title: string;
  detail?: string | null;
  location?: string | null;
  /** Present when the update was placed with a gazetteer location; makes the route multi-leg. */
  lat?: number | null;
  lng?: number | null;
  at: string;
}

export interface Shipment {
  id: string;
  /** Customer-facing 12-digit number, assigned when the shipment is published. */
  tracking_number?: string | null;
  /** True only for the isolated synthetic portfolio shipment. */
  is_demo?: boolean;
  shipment_details?: ShipmentDetails | null;
  lifecycle_state?: LifecycleState | null;
  lifecycle_events?: ShipmentEvent[] | null;
  package_value?: number | null;
  outstanding_amount?: number | null;
  carrier_role?: string | null;
  started_at?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  current_lat?: number | null;
  current_lng?: number | null;
  /** Route locations ("Lagos, Nigeria") whose coordinates drive the map; the full address stays in pickup_location / delivery_address. */
  origin_location_label?: string | null;
  destination_location_label?: string | null;
  /** Admin-set position along the route (0–100). Null = derived from the journey timeline. */
  route_progress?: number | null;
  deleted_at?: string | null;
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
