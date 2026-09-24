import { haversineKm } from '../features/map/geo';
import type { RoutePoint } from '../features/shipments/types';

/**
 * Offline gazetteer: countries, first-level regions (states/provinces) and
 * ~32,000 populated places from GeoNames (CC BY 4.0), compiled by
 * scripts/build-gazetteer.mjs into src/data/gazetteer.json. The file is a
 * separate chunk loaded on first use; no geocoding service is ever called.
 *
 * Street addresses are never geocoded precisely. A shipment keeps its full
 * address for delivery and a separate ROUTE LOCATION (city, region or
 * country) whose coordinates drive the map.
 */

export type LocationKind = 'place' | 'region' | 'country';
export type GeoLocation = {
  name: string;
  region: string | null;
  regionCode: string | null;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  kind: LocationKind;
  population: number;
  /** "Miami, Florida, United States" */
  label: string;
  /** "Miami, FL" / "Lagos, Nigeria" (map pins) */
  shortLabel: string;
};

type Raw = { countries: [string, string, number, number][]; regions: [number, string, number, number, string][]; places: [string, number, number, number, number][] };
type Entry = GeoLocation & { key: string; words: string[] };
type Index = { entries: Entry[]; countryByKey: Map<string, Entry>; regionsByCountry: Map<string, Entry[]> };

export const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.’']/g, '').replace(/\s+/g, ' ').trim();

// Common ways people write countries in addresses.
const countryAliases: Record<string, string> = {
  usa: 'US', us: 'US', 'u s a': 'US', 'united states of america': 'US', america: 'US',
  uk: 'GB', 'u k': 'GB', 'great britain': 'GB', britain: 'GB', england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB',
  uae: 'AE', emirates: 'AE', 'czech republic': 'CZ', holland: 'NL', 'the netherlands': 'NL', korea: 'KR', 'republic of korea': 'KR',
  'ivory coast': 'CI', 'cote divoire': 'CI', turkey: 'TR', russia: 'RU', 'drc': 'CD', 'dr congo': 'CD',
};
// Places whose everyday name differs from the GeoNames name.
const placeAliases: Record<string, string> = { 'new york': 'new york city', nyc: 'new york city', 'washington dc': 'washington', 'washington d c': 'washington', kiev: 'kyiv' };

let pending: Promise<Index> | null = null;

function label(name: string, region: string | null, country: string) {
  return [name, region && fold(region) !== fold(name) ? region : null, country].filter(Boolean).join(', ');
}

async function load(): Promise<Index> {
  pending ??= import('../data/gazetteer.json?url').then(module => fetch(module.default)).then(response => {
    if (!response.ok) throw new Error('Location data could not be loaded.');
    return response.json() as Promise<Raw>;
  }).then(raw => {
    const entries: Entry[] = [];
    const countryByKey = new Map<string, Entry>();
    const regionsByCountry = new Map<string, Entry[]>();
    const countries = raw.countries.map(([code, name, lat, lng]) => {
      const entry: Entry = { name, region: null, regionCode: null, country: name, countryCode: code, lat, lng, kind: 'country', population: 0, label: name, shortLabel: name, key: fold(name), words: fold(name).split(' ') };
      entries.push(entry);
      countryByKey.set(fold(name), entry);
      countryByKey.set(code.toLowerCase(), entry);
      return entry;
    });
    for (const [alias, code] of Object.entries(countryAliases)) { const match = countries.find(country => country.countryCode === code); if (match) countryByKey.set(alias, match); }
    const regions = raw.regions.map(([countryIndex, name, lat, lng, code]) => {
      const country = countries[countryIndex];
      const entry: Entry = { name, region: name, regionCode: code || null, country: country.country, countryCode: country.countryCode, lat, lng, kind: 'region', population: 0, label: `${name}, ${country.country}`, shortLabel: `${name}, ${country.country}`, key: fold(name), words: fold(name).split(' ') };
      entries.push(entry);
      regionsByCountry.set(country.countryCode, [...(regionsByCountry.get(country.countryCode) || []), entry]);
      return entry;
    });
    for (const [name, regionRef, lat, lng, population] of raw.places) {
      const region = regionRef >= 0 ? regions[regionRef] : null;
      const country = region ? countries.find(item => item.countryCode === region.countryCode)! : countries[-regionRef - 1];
      const shortRegion = country.countryCode === 'US' && region?.regionCode ? region.regionCode : null;
      entries.push({ name, region: region?.name || null, regionCode: region?.regionCode || null, country: country.country, countryCode: country.countryCode, lat, lng, kind: 'place', population: population * 1000, label: label(name, region?.name || null, country.country), shortLabel: shortRegion ? `${name}, ${shortRegion}` : `${name}, ${country.country}`, key: fold(name), words: fold(name).split(' ') });
    }
    return { entries, countryByKey, regionsByCountry };
  }).catch(error => { pending = null; throw error; });
  return pending;
}

export const preloadLocations = () => { void load(); };

const strip = ({ key: _key, words: _words, ...location }: Entry): GeoLocation => location;
export const toRoutePoint = (location: GeoLocation, source: RoutePoint['source'] = 'selected'): RoutePoint => ({ lat: location.lat, lng: location.lng, label: location.shortLabel, detail: location.label, source });

