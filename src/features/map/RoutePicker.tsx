import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { RouteMap } from './RouteMap';
import { LocationSearch } from './LocationFields';
import { formatDistance, haversineKm } from './geo';
import { nearestLocation, toRoutePoint } from '../../services/locationService';
import type { ShipmentRoute } from '../shipments/types';

type Props = { route: ShipmentRoute; onChange: (route: ShipmentRoute) => void };

/**
 * ADVANCED fallback only: set a route end by searching the local gazetteer or
 * clicking the map. The normal workflow resolves locations from the addresses.
 */
export function RoutePicker({ route, onChange }: Props) {
  const [active, setActive] = useState<'origin' | 'destination'>(route.origin ? 'destination' : 'origin');
  const distance = route.origin && route.destination ? formatDistance(haversineKm(route.origin, route.destination)) : null;
  const stops = [route.origin, route.destination].filter(Boolean) as NonNullable<ShipmentRoute['origin']>[];
  return <div className="dhl-route-picker">
    <div className="dhl-route-points" role="tablist" aria-label="Point to place">
      {(['origin', 'destination'] as const).map(kind => <button key={kind} type="button" role="tab" aria-selected={active === kind} className={active === kind ? 'active' : ''} onClick={() => setActive(kind)}>
        <MapPin size={15} /><span><small>{kind === 'origin' ? 'Origin' : 'Destination'}</small><strong>{route[kind]?.detail || route[kind]?.label || (route[kind] ? `${route[kind]!.lat.toFixed(2)}, ${route[kind]!.lng.toFixed(2)}` : 'Not set')}</strong></span>
        {route[kind] && <X size={14} aria-label={`Clear ${kind}`} onClick={event => { event.stopPropagation(); onChange({ ...route, [kind]: null }); }} />}
      </button>)}
    </div>
    <LocationSearch label={`Find the ${active}`} placeholder={`Find the ${active}: city, state or country…`} onSelect={location => onChange({ ...route, [active]: toRoutePoint(location) })} />
    <RouteMap stops={stops} height={260} onPick={point => { void nearestLocation(point).then(place => onChange({ ...route, [active]: { ...point, label: place?.shortLabel, detail: place ? `Near ${place.label}` : undefined, source: 'map' } })); }} ariaLabel={`Click the map to place the ${active}`} />
    <p className="dhl-settings-hint">Click the map to place the {active}. {distance ? `Approximate straight-line distance: ${distance.km} (${distance.mi}).` : ''}</p>
  </div>;
}
