// build-skylines.mjs — bake compact per-city skyline profiles for co.
//
// Author-time ETL (NOT a runtime dependency). Queries the Overpass API for
// buildings carrying height (or building:levels), reduces them to a normalized
// 1-D silhouette profile + per-bin density, and writes src/place/skylines.json,
// which is committed and sampled offline at runtime. Re-runnable; raw Overpass
// responses are cached so reruns are cheap.
//
// Usage:
//   node scripts/build-skylines.mjs                 # all cities (cache if present)
//   node scripts/build-skylines.mjs --refresh       # re-fetch from Overpass
//   node scripts/build-skylines.mjs --city nyc      # one city
//   node scripts/build-skylines.mjs --bins 64
//
// Data © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright).

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(ROOT, 'scripts/.cache/skylines');
const OUT = resolve(ROOT, 'src/place/skylines.json');
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'co-skyline-etl/1.0 (https://cbassuarez.com/co; ssuarezsolis@calarts.edu)';

// Cities to bake. center = [lat, lon]; radiusM = half-extent of the sampled box;
// axisDeg = compass bearing of the silhouette's +x (90 = east–west spread).
const CITIES = [
  { id: 'nyc',     label: 'New York',    center: [40.7549, -73.9840], radiusM: 2000, axisDeg: 90 },
  { id: 'la',      label: 'Los Angeles', center: [34.0490, -118.2570], radiusM: 1800, axisDeg: 90 },
  { id: 'chicago', label: 'Chicago',     center: [41.8800, -87.6280], radiusM: 1700, axisDeg: 90 },
  { id: 'sf',      label: 'San Francisco', center: [37.7920, -122.4010], radiusM: 1300, axisDeg: 90 }
];

function parseArgs(argv) {
  const a = { refresh: false, city: null, bins: 64 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--refresh') a.refresh = true;
    else if (k === '--city') a.city = argv[++i];
    else if (k === '--bins') a.bins = parseInt(argv[++i]);
  }
  return a;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function overpassQuery(c) {
  const [lat, lon] = c.center;
  // approximate degrees for the radius box
  const dLat = c.radiusM / 110540;
  const dLon = c.radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const bbox = `${(lat - dLat).toFixed(5)},${(lon - dLon).toFixed(5)},${(lat + dLat).toFixed(5)},${(lon + dLon).toFixed(5)}`;
  return `[out:json][timeout:90];
(
  way["building"]["height"](${bbox});
  way["building"]["building:levels"](${bbox});
  relation["building"]["height"](${bbox});
  relation["building"]["building:levels"](${bbox});
);
out tags center;`;
}

async function fetchCity(c, refresh) {
  const cacheFile = resolve(CACHE, `${c.id}.json`);
  if (!refresh && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  }
  const q = overpassQuery(c);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(OVERPASS, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q)
      });
      if (res.status === 429 || res.status === 504) throw new Error(`overpass busy (${res.status})`);
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const json = await res.json();
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(json));
      return json;
    } catch (e) {
      const backoff = attempt * 4000;
      console.warn(`  ${c.id}: ${e.message} — retry ${attempt}/4 in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
  throw new Error(`failed to fetch ${c.id} after retries`);
}

function parseHeight(tags) {
  if (tags.height) {
    const m = String(tags.height).match(/[\d.]+/);
    if (m) return parseFloat(m[0]);
  }
  if (tags['building:levels']) {
    const m = String(tags['building:levels']).match(/[\d.]+/);
    if (m) return parseFloat(m[0]) * 3.2; // ~3.2 m/floor
  }
  return null;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[i];
}

// light 3-tap smoothing so the silhouette isn't single-bin jagged
function smooth(a) {
  return a.map((_, i) => {
    const l = a[Math.max(0, i - 1)], c = a[i], r = a[Math.min(a.length - 1, i + 1)];
    return (l + 2 * c + r) / 4;
  });
}

function reduceCity(c, json, bins) {
  const [clat, clon] = c.center;
  const a = (c.axisDeg * Math.PI) / 180;
  const R = c.radiusM;
  const binHeights = Array.from({ length: bins }, () => []);
  const binCount = new Array(bins).fill(0);
  let used = 0;

  for (const el of json.elements || []) {
    const tags = el.tags || {};
    const ctr = el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null);
    if (!ctr) continue;
    const h = parseHeight(tags);
    if (!h || h <= 0 || h > 900) continue; // drop missing / absurd
    const dEast = (ctr.lon - clon) * 111320 * Math.cos((clat * Math.PI) / 180);
    const dNorth = (ctr.lat - clat) * 110540;
    const x = dEast * Math.sin(a) + dNorth * Math.cos(a); // meters along the silhouette axis
    if (x < -R || x > R) continue;
    const bin = Math.min(bins - 1, Math.max(0, Math.floor(((x + R) / (2 * R)) * bins)));
    binHeights[bin].push(h);
    binCount[bin]++;
    used++;
  }

  // per-bin silhouette top = p98 (the tallest edge, but robust to one mis-tagged
  // outlier), then light smoothing
  let profileM = binHeights.map((hs) => percentile(hs, 98));
  profileM = smooth(profileM);
  const peakMeters = Math.max(1, ...profileM);
  const profile = profileM.map((m) => +(m / peakMeters).toFixed(4));
  const maxCount = Math.max(1, ...binCount);
  const density = binCount.map((n) => +(n / maxCount).toFixed(4));

  return { label: c.label, center: c.center, axisDeg: c.axisDeg, bins, buildings: used, peakMeters: Math.round(peakMeters), profile, density };
}

async function main() {
  const args = parseArgs(process.argv);
  const cities = args.city ? CITIES.filter((c) => c.id === args.city) : CITIES;
  if (!cities.length) throw new Error(`unknown --city '${args.city}'`);

  const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  out._attribution = 'Skyline profiles derived from OpenStreetMap building data, © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright).';

  for (const c of cities) {
    process.stdout.write(`fetching ${c.id} (${c.label}) … `);
    const json = await fetchCity(c, args.refresh);
    const reduced = reduceCity(c, json, args.bins);
    out[c.id] = reduced;
    console.log(`${reduced.buildings} buildings, peak ~${reduced.peakMeters} m`);
    if (reduced.buildings < 40) {
      console.warn(`  ⚠ ${c.id}: sparse height data (${reduced.buildings}); profile may be weak.`);
    }
    await sleep(1200); // be polite to Overpass
  }

  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
  console.log(`\n✓ wrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
