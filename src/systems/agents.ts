import * as THREE from 'three';
import type { RNG } from '../engine/seed';
import { rangeRNG } from '../engine/seed';
import type { AccentKey, PlaceConfig } from '../place/place';
import { getSkyline, sampleProfileArray, SKYLINE_METERS_PER_UNIT } from '../place/place';
import agentVert from '../shaders/agent.vert?raw';
import agentFrag from '../shaders/agent.frag?raw';

// Inverse-CDF of a per-bin density: map a uniform u in [0,1] to the x in [0,1]
// where the cumulative building density reaches u, so agents concentrate under
// the dense (downtown) bins.
function densityInverse(density: number[], total: number, u: number): number {
  if (total <= 0) return u;
  const target = u * total;
  let acc = 0;
  for (let i = 0; i < density.length; i++) {
    const next = acc + density[i];
    if (target <= next) {
      const frac = density[i] > 0 ? (target - acc) / density[i] : 0;
      return (i + frac) / density.length;
    }
    acc = next;
  }
  return 1;
}

// The civic accent palette and its frequency bands are supplied by the place
// (see src/place/place.ts) — rounded out past the red/white/blue reading, and
// tinted warm/cool per place. web-default reproduces the baseline exactly.

export interface AgentPool {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  count: number;
  positions: Float32Array;       // x,y,z
  velocities: Float32Array;      // x,y,z
  colors: Float32Array;          // r,g,b
  brightness: Float32Array;      // single
  scales: Float32Array;          // x,y
  routeAff: Float32Array;        // 0..1
  phases: Float32Array;
  seeds: Float32Array;
  routeIndex: Int16Array;        // index into routes array; -1 = unrouted
  skyHomeX: Float32Array;        // assembled-skyline home position + height
  skyHomeZ: Float32Array;
  skyHomeH: Float32Array;
  scatterZ: Float32Array;        // dispersed-anchor depth + base height
  dispH: Float32Array;
  // attribute handles for re-upload
  attrPos: THREE.InstancedBufferAttribute;
  attrCol: THREE.InstancedBufferAttribute;
  attrBri: THREE.InstancedBufferAttribute;
  attrScl: THREE.InstancedBufferAttribute;
  attrAff: THREE.InstancedBufferAttribute;
  setActiveCount(n: number): void;
}

export interface AgentSpawnOpts {
  count: number;
  rng: RNG;
  fieldWidth: number;     // half-width in x
  fieldDepth: number;     // half-depth in z
  fieldHeight: number;    // y reach (most agents near 0)
  place: PlaceConfig;
}

