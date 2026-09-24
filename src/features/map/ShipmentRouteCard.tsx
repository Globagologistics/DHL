import { useEffect, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { RouteMap } from './RouteMap';
import { formatDistance, pathLengthKm, storedRouteStops } from './geo';
import { deriveLifecycleState, lifecycleLabels, lifecycleProgress } from '../shipments/lifecycle';
import { resolveAddress, toRoutePoint } from '../../services/locationService';
import type { RoutePoint } from '../shipments/types';
import type { Shipment } from '../../types/database';

type RouteInfo = { stops: RoutePoint[]; checkpointCount: number; approximate: boolean };

/** Stored route, or (for older shipments) an approximate one resolved offline from the addresses. */
export function useShipmentRoute(shipment: Shipment): RouteInfo | null | undefined {
  const stored = storedRouteStops(shipment);
  const [resolved, setResolved] = useState<RouteInfo | null | undefined>(stored ? { ...stored, approximate: false } : undefined);
  const key = `${shipment.id}|${shipment.origin_lat},${shipment.origin_lng}|${shipment.destination_lat},${shipment.destination_lng}|${(shipment.lifecycle_events || []).length}|${shipment.origin_location_label}|${shipment.destination_location_label}`;
  useEffect(() => {
    const current = storedRouteStops(shipment);
    if (current) { setResolved({ ...current, approximate: false }); return; }
    let active = true;
    setResolved(undefined);
    void Promise.all([resolveAddress(shipment.pickup_location || ''), resolveAddress(shipment.delivery_address || '')])
      .then(([origin, destination]) => {
        if (!active) return;
        // Only confirmed (unambiguous) locations are drawn; nothing is guessed.
        if (origin.status === 'resolved' && destination.status === 'resolved') setResolved({ stops: [toRoutePoint(origin.location), toRoutePoint(destination.location)], checkpointCount: 0, approximate: true });
        else setResolved(null);
      })
      .catch(() => { if (active) setResolved(null); });
    return () => { active = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return resolved;
}

/** Marker position: admin route progress, else the latest located checkpoint, else the journey timeline. */
export function routeMarker(shipment: Shipment, route: RouteInfo): { progress: number | null; currentStop: number | null } {
  const state = deriveLifecycleState(shipment);
  if (['draft', 'pending_review', 'scheduled', 'cancelled'].includes(state)) return { progress: null, currentStop: null };
  if (shipment.route_progress != null) return { progress: shipment.route_progress / 100, currentStop: null };
  if (state === 'delivered') return { progress: 1, currentStop: null };
  if (state === 'awaiting_takeoff') return { progress: 0, currentStop: null };
  if (route.checkpointCount > 0) return { progress: null, currentStop: route.checkpointCount };
  return { progress: lifecycleProgress(shipment) / 100, currentStop: null };
}

const shortAddress = (value?: string | null) => (value || '').split(',').slice(-3).join(',').trim() || 'Not provided';

/**
 * Route map plus the facts under it, shared by customer tracking and the admin
 * control panel so both show the same origin, destination and progress.
 */
export function ShipmentRouteCard({ shipment, height = 300 }: { shipment: Shipment; height?: number }) {
  const route = useShipmentRoute(shipment);
  const state = deriveLifecycleState(shipment);
  const marker = route ? routeMarker(shipment, route) : null;
  const distance = route ? formatDistance(pathLengthKm(route.stops)) : null;
  const carrier = [shipment.carrier_role, shipment.driver_name].filter(Boolean).join(' · ');
  const origin = route?.stops[0];
  const destination = route?.stops[route.stops.length - 1];
  return <div className="dhl-route-card">
    {route === undefined
      ? <div className="dhl-route-map-loading" style={{ height }} aria-label="Loading route map" />
      : route
        ? <RouteMap stops={route.stops} progress={marker?.progress} currentStop={marker?.currentStop} transport={shipment.transportation} height={height} ariaLabel={`Route from ${origin?.label || 'origin'} to ${destination?.label || 'destination'}`} />
        : <div className="dhl-route-map-empty" style={{ height: Math.min(height, 200) }}><MapPinned size={24} /><strong>Route map not available yet</strong><span>The map appears once the pickup and drop-off locations are confirmed.</span></div>}
    <dl className="dhl-route-facts">
      <div><dt>Origin</dt><dd>{shipment.origin_location_label || origin?.label || shortAddress(shipment.pickup_location)}</dd></div>
      <div><dt>Destination</dt><dd>{shipment.destination_location_label || destination?.label || shortAddress(shipment.delivery_address)}</dd></div>
      <div><dt>Approx. distance</dt><dd>{distance ? <>{distance.km}<small>{distance.mi}</small></> : 'Not available'}</dd></div>
      <div><dt>Current status</dt><dd>{lifecycleLabels[state]}{route && route.checkpointCount > 0 && <small>{route.checkpointCount} located checkpoint{route.checkpointCount === 1 ? '' : 's'}</small>}</dd></div>
      <div><dt>Transport</dt><dd>{shipment.transportation || 'Not provided'}{carrier && <small>{carrier}</small>}</dd></div>
    </dl>
    <p className="dhl-route-disclaimer">Route visualization is based on shipment locations and checkpoints and does not represent live GPS navigation. Distance is approximate straight-line distance, not driving or flight distance.{route?.approximate ? ' Locations are approximate, taken from the city named in each address.' : ''}</p>
  </div>;
}
