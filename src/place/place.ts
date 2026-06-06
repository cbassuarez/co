// place.ts — the single source of "where".
//
// co is the same piece everywhere, but it should read differently depending on
// where it runs: dense rectilinear New York vs sparse boulevard Los Angeles, and
// — when shipped as a fixed install to a museum or transit authority — pinned to
// that one venue regardless of the machine it runs on.
//
// A PlaceConfig is a structured set of levers that map onto the existing systems
// (agents / routes / windows / placeFields / signals / dramaturgy). resolvePlace()
// chooses one through a priority chain that answers both deployment modes with a
// single mechanism:
//
//   1. baked venue   — compile-time __CO_VENUE__ (set per tarball). Wins. Pinned,
//                      offline-safe, curator-approved.
//   2. ?place=nyc|la — explicit override, for authoring and web preview.
//   3. timezone       — Intl.DateTimeFormat().resolvedOptions().timeZone mapped to
//                      the nearest known place. Zero network, zero permission;
//                      reads the visitor's tz on the web, the venue's tz on install.
//   4. web-default    — the baseline look (exactly today's values).

import SKYLINES from './skylines.json';

export type AccentKey = 'white' | 'red' | 'yellow' | 'blue' | 'green' | 'fuchsia' | 'rare';

export interface AgentPalette {
  // Warm-cool tint of the dominant field colour and the seven civic accents.
  accents: Record<AccentKey, number>;            // hex
  // Cumulative bands: roll rng() and take the first band whose `upTo` exceeds it.
  bands: Array<{ key: AccentKey; upTo: number; aff: number }>;
}

export interface PlaceConfig {
  id: string;
  label: string;
  timezone: string;       // IANA — used for tz→place and local-time inflection
  seedSalt: string;       // folded into the master seed so each place is its own world

  field: { width: number; depth: number; height: number };

  agents: {
    countScale: number;       // multiplies the quality-based base count
    airborneFraction: number; // fraction of mid-air "packet" agents
    zBias: number;            // positive-z field bound as a fraction of depth (toward camera)
    routedFraction: number;   // fraction of agents bound to routes
    palette: AgentPalette;
  };

  routes: {
    count: number;
    gridBias: number;        // 0 = organic arcs … 1 = rectilinear grid
    orientationDeg: number;  // preferred axis (deg) for gridded routes
    curveTension: number;    // CatmullRom tension (lower = stiffer)
    accentFraction: number;  // share of routes that are accent-coloured
  };

  windows: {
    count: number;
    aspect: number;          // <1 tall/narrow (facade) … >1 wide/shallow (billboard)
    arcWidth: number;        // half-arc (radians) the windows span behind the field
    arcRadiusScale: number;  // arc radius as a multiple of field width
    sync: number;            // 0 = staggered openings … 1 = synchronised
    color: number;           // hex
  };

  halo: {
    color: number;           // hex
    breathHz: number;        // breathing rate of the ground halo
    radius: number;          // halo falloff radius
    intensityScale: number;  // multiplies the dramaturgy halo curve
  };

  // The agents coalesce out of the dispersed crowd into a real city's skyline
  // silhouette at the synchronization, then disperse again (profiles baked from OSM
  // into skylines.json by scripts/build-skylines.mjs). No camera move; the city
  // assembles in the distance.
  skyline: {
    profileId: string;       // key into skylines.json, or 'flat' for no skyline
    assemble: number;        // 0 = never coalesces (canonical) … 1 = fully assembles at sync
    depth: number;           // back-wall z as a fraction of field depth (where it stands)
    heightScale: number;     // world-unit multiplier over the silhouette
    densityBias: number;     // 0 = even spawn-x … 1 = concentrate agents under tall/dense bins
  };

  tempo: {
    syncTime: number;             // normalized t of the major synchronization
    syncTightness: number;        // <1 tighter / >1 looser sync window
    densityRampSharpness: number; // scales how sharply the crowd arrives
    phaseFollowsLocalTime: boolean; // enter the arc at a phase set by local hour
  };

  scene?: { fog?: number };       // optional fog tint override
}

// ---- Shared accent hexes (the rounded-out civic palette) -------------------
const ACCENT_HEX: Record<AccentKey, number> = {
  white: 0xf6f6fa,
  red: 0xff2a35,
  yellow: 0xffc329,
  blue: 0x2a78ff,
  green: 0x1fcf6a,
  fuchsia: 0xff2a9d,
  rare: 0x7c3aff
};

