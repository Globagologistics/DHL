import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Globe2, Loader2, MapPin, Search } from 'lucide-react';
import { resolveAddress, searchLocations, toRoutePoint } from '../../services/locationService';
import type { AddressResolution, GeoLocation } from '../../services/locationService';
import type { RoutePoint } from '../shipments/types';

const kindLabel: Record<GeoLocation['kind'], string> = { place: 'City', region: 'State / region', country: 'Country' };

/** Offline location autocomplete over the bundled gazetteer. */
export function LocationSearch({ onSelect, placeholder = 'Search a city, state or country…', autoFocus = false, label }: { onSelect: (location: GeoLocation) => void; placeholder?: string; autoFocus?: boolean; label: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const request = useRef(0);
  useEffect(() => {
    const current = ++request.current;
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchLocations(query).then(found => { if (current === request.current) { setResults(found); setActive(0); setLoading(false); } }).catch(() => setLoading(false));
    }, 140);
    return () => window.clearTimeout(timer);
  }, [query]);
  const choose = (location: GeoLocation) => { onSelect(location); setQuery(''); setResults([]); };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(value => (value + 1) % results.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => (value - 1 + results.length) % results.length); }
    if (event.key === 'Enter') { event.preventDefault(); choose(results[active]); }
    if (event.key === 'Escape') setResults([]);
  };
  return <div className="dhl-location-search">
    <label className="dhl-admin-list-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} aria-label={label} role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-autocomplete="list" autoFocus={autoFocus} />{loading && <Loader2 size={15} className="dhl-spin" aria-hidden="true" />}</label>
    {results.length > 0 && <ul id={listId} role="listbox">{results.map((location, index) => <li key={location.label} role="option" aria-selected={index === active}><button type="button" className={index === active ? 'active' : ''} onMouseDown={event => event.preventDefault()} onClick={() => choose(location)}>{location.kind === 'country' ? <Globe2 size={15} /> : <MapPin size={15} />}<span><strong>{location.label}</strong><small>{kindLabel[location.kind]}</small></span></button></li>)}</ul>}
  </div>;
}

type FieldProps = { label: string; address: string; value: RoutePoint | null | undefined; onChange: (point: RoutePoint | null) => void };

/**
 * The route location for one end of the shipment. Detected automatically from
 * the full address and shown for confirmation; ambiguous names are never
 * guessed; the admin can change it with local search at any time.
 */
export function RouteLocationField({ label, address, value, onChange }: FieldProps) {
  const [resolution, setResolution] = useState<AddressResolution | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const request = useRef(0);
  const mounted = useRef(true);
  const pending = useRef<{ timer: number; address: string } | null>(null);

  // Resolution always completes, even if the admin moves to the next step
  // first: the result goes to the wizard (still mounted), and only the newest
  // address wins, so a stale location can never survive an edit.
  const detect = (text: string) => {
    const current = ++request.current;
    void resolveAddress(text).then(result => {
      if (current !== request.current) return;
      if (mounted.current) { setDetecting(false); setResolution(result); }
      if (result.status === 'resolved') onChangeRef.current(toRoutePoint(result.location, 'auto'));
      else if (valueRef.current?.source === 'auto') onChangeRef.current(null);
    }).catch(() => { if (mounted.current) setDetecting(false); });
  };

  useEffect(() => {
    // A location the admin chose deliberately is never overwritten.
    if (valueRef.current && valueRef.current.source !== 'auto') { setResolution(null); return; }
    if (address.trim().length < 3) { setResolution(null); return; }
    setDetecting(true);
    const timer = window.setTimeout(() => { pending.current = null; detect(address); }, 450);
    pending.current = { timer, address };
    return () => { window.clearTimeout(timer); };
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Leaving the step mid-debounce: resolve now instead of dropping it.
      if (pending.current) { const { address: text } = pending.current; pending.current = null; detect(text); }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (location: GeoLocation) => { onChange(toRoutePoint(location, 'selected')); setSearching(false); setResolution(null); };

  return <div className="dhl-route-location">
    <div className="dhl-route-location-head"><MapPin size={15} /><span>{label}</span>{detecting && <Loader2 size={14} className="dhl-spin" aria-label="Finding location" />}</div>
    {value && !searching && <div className="dhl-route-location-value">
      <span><strong>{value.detail || value.label}</strong><small>{value.source === 'auto' ? 'Found in the address · used for the map' : value.source === 'map' ? 'Placed on the map' : 'Selected · used for the map'}</small></span>
      <button type="button" onClick={() => setSearching(true)}>Change</button>
    </div>}
    {resolution?.status === 'resolved' && resolution.suggestions.length > 0 && value?.source === 'auto' && <div className="dhl-route-location-options"><small>More precise:</small>{resolution.suggestions.map(option => <button key={option.label} type="button" onClick={() => select(option)}>{option.name}</button>)}</div>}
    {resolution?.status === 'ambiguous' && !value && <div className="dhl-route-location-options ambiguous"><small>Which one do you mean?</small>{resolution.options.map(option => <button key={option.label} type="button" onClick={() => select(option)}>{option.label}</button>)}</div>}
    {resolution?.status === 'none' && !value && !detecting && <p className="dhl-route-location-hint">No city, state or country recognised in this address yet. Search for it below.</p>}
    {(searching || !value) && <LocationSearch label={`Search ${label.toLowerCase()}`} onSelect={select} autoFocus={searching} />}
    {searching && <button type="button" className="dhl-admin-text-action" onClick={() => setSearching(false)}>Cancel</button>}
  </div>;
}