/** Qualifier ("Florida", "FL", "United States") matches this entry's region or country. */
function qualifies(entry: Entry, qualifier: string, index: Index) {
  if (!qualifier) return true;
  const country = index.countryByKey.get(qualifier);
  if (country) return entry.countryCode === country.countryCode;
  return Boolean((entry.region && fold(entry.region).startsWith(qualifier)) || (entry.regionCode && entry.regionCode.toLowerCase() === qualifier) || fold(entry.country).startsWith(qualifier));
}

/**
 * Autocomplete: "Lago" → Lagos, Nigeria; "miami, fl" → Miami, Florida.
 * Ranked by exactness, then size; regions and countries are included.
 */
export async function searchLocations(query: string, limit = 8): Promise<GeoLocation[]> {
  const [main = '', ...qualifiers] = query.split(',').map(fold);
  if (main.length < 2) return [];
  const index = await load();
  const target = placeAliases[main] || main;
  const scored: { entry: Entry; score: number }[] = [];
  for (const entry of index.entries) {
    let score = entry.key === target || entry.key === main ? 100 : entry.key.startsWith(main) ? 70 : entry.words.some(word => word.startsWith(main)) ? 45 : 0;
    if (!score) continue;
    if (!qualifiers.every(qualifier => qualifies(entry, qualifier, index))) continue;
    score += entry.kind === 'country' ? 14 : entry.kind === 'region' ? 8 : Math.log10(entry.population + 10) * 4;
    scored.push({ entry, score });
  }
  const seen = new Set<string>();
  return scored.sort((a, b) => b.score - a.score).map(item => item.entry).filter(entry => !seen.has(entry.label) && seen.add(entry.label)).slice(0, limit).map(strip);
}

export type AddressResolution =
  | { status: 'resolved'; location: GeoLocation; /** More precise options when only a region/country was found. */ suggestions: GeoLocation[] }
  | { status: 'ambiguous'; options: GeoLocation[] }
  | { status: 'none' };

/**
 * Finds the route location named in a free-text address. Uses the most
 * specific place it can confirm (country and region narrow the match). When
 * a name matches several places and nothing disambiguates it, the options are
 * returned instead of a guess.
 */
export async function resolveAddress(address: string): Promise<AddressResolution> {
  const index = await load();
  const parts = address.split(/[,\n]/).map(part => fold(part.replace(/\b\d{4,}(-\d+)?\b/g, ''))).filter(Boolean);
  if (!parts.length) return { status: 'none' };
  let country: Entry | null = null;
  for (let i = parts.length - 1; i >= 0 && !country; i--) country = index.countryByKey.get(parts[i]) || null;
  const regionPool = country ? index.regionsByCountry.get(country.countryCode) || [] : [];
  let region: Entry | null = null;
  for (const part of parts) {
    const match = regionPool.find(entry => entry.key === part || entry.regionCode?.toLowerCase() === part || entry.regionCode?.toLowerCase() === part.split(' ')[0]);
    if (match) { region = match; }
  }
  // Earliest recognised place wins ("Ikeja, Lagos, Nigeria" → Ikeja). Street lines are skipped.
  for (const part of parts) {
    if (/\d/.test(part) && part.split(' ').length > 1) continue;
    const key = placeAliases[part] || part;
    let matches = index.entries.filter(entry => entry.kind === 'place' && entry.key === key && (!country || entry.countryCode === country.countryCode));
    if (region && matches.some(entry => entry.region === region!.name)) matches = matches.filter(entry => entry.region === region!.name);
    if (matches.length === 1) return { status: 'resolved', location: strip(matches[0]), suggestions: [] };
    if (matches.length > 1) return { status: 'ambiguous', options: matches.sort((a, b) => b.population - a.population).slice(0, 6).map(strip) };
  }
  const largest = (entries: Entry[]) => entries.sort((a, b) => b.population - a.population).slice(0, 4).map(strip);
  if (region) return { status: 'resolved', location: strip(region), suggestions: largest(index.entries.filter(entry => entry.kind === 'place' && entry.region === region!.name && entry.countryCode === region!.countryCode)) };
  if (country) return { status: 'resolved', location: strip(country), suggestions: largest(index.entries.filter(entry => entry.kind === 'place' && entry.countryCode === country!.countryCode)) };
  return { status: 'none' };
}

/** Nearest populated place within `maxKm`, used to label a manually placed pin. */
export async function nearestLocation(point: RoutePoint, maxKm = 60): Promise<GeoLocation | null> {
  const index = await load();
  let best: { entry: Entry; km: number } | null = null;
  for (const entry of index.entries) {
    if (entry.kind !== 'place' || Math.abs(entry.lat - point.lat) > 1.5) continue;
    const km = haversineKm(point, entry);
    if (km <= maxKm && (!best || km < best.km)) best = { entry, km };
  }
  return best ? strip(best.entry) : null;
}

export const GAZETTEER_ATTRIBUTION = 'Location data © GeoNames, CC BY 4.0';