export function createAgents(opts: AgentSpawnOpts): AgentPool {
  const N = opts.count;
  const rng = opts.rng;
  const pal = opts.place.agents.palette;
  const accentColor = {} as Record<AccentKey, THREE.Color>;
  (Object.keys(pal.accents) as AccentKey[]).forEach((k) => {
    accentColor[k] = new THREE.Color(pal.accents[k]);
  });
  const airborneFraction = opts.place.agents.airborneFraction;
  const zFront = opts.fieldDepth * opts.place.agents.zBias;

  // Skyline: each agent's "home" is where it stands when the city assembles —
  // floor agents at the back-wall silhouette, at their column's building height.
  const sky = getSkyline(opts.place.skyline.profileId);
  const heightScale = opts.place.skyline.heightScale;
  const densityBias = opts.place.skyline.densityBias;
  const skyDepth = opts.fieldDepth * opts.place.skyline.depth; // back-wall z the silhouette stands at
  const silUnitsMax = sky.peakMeters / SKYLINE_METERS_PER_UNIT; // world height at silhouette top
  let densTotal = 0;
  for (const d of sky.density) densTotal += d;

  // unit vertical plane: x in [-0.5, 0.5], y in [-0.5, 0.5]
  const baseGeom = new THREE.PlaneGeometry(1, 1, 1, 1);
  const geom = new THREE.InstancedBufferGeometry();
  geom.index = baseGeom.index;
  geom.attributes.position = baseGeom.attributes.position;
  geom.attributes.uv = baseGeom.attributes.uv;
  geom.instanceCount = N;

  const positions = new Float32Array(N * 3);
  const velocities = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const brightness = new Float32Array(N);
  const scales = new Float32Array(N * 2);
  const routeAff = new Float32Array(N);
  const phases = new Float32Array(N);
  const seeds = new Float32Array(N);
  const routeIndex = new Int16Array(N);
  // Skyline-assembled "home" position + height per agent, and the dispersed
  // anchor (spawn depth + base height) it returns to when the city scatters.
  const skyHomeX = new Float32Array(N);
  const skyHomeZ = new Float32Array(N);
  const skyHomeH = new Float32Array(N);
  const scatterZ = new Float32Array(N);
  const dispH = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    // Most agents are floor-anchored bodies. A small fraction are mid-air
    // packets/air-currents — they keep the figure-or-bar ambiguity.
    const airborne = rng() < airborneFraction;

    // x: one uniform draw (preserves the RNG sequence), optionally pulled toward
    // the dense downtown bins by densityBias.
    const ux = rng();
    let nx = ux;
    if (densityBias > 0 && densTotal > 0) {
      nx = ux + (densityInverse(sky.density, densTotal, ux) - ux) * densityBias;
    }
    positions[i * 3 + 0] = (nx * 2 - 1) * opts.fieldWidth;
    positions[i * 3 + 1] = airborne
      ? rangeRNG(rng, 0.6, 3.2)
      : rangeRNG(rng, 0.0, 0.05);
    positions[i * 3 + 2] = rangeRNG(rng, -opts.fieldDepth, zFront);

    velocities[i * 3 + 0] = rangeRNG(rng, -0.04, 0.04);
    velocities[i * 3 + 1] = airborne ? rangeRNG(rng, -0.02, 0.02) : 0;
    velocities[i * 3 + 2] = rangeRNG(rng, -0.05, 0.05);

    // Colour: roll once and take the first place-defined band it falls in. The
    // dominant warm/cool field plus the rounded-out accents are all per-place.
    const r = rng();
    let c: THREE.Color = accentColor.white;
    let aff = 0;
    for (const band of pal.bands) {
      if (r < band.upTo) { c = accentColor[band.key]; aff = band.aff; break; }
    }
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    routeAff[i] = aff * (0.7 + rng() * 0.3);

    // Size — vertical figures are ~1.1..1.8 tall, ~0.18..0.32 wide.
    // Airborne agents are smaller, more horizontal-leaning.
    if (airborne) {
      scales[i * 2 + 0] = rangeRNG(rng, 0.20, 0.32);
      scales[i * 2 + 1] = rangeRNG(rng, 0.55, 1.10);
    } else {
      scales[i * 2 + 0] = rangeRNG(rng, 0.18, 0.32);
      scales[i * 2 + 1] = rangeRNG(rng, 1.10, 1.85);
    }

    brightness[i] = rangeRNG(rng, 0.4, 1.0);
    phases[i] = rng() * Math.PI * 2;
    seeds[i] = rng() * 1000;
    routeIndex[i] = -1; // routes assign these later

    // Dispersed anchor: depth + height the agent holds when scattered.
    scatterZ[i] = positions[i * 3 + 2];
    dispH[i] = scales[i * 2 + 1];

    // Skyline home: where this agent stands once the city is assembled. Floor
    // agents pull back to the silhouette wall and rise to their column's building
    // height; airborne packets keep their own spot (home = self → no assembly).
    if (airborne) {
      skyHomeX[i] = positions[i * 3 + 0];
      skyHomeZ[i] = positions[i * 3 + 2];
      skyHomeH[i] = scales[i * 2 + 1];
    } else {
      const nxPos = (positions[i * 3 + 0] / opts.fieldWidth + 1) * 0.5;
      const sil = sampleProfileArray(sky.profile, nxPos);
      const rh = (scales[i * 2 + 1] - 1.10) / 0.75;     // per-agent variation from base height
      const jitterZ = Math.sin(seeds[i]) * 0.35;        // tight deterministic depth band (no new rng)
      skyHomeX[i] = positions[i * 3 + 0];
      skyHomeZ[i] = -skyDepth + jitterZ;
      skyHomeH[i] = 0.3 + (0.45 + 0.55 * rh) * sil * silUnitsMax * heightScale;
    }
  }

  const attrPos = new THREE.InstancedBufferAttribute(positions, 3);
  attrPos.setUsage(THREE.DynamicDrawUsage);
  const attrCol = new THREE.InstancedBufferAttribute(colors, 3);
  const attrBri = new THREE.InstancedBufferAttribute(brightness, 1);
  attrBri.setUsage(THREE.DynamicDrawUsage);
  const attrScl = new THREE.InstancedBufferAttribute(scales, 2);
  attrScl.setUsage(THREE.DynamicDrawUsage); // heights grow as the skyline assembles
  const attrAff = new THREE.InstancedBufferAttribute(routeAff, 1);
  const attrPhase = new THREE.InstancedBufferAttribute(phases, 1);
  const attrSeed = new THREE.InstancedBufferAttribute(seeds, 1);

  geom.setAttribute('aPos', attrPos);
  geom.setAttribute('aColor', attrCol);
  geom.setAttribute('aBrightness', attrBri);
  geom.setAttribute('aScale', attrScl);
  geom.setAttribute('aRouteAff', attrAff);
  geom.setAttribute('aPhase', attrPhase);
  geom.setAttribute('aSeed', attrSeed);

  const material = new THREE.ShaderMaterial({
    vertexShader: agentVert,
    fragmentShader: agentFrag,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uT: { value: 0 },
      uJitter: { value: 1.0 },
      uDensity: { value: 0.3 },
      uSync: { value: 0.0 },
      uAccent: { value: 0.0 }
    }
  });

  const mesh = new THREE.Mesh(geom, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;

  return {
    mesh,
    material,
    count: N,
    positions,
    velocities,
    colors,
    brightness,
    scales,
    routeAff,
    phases,
    seeds,
    routeIndex,
    skyHomeX,
    skyHomeZ,
    skyHomeH,
    scatterZ,
    dispH,
    attrPos, attrCol, attrBri, attrScl, attrAff,
    setActiveCount(n: number) {
      geom.instanceCount = Math.min(N, Math.max(0, n));
    }
  };
}
