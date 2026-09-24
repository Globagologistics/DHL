/** Shared shipment form and request types (wizard, services, development store). */

export type PaymentChoice = 'paid' | 'unpaid' | 'pending';
export type TransportMethod = 'Air Freight' | 'Sea Freight' | 'Truck' | 'Courier / Dispatcher' | 'Motorcycle';
/**
 * A route location: coordinates from the offline gazetteer (or, as an
 * advanced fallback, a map click). `label` is short for map pins, `detail`
 * the full "City, Region, Country" name.
 */
export type RoutePoint = { lat: number; lng: number; label?: string; detail?: string; source?: 'auto' | 'selected' | 'map' };
export type ShipmentRoute = { origin?: RoutePoint | null; destination?: RoutePoint | null };

/**
 * Wizard state. Key names match the request payload (and the legacy
 * pickupLocation / deliveryAddress columns) so no mapping layer is needed.
 */
export type ShipmentDraft = {
  senderName: string;
  senderPhone: string;
  pickupLocation: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  deliveryAddress: string;
  packageName: string;
  packageValue: string;
  currency: string;
  paymentStatus: PaymentChoice;
  outstandingAmount: string;
  /** Uploaded image URLs (1–3). Pending files are held by the uploader until submit. */
  images: string[];
  /** datetime-local value (YYYY-MM-DDTHH:mm) in the admin's timezone. */
  estimatedDelivery: string;
  transportation: TransportMethod;
  carrierRole: string;
  carrierName: string;
  route: ShipmentRoute;
};

export const emptyShipmentDraft: ShipmentDraft = {
  senderName: '', senderPhone: '', pickupLocation: '',
  receiverName: '', receiverPhone: '', receiverEmail: '', deliveryAddress: '',
  packageName: '', packageValue: '', currency: 'USD', paymentStatus: 'unpaid', outstandingAmount: '', images: [],
  estimatedDelivery: '', transportation: 'Air Freight', carrierRole: 'Pilot', carrierName: '',
  route: {},
};

export const transportMethods: TransportMethod[] = ['Air Freight', 'Sea Freight', 'Truck', 'Courier / Dispatcher', 'Motorcycle'];
export const defaultCarrierRole: Record<TransportMethod, string> = {
  'Air Freight': 'Pilot', 'Sea Freight': 'Captain', Truck: 'Driver', 'Courier / Dispatcher': 'Courier', Motorcycle: 'Rider',
};
export const carrierRoles = ['Pilot', 'Captain', 'Driver', 'Courier', 'Rider', 'Dispatcher'];
export const currencies = ['USD', 'NGN', 'GBP', 'EUR'];
export const paymentLabels: Record<PaymentChoice, string> = { paid: 'Paid', unpaid: 'Unpaid', pending: 'Outstanding Payment' };

/** Stored in shipment_requests.payload. Admin fields are added during review. */
export type ShipmentRequestPayload = Partial<ShipmentDraft> & {
  senderName: string; pickupLocation: string; receiverName: string; receiverPhone: string; receiverEmail: string;
  deliveryAddress: string; packageName: string; images: string[];
  /** Legacy key kept for older requests and the original RPC validation. */
  checkpoints?: string[];
  /** ISO timestamp added at approval (the server cannot interpret datetime-local). */
  estimatedDeliveryAt?: string;
};

export type ShipmentRequest = {
  id: string;
  sender_name: string;
  recipient_name: string;
  origin: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected';
  payload: ShipmentRequestPayload;
  created_at: string;
  reviewed_at: string | null;
  shipment_id: string | null;
  rejection_reason: string | null;
};
