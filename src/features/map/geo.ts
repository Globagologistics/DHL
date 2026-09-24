import type { RoutePoint } from '../shipments/types';
import type { Shipment } from '../../types/database';

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;

/** Straight-line (great-circle) distance in km. Not road or flight-path distance. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number) {
  const format = (value: number) => Math.round(value).toLocaleString('en-US');
  return { km: `${format(km)} km`, mi: `${format(km * 0.621371)} mi` };
}

/** Point a fraction `t` (0–1) of the way along the great circle from a to b. */
export function interpolateGreatCircle(a: RoutePoint, b: RoutePoint, t: number): RoutePoint {
  const lat1 = toRad(a.lat), lng1 = toRad(a.lng), lat2 = toRad(b.lat), lng2 = toRad(b.lng);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2));
  if (d === 0) return { lat: a.lat, lng: a.lng };
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) };
}

export const pathLengthKm = (stops: RoutePoint[]) => stops.slice(1).reduce((sum, stop, index) => sum + haversineKm(stops[index], stop), 0);

type RouteFields = Pick<Shipment, 'origin_lat' | 'origin_lng' | 'destination_lat' | 'destination_lng' | 'origin_location_label' | 'destination_location_label' | 'lifecycle_events'>;

/**
 * Stored route: origin, coordinate-aware checkpoints in time order, then
 * destination. Returns null when origin or destination has no coordinates.
 */
export function storedRouteStops(shipment: RouteFields): { stops: RoutePoint[]; checkpointCount: number } | null {
  if (shipment.origin_lat == null || shipment.origin_lng == null || shipment.destination_lat == null || shipment.destination_lng == null) return null;
  const checkpoints = (shipment.lifecycle_events || [])
    .filter(event => event.lat != null && event.lng != null)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(event => ({ lat: event.lat as number, lng: event.lng as number, label: event.location || undefined }));
  // Pins show just the place name ("New York City"); the full label stays in the facts below the map.
  const pinLabel = (label?: string | null) => label?.split(',')[0].trim() || undefined;
  return {
    stops: [
      { lat: shipment.origin_lat, lng: shipment.origin_lng, label: pinLabel(shipment.origin_location_label), detail: shipment.origin_location_label || undefined },
      ...checkpoints,
      { lat: shipment.destination_lat, lng: shipment.destination_lng, label: pinLabel(shipment.destination_location_label), detail: shipment.destination_location_label || undefined },
    ],
    checkpointCount: checkpoints.length,
  };
}