// web-default reproduces today's exact agent colour bands.
const DEFAULT_BANDS: AgentPalette['bands'] = [
  { key: 'white', upTo: 0.76, aff: 0 },
  { key: 'yellow', upTo: 0.85, aff: 0.85 },
  { key: 'red', upTo: 0.91, aff: 0.85 },
  { key: 'blue', upTo: 0.96, aff: 0.85 },
  { key: 'green', upTo: 0.985, aff: 0.85 },
  { key: 'fuchsia', upTo: 0.997, aff: 0.85 },
  { key: 'rare', upTo: 1.0, aff: 0.85 }
];

// ---- Skyline profiles (baked from OSM by scripts/build-skylines.mjs) --------
export interface SkylineProfile {
  bins: number;
  peakMeters: number;
  profile: number[]; // 0..1 silhouette top across x
  density: number[]; // 0..1 building density across x
}

const FLAT_SKYLINE: SkylineProfile = { bins: 1, peakMeters: 0, profile: [0], density: [1] };

export function getSkyline(profileId: string): SkylineProfile {
  const s = (SKYLINES as Record<string, unknown>)[profileId] as SkylineProfile | undefined;
  if (!s || !Array.isArray(s.profile) || s.profile.length === 0) return FLAT_SKYLINE;
  return s;
}

// Sample a normalized 0..1 array at x in [0,1].
export function sampleProfileArray(arr: number[], x: number): number {
  if (arr.length === 0) return 0;
  const i = Math.min(arr.length - 1, Math.max(0, Math.floor(x * arr.length)));
  return arr[i];
}

// Real building metres per world unit, so cities scale relative to each other
// (NYC ~295 m reads taller than LA ~149 m).
export const SKYLINE_METERS_PER_UNIT = 60;

