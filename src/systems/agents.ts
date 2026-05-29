import * as THREE from 'three';
import type { RNG } from '../engine/seed';
import { rangeRNG } from '../engine/seed';
import agentVert from '../shaders/agent.vert?raw';
import agentFrag from '../shaders/agent.frag?raw';

// Civic accent palette — primary, restrained.
const ACCENTS = {
  white: new THREE.Color(0xf6f6fa),
  red:   new THREE.Color(0xff2a35),
  yellow:new THREE.Color(0xffc329),
  blue:  new THREE.Color(0x2a78ff)
} as const;

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
}

export function createAgents(opts: AgentSpawnOpts): AgentPool {
  const N = opts.count;
  const rng = opts.rng;

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

  for (let i = 0; i < N; i++) {
    // Most agents are floor-anchored bodies. A small fraction are mid-air
    // packets/air-currents — they keep the figure-or-bar ambiguity.
    const airborne = rng() < 0.18;

    positions[i * 3 + 0] = rangeRNG(rng, -opts.fieldWidth, opts.fieldWidth);
    positions[i * 3 + 1] = airborne
      ? rangeRNG(rng, 0.6, 3.2)
      : rangeRNG(rng, 0.0, 0.05);
    positions[i * 3 + 2] = rangeRNG(rng, -opts.fieldDepth, opts.fieldDepth * 0.6);

    velocities[i * 3 + 0] = rangeRNG(rng, -0.04, 0.04);
    velocities[i * 3 + 1] = airborne ? rangeRNG(rng, -0.02, 0.02) : 0;
    velocities[i * 3 + 2] = rangeRNG(rng, -0.05, 0.05);

    // Color assignment: 78% warm-white, the rest split across red/yellow/blue.
    const r = rng();
    let c: THREE.Color;
    let aff = 0;
    if (r < 0.78) {
      c = ACCENTS.white;
      aff = 0;
    } else if (r < 0.85) {
      c = ACCENTS.red;
      aff = 0.85;
    } else if (r < 0.92) {
      c = ACCENTS.yellow;
      aff = 0.85;
    } else {
      c = ACCENTS.blue;
      aff = 0.85;
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
  }

  const attrPos = new THREE.InstancedBufferAttribute(positions, 3);
  attrPos.setUsage(THREE.DynamicDrawUsage);
  const attrCol = new THREE.InstancedBufferAttribute(colors, 3);
  const attrBri = new THREE.InstancedBufferAttribute(brightness, 1);
  attrBri.setUsage(THREE.DynamicDrawUsage);
  const attrScl = new THREE.InstancedBufferAttribute(scales, 2);
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
    attrPos, attrCol, attrBri, attrScl, attrAff,
    setActiveCount(n: number) {
      geom.instanceCount = Math.min(N, Math.max(0, n));
    }
  };
}
