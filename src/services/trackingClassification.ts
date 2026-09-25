export type ShipmentReferenceRow = { id: string; tracking_number?: string | null };
export type QueryError = { code?: string; message?: string } | null;

export type TrackingLookupResult =
  | { status: 'found'; shipmentId: string; trackingNumber: string | null }
  | { status: 'not_found' }
  | { status: 'network_error' }
  | { status: 'server_error' };

/**
 * A lookup is "not found" only after PostgREST successfully returns no row.
 * Any error object—including PGRST205, PGRST202, 42P01 and missing columns—is
 * a server/backend error, never evidence that a tracking number is invalid.
 */
export function classifyShipmentQuery(data: ShipmentReferenceRow | null, error: QueryError): TrackingLookupResult {
  if (error) return { status: 'server_error' };
  return data
    ? { status: 'found', shipmentId: data.id, trackingNumber: data.tracking_number ?? null }
    : { status: 'not_found' };
}

/** Rejected requests and lookup timeouts are transport failures. */
export const classifyNetworkFailure = (): TrackingLookupResult => ({ status: 'network_error' });