// ---- The registry ----------------------------------------------------------
export const PLACES: Record<string, PlaceConfig> = {
  // The baseline — identical to the pre-place behaviour.
  'web-default': {
    id: 'web-default',
    label: 'co',
    timezone: 'UTC',
    seedSalt: '', // empty = no salt, so the baseline reproduces the canonical v1.0.0 world
    field: { width: 10.0, depth: 9.0, height: 4.0 },
    agents: {
      countScale: 1.0,
      airborneFraction: 0.18,
      zBias: 0.6,
      routedFraction: 0.66,
      palette: { accents: { ...ACCENT_HEX }, bands: DEFAULT_BANDS }
    },
    routes: { count: 14, gridBias: 0.0, orientationDeg: 0, curveTension: 0.45, accentFraction: 0.30 },
    windows: { count: 6, aspect: 1.0, arcWidth: Math.PI * 0.55, arcRadiusScale: 0.75, sync: 0.0, color: 0xb8c4d6 },
    halo: { color: 0x6a8cbf, breathHz: 0.4, radius: 7.0, intensityScale: 1.0 },
    // No skyline assembly: web-default stays byte-canonical to v1.0.0.
    skyline: { profileId: 'flat', assemble: 0.0, depth: 0.6, heightScale: 1.0, densityBias: 0.0 },
    tempo: { syncTime: 0.68, syncTightness: 1.0, densityRampSharpness: 1.0, phaseFollowsLocalTime: false }
  },

  // New York — dense, rectilinear, tall narrow facades, cool steel halo, tight late sync.
  nyc: {
    id: 'nyc',
    label: 'New York',
    timezone: 'America/New_York',
    seedSalt: 'nyc',
    field: { width: 9.0, depth: 11.0, height: 5.0 },
    agents: {
      countScale: 1.25,
      airborneFraction: 0.26,
      zBias: 0.9,
      routedFraction: 0.42, // most agents stand and form the skyline; the rest thread routes
      palette: {
        accents: { ...ACCENT_HEX, white: 0xeef2fb },
        bands: [
          { key: 'white', upTo: 0.74, aff: 0 },
          { key: 'blue', upTo: 0.84, aff: 0.85 },
          { key: 'yellow', upTo: 0.90, aff: 0.85 },
          { key: 'red', upTo: 0.95, aff: 0.85 },
          { key: 'green', upTo: 0.975, aff: 0.85 },
          { key: 'fuchsia', upTo: 0.99, aff: 0.85 },
          { key: 'rare', upTo: 1.0, aff: 0.85 }
        ]
      }
    },
    routes: { count: 20, gridBias: 0.85, orientationDeg: 0, curveTension: 0.05, accentFraction: 0.34 },
    windows: { count: 16, aspect: 0.5, arcWidth: Math.PI * 0.42, arcRadiusScale: 0.8, sync: 0.7, color: 0xaebcc8 },
    halo: { color: 0x5f78a6, breathHz: 0.6, radius: 6.0, intensityScale: 1.0 },
    // Tall, clustered Manhattan silhouette coalescing at the back.
    skyline: { profileId: 'nyc', assemble: 1.0, depth: 0.65, heightScale: 1.5, densityBias: 0.6 },
    tempo: { syncTime: 0.66, syncTightness: 0.7, densityRampSharpness: 1.3, phaseFollowsLocalTime: false }
  },

  // Los Angeles — sparse, E-W boulevard arcs, wide shallow billboards, warm amber halo, loose sync.
  la: {
    id: 'la',
    label: 'Los Angeles',
    timezone: 'America/Los_Angeles',
    seedSalt: 'la',
    field: { width: 13.0, depth: 7.0, height: 3.5 },
    agents: {
      countScale: 0.8,
      airborneFraction: 0.12,
      zBias: 0.4,
      routedFraction: 0.4, // a low, spread standing field forms the skyline
      palette: {
        accents: { ...ACCENT_HEX, white: 0xfaf4ea },
        bands: [
          { key: 'white', upTo: 0.74, aff: 0 },
          { key: 'yellow', upTo: 0.86, aff: 0.85 },
          { key: 'red', upTo: 0.92, aff: 0.85 },
          { key: 'blue', upTo: 0.95, aff: 0.85 },
          { key: 'green', upTo: 0.975, aff: 0.85 },
          { key: 'fuchsia', upTo: 0.995, aff: 0.85 },
          { key: 'rare', upTo: 1.0, aff: 0.85 }
        ]
      }
    },
    routes: { count: 10, gridBias: 0.4, orientationDeg: 90, curveTension: 0.6, accentFraction: 0.26 },
    windows: { count: 4, aspect: 1.8, arcWidth: Math.PI * 0.7, arcRadiusScale: 1.1, sync: 0.2, color: 0xd8c4a8 },
    halo: { color: 0xc8945f, breathHz: 0.28, radius: 8.0, intensityScale: 1.1 },
    // Low, wide downtown cluster coalescing at the back.
    skyline: { profileId: 'la', assemble: 1.0, depth: 0.6, heightScale: 1.3, densityBias: 0.45 },
    tempo: { syncTime: 0.72, syncTightness: 1.4, densityRampSharpness: 0.8, phaseFollowsLocalTime: false }
  }
};

// IANA timezone → place id. Coarse on purpose: enough to separate NY from LA.
const TZ_TO_PLACE: Record<string, string> = {
  'America/New_York': 'nyc',
  'America/Detroit': 'nyc',
  'America/Toronto': 'nyc',
  'America/Los_Angeles': 'la',
  'America/Vancouver': 'la',
  'America/Tijuana': 'la'
};

function timezonePlace(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_PLACE[tz] ?? null;
  } catch {
    return null;
  }
}

// Injected by Vite `define`; defaults to null on the public web build, set to a
// place/venue id when a per-venue tarball is built.
declare const __CO_VENUE__: string | null;

export interface ResolveOpts {
  placeParam?: string | null;
}

export function resolvePlace(opts: ResolveOpts = {}): PlaceConfig {
  // 1. Baked venue wins (pinned install).
  const venue: string | null = typeof __CO_VENUE__ !== 'undefined' ? __CO_VENUE__ : null;
  if (venue && PLACES[venue]) return PLACES[venue];

  // 2. Explicit ?place= override.
  if (opts.placeParam && PLACES[opts.placeParam]) return PLACES[opts.placeParam];

  // 3. Timezone-derived place.
  const tz = timezonePlace();
  if (tz && PLACES[tz]) return PLACES[tz];

  // 4. Fallback baseline.
  return PLACES['web-default'];
}

// Local hour [0,24) for a place's timezone, used for optional phase inflection.
export function localHourFor(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return h + m / 60;
  } catch {
    return 0;
  }
}
