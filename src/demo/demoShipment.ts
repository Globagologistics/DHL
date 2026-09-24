import { environment } from '../config/environment';
import type { Checkpoint, ShipmentWithCheckpoints } from '../types/database';

/**
 * Development-only demo shipment. It lets the full customer and admin journey
 * be inspected before the production backend exists.
 *
 * Active only when BOTH are true:
 *   - a Vite development build (import.meta.env.DEV)
 *   - VITE_ENABLE_DEMO_SHIPMENT=true
 * Setting the flag to false (the default) removes it completely; no UI
 * component references the demo directly.
 *
 * Only DEMO_TRACKING_ID is special. Every other number goes through the
 * normal shipment lookup.
 */
export const DEMO_TRACKING_ID = '010101010101';
/** UUID-shaped record id so chat and admin routes treat it like a real shipment. */
export const DEMO_SHIPMENT_RECORD_ID = '00000000-0000-4000-8000-010101010101';
export const DEMO_CUSTOMER_NAME = 'Daniel Carter';

export const isDemoShipmentEnabled = () => environment.demoShipment;

/** True for the demo tracking number or its record id, and only while the flag is on. */
export function isDemoShipmentReference(reference: string | null | undefined): boolean {
  if (!isDemoShipmentEnabled() || !reference) return false;
  const value = reference.trim();
  return value === DEMO_SHIPMENT_RECORD_ID || value.replace(/[\s-]/g, '') === DEMO_TRACKING_ID;
}

/** Admin list label for the demo record ("Daniel Carter · 0101 0101 0101"), or null. */
export function demoShipmentLabel(recordId: string | null | undefined): string | null {
  return recordId === DEMO_SHIPMENT_RECORD_ID && isDemoShipmentEnabled() ? `${DEMO_CUSTOMER_NAME} · ${DEMO_TRACKING_ID.replace(/(\d{4})(?=\d)/g, '$1 ')}` : null;
}

const HOUR = 3_600_000;

/** Tomorrow at 18:00 local time. */
function tomorrowEvening(now: number) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date.getTime();
}

/**
 * Builds the demo shipment with the same contract as a database row, with
 * timestamps relative to `now` so the timeline always looks current.
 */
export function buildDemoShipment(now = Date.now()): ShipmentWithCheckpoints {
  const eta = tomorrowEvening(now);
  // Start the countdown so the journey reads as ~60% complete (In Transit).
  const total = (eta - now) / 0.4;
  const start = eta - total;
  const iso = (time: number) => new Date(time).toISOString();
  const createdAt = iso(now - 30 * HOUR);

  const stops: [string, Checkpoint['status'], number][] = [
    ['New York, NY · Shipment information received', 'completed', now - 30 * HOUR],
    ['New York, NY · Picked up', 'completed', now - 28 * HOUR],
    ['New York, NY · Processed at origin facility', 'completed', now - 25 * HOUR],
    ['New York, NY · Departed origin facility', 'completed', now - 22 * HOUR],
    ['Louisville, KY · Arrived at transit facility', 'completed', now - 14 * HOUR],
    ['Los Angeles, CA · Processed at destination facility', 'current', now - 3 * HOUR],
    ['Los Angeles, CA · Out for delivery', 'pending', eta - 8 * HOUR],
    ['Los Angeles, CA · Delivered', 'pending', eta],
  ];
  const checkpoints: Checkpoint[] = stops.map(([location, status, time], index) => ({
    id: `demo-checkpoint-${index + 1}`,
    shipment_id: DEMO_SHIPMENT_RECORD_ID,
    location,
    checkpoint_order: index + 1,
    status,
    created_at: iso(time),
    updated_at: iso(time),
  }));

  return {
    id: DEMO_SHIPMENT_RECORD_ID,
    tracking_number: DEMO_TRACKING_ID,
    admin_id: 'demo-admin',
    sender_name: 'Olivia Reed',
    sender_phone: '+1 212 555 0132',
    sender_email: 'olivia.reed@example.com',
    receiver_name: DEMO_CUSTOMER_NAME,
    receiver_phone: '+1 213 555 0148',
    receiver_email: 'daniel.carter@example.com',
    pickup_location: 'New York, NY, United States',
    delivery_address: 'Los Angeles, CA, United States',
    warehouse: '',
    transportation: 'DHL Express Worldwide',
    package_name: 'Personal package',
    images: ['/images/dhl-logistics-campaign.jpeg'],
    cost: 86.4,
    currency: 'USD',
    paid: true,
    payment_status: 'paid',
    payment_responsibility: 'sender',
    vehicles_count: 1,
    vehicle_type: 'Boeing 777F',
    countdown_start_time: iso(start),
    countdown_duration: Math.round(total / 1000),
    estimated_delivery_at: iso(eta),
    paused: false,
    stopped: false,
    terminated: false,
    is_published: true,
    published_at: createdAt,
    status: 'in_transit',
    current_checkpoint_index: 5,
    shipment_details: {
      shipmentType: 'parcel',
      pieces: 1,
      weightKg: 2.5,
      dimensionsCm: { length: 30, width: 22, height: 15 },
      reference: 'DEMO-010101',
      sender: { address: '450 Park Avenue South', city: 'New York', state: 'NY', postalCode: '10016', country: 'United States' },
      recipient: { address: '1200 Wilshire Blvd', city: 'Los Angeles', state: 'CA', postalCode: '90017', country: 'United States' },
    },
    checkpoints,
    created_at: createdAt,
    updated_at: iso(now - 3 * HOUR),
  };
}
