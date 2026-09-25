import { environment } from '../config/environment';
import type { Checkpoint, ShipmentEvent, ShipmentWithCheckpoints } from '../types/database';

/**
 * Development-only demo shipment, seeded into the development data store
 * (src/demo/devDataStore.ts) with the same schema as a database row.
 *
 * Active only when BOTH are true:
 *   - a Vite development build (import.meta.env.DEV)
 *   - VITE_ENABLE_DEMO_SHIPMENT=true
 * Setting the flag to false (the default) removes the whole development data
 * layer; no UI component references the demo directly.
 */
export const DEMO_TRACKING_ID = '010101010101';
/** UUID-shaped record id so chat and admin routes treat it like a real shipment. */
export const DEMO_SHIPMENT_RECORD_ID = '00000000-0000-4000-8000-010101010101';
export const DEMO_CUSTOMER_NAME = 'Daniel Carter';
export const DEMO_PACKAGE_IMAGES = [
  '/images/demo-package.jpg',
  '/images/demo-package-2.jpg',
  '/images/demo-package-3.jpg',
];

export const isDemoShipmentEnabled = () => environment.demoShipment;

/** Coordinates as stored in the bundled GeoNames gazetteer (src/data/gazetteer.json). */
export const DEMO_ORIGIN = { lat: 40.714, lng: -74.006, label: 'New York City, New York, United States' };
export const DEMO_DESTINATION = { lat: 34.052, lng: -118.244, label: 'Los Angeles, California, United States' };

const HOUR = 3_600_000;

/** Tomorrow at 18:00 local time. */
function tomorrowEvening(now: number) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date.getTime();
}

/**
 * Builds the demo shipment with timestamps relative to `now` so the timeline
 * looks current when the development data is (re)seeded.
 */
export function buildDemoShipment(now = Date.now()): ShipmentWithCheckpoints {
  const eta = tomorrowEvening(now);
  // Start the countdown so the journey reads as ~60% complete (In Transit).
  const total = (eta - now) / 0.4;
  const start = eta - total;
  const iso = (time: number) => new Date(time).toISOString();
  const createdAt = iso(now - 31 * HOUR);
  const publishedAt = iso(now - 30 * HOUR);

  const stops: [string, Checkpoint['status'], number][] = [
    ['New York, NY · Processed at origin facility', 'completed', now - 25 * HOUR],
    ['Louisville, KY · Arrived at transit hub', 'completed', now - 14 * HOUR],
    ['Los Angeles, CA · Processed at destination facility', 'current', now - 3 * HOUR],
    ['Los Angeles, CA · Out for delivery', 'pending', eta - 8 * HOUR],
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
  const events: ShipmentEvent[] = [
    { id: 'demo-event-created', kind: 'created', title: 'Shipment created', at: createdAt },
    { id: 'demo-event-published', kind: 'published', title: 'Shipment information received', at: publishedAt, location: 'New York, NY' },
    { id: 'demo-event-started', kind: 'started', title: 'Shipment departed origin airport', at: iso(start), location: 'New York, NY' },
  ];

  return {
    id: DEMO_SHIPMENT_RECORD_ID,
    tracking_number: DEMO_TRACKING_ID,
    lifecycle_state: 'in_transit',
    lifecycle_events: events,
    admin_id: 'dev-admin',
    sender_name: 'Olivia Reed',
    sender_phone: '+1 212 555 0132',
    sender_email: '',
    receiver_name: DEMO_CUSTOMER_NAME,
    receiver_phone: '+1 213 555 0148',
    receiver_email: 'daniel.carter@example.com',
    pickup_location: '450 Park Avenue South, New York, NY, United States',
    delivery_address: '1200 Wilshire Blvd, Los Angeles, CA, United States',
    warehouse: '',
    transportation: 'Air Freight',
    carrier_role: 'Pilot',
    driver_name: 'Capt. Marcus Hale',
    package_name: 'Personal package',
    // Reuse the supplied package photo for all three demo package images.
    images: DEMO_PACKAGE_IMAGES,
    package_value: 1200,
    cost: 0,
    currency: 'USD',
    paid: true,
    payment_status: 'paid',
    payment_responsibility: 'sender',
    origin_lat: DEMO_ORIGIN.lat,
    origin_lng: DEMO_ORIGIN.lng,
    destination_lat: DEMO_DESTINATION.lat,
    destination_lng: DEMO_DESTINATION.lng,
    origin_location_label: DEMO_ORIGIN.label,
    destination_location_label: DEMO_DESTINATION.label,
    route_progress: null,
    started_at: iso(start),
    countdown_start_time: iso(start),
    countdown_duration: Math.round(total / 1000),
    estimated_delivery_at: iso(eta),
    paused: false,
    stopped: false,
    terminated: false,
    is_published: true,
    published_at: publishedAt,
    status: 'in_transit',
    current_checkpoint_index: 2,
    checkpoints,
    created_at: createdAt,
    updated_at: iso(now - 3 * HOUR),
  };
}
