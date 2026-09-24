import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { geoGraticule10, geoMercator, geoPath } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Bike, CarFront, Plane, Ship, Truck } from 'lucide-react';
import { haversineKm, interpolateGreatCircle, pathLengthKm } from './geo';
import type { RoutePoint } from '../shipments/types';

/**
 * Offline route map. Country outlines come from Natural Earth (world-atlas,
 * public domain) and US state borders from the US Census (us-atlas). Both
 * ship with the app as static assets fetched on demand; no tile server, map
 * API or geocoding service is contacted.
 *
 * The line connects recorded shipment locations. It is a visualization, not
 * a road, flight path or shipping lane.
 */

type LayerKey = '110m' | '50m' | 'states';
const layerUrls: Record<LayerKey, () => Promise<{ default: string }>> = {
  '110m': () => import('world-atlas/countries-110m.json?url'),
  '50m': () => import('world-atlas/countries-50m.json?url'),
  states: () => import('us-atlas/states-10m.json?url'),
};
const cache = new Map<LayerKey, Promise<Feature<Geometry>[]>>();

function loadLayer(key: LayerKey): Promise<Feature<Geometry>[]> {
  let pending = cache.get(key);
  if (!pending) {
    pending = layerUrls[key]()
      .then(module => fetch(module.default))
      .then(response => { if (!response.ok) throw new Error('Map data unavailable'); return response.json() as Promise<Topology>; })
      .then(topology => (feature(topology, topology.objects[key === 'states' ? 'states' : 'countries']) as unknown as FeatureCollection<Geometry>).features);
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

const inUnitedStates = (point: RoutePoint) => point.lat > 18 && point.lat < 72 && point.lng > -170 && point.lng < -64;

/** Marker glyph for the transport method (static icon, no animation). */
function TransportGlyph({ transport }: { transport?: string | null }) {
  const props = { size: 12, x: -6, y: -6, color: '#fff', strokeWidth: 2.4, 'aria-hidden': true } as const;
  if (/air|flight|plane/i.test(transport || '')) return <Plane {...props} />;
  if (/sea|ocean|ship|vessel/i.test(transport || '')) return <Ship {...props} />;
  if (/motor|bike|rider/i.test(transport || '')) return <Bike {...props} />;
  if (/courier|dispatch|door|van/i.test(transport || '')) return <CarFront {...props} />;
  return <Truck {...props} />;
}

type Props = {
  /** Ordered stops: origin, optional checkpoints, destination. */
  stops: RoutePoint[];
  /** 0–1 along the whole route. */
  progress?: number | null;
  /** Put the marker exactly on this stop (latest checkpoint). Overrides progress. */
  currentStop?: number | null;
  transport?: string | null;
  height?: number;
  /** Advanced fallback: click to place a point. */
  onPick?: (point: RoutePoint) => void;
  ariaLabel?: string;
};

type Leg = { d: string; point: (t: number) => [number, number] | null; partial: (t: number) => string };

export function RouteMap({ stops, progress, currentStop, transport, height = 300, onPick, ariaLabel }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [layers, setLayers] = useState<{ countries: Feature<Geometry>[]; states: Feature<Geometry>[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setWidth(Math.round(entries[0].contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const stopsKey = stops.map(stop => `${stop.lat.toFixed(3)},${stop.lng.toFixed(3)},${stop.label || ''}`).join('|');
  const total = pathLengthKm(stops);
  const resolution: LayerKey = stops.length >= 2 && total < 1800 ? '50m' : '110m';
  const needsStates = stops.some(inUnitedStates);
  useEffect(() => {
    let active = true;
    setFailed(false);
    Promise.all([loadLayer(resolution), needsStates ? loadLayer('states') : Promise.resolve([])])
      .then(([countries, states]) => { if (active) setLayers({ countries, states }); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [resolution, needsStates]);

  const scene = useMemo(() => {
    if (!width) return null;
    const pad = 30;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const center = stops.length >= 2 ? interpolateGreatCircle(first, last, 0.5) : first || { lat: 20, lng: 0 };
    // Rotating to the route's centre keeps routes across the Pacific intact.
    const projection: GeoProjection = geoMercator().rotate([-center.lng, 0]).clipExtent([[0, 0], [width, height]]);
    if (stops.length >= 2) {
      // Frame every stop: New York → Miami stays regional, London → Tokyo goes wide.
      projection.fitExtent([[pad, pad + 14], [width - pad, height - pad]], { type: 'LineString', coordinates: stops.map(stop => [stop.lng, stop.lat]) });
      const worldScale = width / (2 * Math.PI);
      const target = Math.min(Math.max(projection.scale() * 0.74, worldScale * 0.95), worldScale * 160);
      const before = projection([center.lng, center.lat])!;
      projection.scale(target);
      const after = projection([center.lng, center.lat])!;
      const [tx, ty] = projection.translate();
      projection.translate([tx + before[0] - after[0], ty + before[1] - after[1]]);
    } else if (stops.length === 1) {
      projection.scale((width / (2 * Math.PI)) * 5).translate([width / 2, height / 2]).center([0, center.lat]);
    } else {
      projection.fitExtent([[4, 4], [width - 4, height - 4]], { type: 'Sphere' });
    }
    const path = geoPath(projection);
    const project = (point: RoutePoint) => projection([point.lng, point.lat]) as [number, number] | null;

    const legs: Leg[] = stops.slice(1).map((b, index) => {
      const a = stops[index];
      const pa = project(a), pb = project(b);
      if (pa && pb && haversineKm(a, b) < 1200) {
        // Short hops are nearly straight on a map; bow them so the leg reads as a route.
        const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
        const c: [number, number] = [(pa[0] + pb[0]) / 2 - dy * 0.2, (pa[1] + pb[1]) / 2 + dx * 0.2 - Math.hypot(dx, dy) * 0.06];
        const at = (t: number): [number, number] => [(1 - t) ** 2 * pa[0] + 2 * (1 - t) * t * c[0] + t ** 2 * pb[0], (1 - t) ** 2 * pa[1] + 2 * (1 - t) * t * c[1] + t ** 2 * pb[1]];
        return {
          d: `M${pa[0]},${pa[1]} Q${c[0]},${c[1]} ${pb[0]},${pb[1]}`,
          point: at,
          partial: t => { const q: [number, number] = [pa[0] + (c[0] - pa[0]) * t, pa[1] + (c[1] - pa[1]) * t]; const end = at(t); return `M${pa[0]},${pa[1]} Q${q[0]},${q[1]} ${end[0]},${end[1]}`; },
        };
      }
      // Long legs follow the great circle (geodesic), which d3 draws as a curve.
      return {
        d: path({ type: 'LineString', coordinates: [[a.lng, a.lat], [b.lng, b.lat]] }) || '',
        point: t => project(interpolateGreatCircle(a, b, t)),
        partial: t => { const end = interpolateGreatCircle(a, b, t); return path({ type: 'LineString', coordinates: [[a.lng, a.lat], [end.lng, end.lat]] }) || ''; },
      };
    });

    // Where the marker sits: on a stop, or a fraction of the whole route by distance.
    let marker: [number, number] | null = null;
    let travelled: string[] = [];
    if (legs.length && currentStop != null && currentStop >= 0 && currentStop < stops.length) {
      marker = project(stops[currentStop]);
      travelled = legs.slice(0, currentStop).map(leg => leg.d);
    } else if (legs.length && progress != null) {
      let remaining = Math.min(1, Math.max(0, progress)) * total;
      for (let index = 0; index < legs.length; index++) {
        const km = haversineKm(stops[index], stops[index + 1]) || 1;
        if (remaining <= km || index === legs.length - 1) {
          const t = Math.min(1, remaining / km);
          marker = legs[index].point(t);
          travelled = [...legs.slice(0, index).map(leg => leg.d), ...(t > 0 ? [legs[index].partial(t)] : [])];
          break;
        }
        remaining -= km;
      }
    }
    return { projection, path, project, legs, marker, travelled };
  }, [width, height, stopsKey, progress, currentStop, total]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (event: MouseEvent<SVGSVGElement>) => {
    if (!onPick || !scene) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const coordinates = scene.projection.invert?.([event.clientX - rect.left, event.clientY - rect.top]);
    if (coordinates) onPick({ lat: Number(coordinates[1].toFixed(4)), lng: Number((((coordinates[0] + 540) % 360) - 180).toFixed(4)) });
  };

  const stopMarker = (stop: RoutePoint, index: number) => {
    if (!scene) return null;
    const position = scene.project(stop);
    if (!position) return null;
    const [x, y] = position;
    const kind = index === 0 ? 'origin' : index === stops.length - 1 && stops.length > 1 ? 'destination' : 'checkpoint';
    const text = stop.label || (kind === 'origin' ? 'Origin' : kind === 'destination' ? 'Destination' : '');
    const anchor = x > width - 110 ? 'end' : x < 110 ? 'start' : 'middle';
    return <g key={`${index}-${stop.lat}-${stop.lng}`} className={`dhl-map-point ${kind}`} transform={`translate(${x},${y})`}>
      {kind === 'destination'
        ? <><path className="dhl-map-pin" d="M0,0 C-7,-10 -9,-13 -9,-18 A9,9 0 1 1 9,-18 C9,-13 7,-10 0,0Z" /><circle className="dhl-map-pin-dot" cy="-18" r="3.4" /></>
        : <circle className={kind === 'origin' ? 'dhl-map-origin' : 'dhl-map-checkpoint'} r={kind === 'origin' ? 6 : 4.5} />}
      {text && <text className={`dhl-map-label${kind === 'checkpoint' ? ' small' : ''}`} y={kind === 'destination' ? -32 : -11} textAnchor={anchor}>{text}</text>}
    </g>;
  };

  return <div ref={box} className={`dhl-route-map${onPick ? ' picking' : ''}`} style={{ height }}>
    {!layers && !failed && <div className="dhl-route-map-loading" aria-hidden="true" />}
    {failed && <p className="dhl-route-map-error">The map could not be drawn on this device.</p>}
    {layers && scene && <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel || 'Shipment route map'} onClick={pick}>
      <rect className="dhl-map-ocean" width={width} height={height} />
      <path className="dhl-map-graticule" d={scene.path(geoGraticule10()) || ''} />
      <g className="dhl-map-land">{layers.countries.map((country, index) => <path key={index} d={scene.path(country) || ''} />)}</g>
      {layers.states.length > 0 && <g className="dhl-map-states">{layers.states.map((state, index) => <path key={index} d={scene.path(state) || ''} />)}</g>}
      {scene.legs.map((leg, index) => <path key={`leg-${index}`} className="dhl-map-route" d={leg.d} />)}
      {scene.travelled.map((d, index) => <path key={`done-${index}`} className="dhl-map-route travelled" d={d} />)}
      {stops.map(stopMarker)}
      {scene.marker && <g className="dhl-map-current" transform={`translate(${scene.marker[0]},${scene.marker[1]})`}><circle className="halo" r="14" /><circle r="10" /><TransportGlyph transport={transport} /></g>}
    </svg>}
  </div>;
}
