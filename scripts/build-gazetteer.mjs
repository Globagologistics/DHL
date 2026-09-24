#!/usr/bin/env node
/**
 * Builds src/data/gazetteer.json, the offline location index used by the
 * route map (no geocoding service at runtime).
 *
 * Source: GeoNames (https://www.geonames.org), licensed CC BY 4.0.
 *   cities15000.txt      populated places with population >= 15,000
 *   admin1CodesASCII.txt first-level regions (states, provinces)
 *   countryInfo.txt      countries
 * Download them from https://download.geonames.org/export/dump/ and run:
 *   node scripts/build-gazetteer.mjs <folder-with-the-three-files>
 *
 * Output (compact arrays, lazy-loaded by src/services/locationService.ts):
 *   countries: [iso2, name, lat, lng]
 *   regions:   [countryIndex, name, lat, lng, code]
 *   places:    [name, regionIndex, lat, lng, populationInThousands]
 * Region and country positions are population-weighted centres of their
 * places: good for broad route visualization, not for navigation.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) { console.error('Usage: node scripts/build-gazetteer.mjs <geonames-folder>'); process.exit(1); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = value => Math.round(value * 1000) / 1000;

const countryNames = new Map();
for (const line of readFileSync(join(source, 'countryInfo.txt'), 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const columns = line.split('\t');
  countryNames.set(columns[0], columns[4]);
}

const regionNames = new Map();
for (const line of readFileSync(join(source, 'admin1CodesASCII.txt'), 'utf8').split('\n')) {
  if (!line) continue;
  const [key, name] = line.split('\t');
  regionNames.set(key, name);
}

const rows = [];
for (const line of readFileSync(join(source, 'cities15000.txt'), 'utf8').split('\n')) {
  if (!line) continue;
  const c = line.split('\t');
  const [name, lat, lng, featureCode, country, admin1, population] = [c[1], Number(c[4]), Number(c[5]), c[7], c[8], c[10], Number(c[14]) || 0];
  // Skip historical/abandoned places and sections of cities.
  if (['PPLH', 'PPLQ', 'PPLW', 'PPLX'].includes(featureCode)) continue;
  if (!countryNames.has(country)) continue;
  rows.push({ name, lat, lng, country, admin1, population });
}

const countries = [];
const countryIndex = new Map();
const regions = [];
const regionIndex = new Map();
const weights = new Map();
const addWeight = (key, row) => {
  const w = Math.max(row.population, 1);
  const entry = weights.get(key) || { lat: 0, lng: 0, total: 0 };
  entry.lat += row.lat * w; entry.lng += row.lng * w; entry.total += w;
  weights.set(key, entry);
};

for (const row of rows) {
  if (!countryIndex.has(row.country)) { countryIndex.set(row.country, countries.length); countries.push([row.country, countryNames.get(row.country)]); }
  const regionKey = `${row.country}.${row.admin1}`;
  if (row.admin1 && regionNames.has(regionKey) && !regionIndex.has(regionKey)) {
    regionIndex.set(regionKey, regions.length);
    regions.push([countryIndex.get(row.country), regionNames.get(regionKey), 0, 0, row.country === 'US' ? row.admin1 : '']);
  }
  addWeight(`c:${row.country}`, row);
  if (regionIndex.has(regionKey)) addWeight(`r:${regionKey}`, row);
}

const centre = key => { const w = weights.get(key); return [round(w.lat / w.total), round(w.lng / w.total)]; };
countries.forEach(country => country.push(...centre(`c:${country[0]}`)));
for (const [key, index] of regionIndex) { const [lat, lng] = centre(`r:${key}`); regions[index][2] = lat; regions[index][3] = lng; }

// Countries without regions still need a region slot for their places: -1.
const places = rows
  .sort((a, b) => b.population - a.population)
  .map(row => [row.name, regionIndex.get(`${row.country}.${row.admin1}`) ?? -(countryIndex.get(row.country) + 1), round(row.lat), round(row.lng), Math.round(row.population / 1000)]);

const output = {
  attribution: 'Location data © GeoNames (www.geonames.org), CC BY 4.0. Places with population of 15,000 or more.',
  countries,
  regions,
  places,
};
mkdirSync(join(root, 'src', 'data'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'gazetteer.json'), JSON.stringify(output));
console.log(`countries ${countries.length}, regions ${regions.length}, places ${places.length}`);
