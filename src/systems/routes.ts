import * as THREE from 'three';
import type { RNG } from '../engine/seed';
import { rangeRNG } from '../engine/seed';
import routeVert from '../shaders/route.vert?raw';
import routeFrag from '../shaders/route.frag?raw';

const ACCENTS = {
  white: new THREE.Color(0xeef2ff),
  red:   new THREE.Color(0xff2630),
  yellow:new THREE.Color(0xffc329),
  blue:  new THREE.Color(0x2a78ff)
} as const;

export interface Route {
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  color: THREE.Color;
  accentTier: 0 | 1; // 0 = white (most common), 1 = accent
  speed: number;     // signed traversal speed for the visual pulse
  segments: number;  // luminous pulses count
  baseVis: number;   // baseline visibility 0..1
}

export interface RouteSystem {
  routes: Route[];
  group: THREE.Group;
}

function makeCurve(rng: RNG, fieldW: number, fieldD: number): THREE.CatmullRomCurve3 {
  // Each route begins off-edge, sweeps an arc near or through the center, and
  // exits another edge. Control points are 4..6 per route.
  const nPts = 4 + Math.floor(rng() * 3);
  const pts: THREE.Vector3[] = [];

  // entry and exit on opposing-ish edges so routes traverse the field
  const entryAngle = rng() * Math.PI * 2;
  const exitAngle = entryAngle + Math.PI * (0.55 + rng() * 0.9);

  const entry = new THREE.Vector3(
    Math.cos(entryAngle) * fieldW * (1.0 + rng() * 0.3),
    rangeRNG(rng, 0.1, 2.8),
    Math.sin(entryAngle) * fieldD * (1.0 + rng() * 0.3) * 0.7
  );
  const exit = new THREE.Vector3(
    Math.cos(exitAngle) * fieldW * (1.0 + rng() * 0.3),
    rangeRNG(rng, 0.1, 2.8),
    Math.sin(exitAngle) * fieldD * (1.0 + rng() * 0.3) * 0.7
  );

  pts.push(entry);
  for (let i = 1; i < nPts - 1; i++) {
    const f = i / (nPts - 1);
    const base = entry.clone().lerp(exit, f);
    // pull the midsection toward the world's central interest band
    base.lerp(new THREE.Vector3(rangeRNG(rng, -1.2, 1.2), rangeRNG(rng, 0.4, 2.6), rangeRNG(rng, -1.5, 0.8)), 0.45 + rng() * 0.3);
    // sideways jitter so the curve isn't a flat sag
    base.x += rangeRNG(rng, -1.6, 1.6);
    base.z += rangeRNG(rng, -1.6, 1.6);
    base.y = Math.max(0.05, base.y);
    pts.push(base);
  }
  pts.push(exit);

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.45);
  return curve;
}

export function createRoutes(opts: {
  rng: RNG;
  count: number;
  fieldWidth: number;
  fieldDepth: number;
}): RouteSystem {
  const group = new THREE.Group();
  group.renderOrder = 5;
  const routes: Route[] = [];

  for (let i = 0; i < opts.count; i++) {
    const curve = makeCurve(opts.rng, opts.fieldWidth, opts.fieldDepth);

    // 70% of routes are warm-white. 30% pick from R/Y/B accent.
    const accentRoll = opts.rng();
    let color: THREE.Color;
    let accentTier: 0 | 1;
    if (accentRoll < 0.70) { color = ACCENTS.white; accentTier = 0; }
    else if (accentRoll < 0.80) { color = ACCENTS.red; accentTier = 1; }
    else if (accentRoll < 0.90) { color = ACCENTS.yellow; accentTier = 1; }
    else { color = ACCENTS.blue; accentTier = 1; }

    const tubeRadius = accentTier === 1 ? 0.022 : 0.015;
    const tubular = 240;
    const radial = 6;
    const geom = new THREE.TubeGeometry(curve, tubular, tubeRadius, radial, false);

    const material = new THREE.ShaderMaterial({
      vertexShader: routeVert,
      fragmentShader: routeFrag,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color.clone() },
        uVisibility: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uSpeed: { value: (opts.rng() < 0.5 ? -1 : 1) * (0.04 + opts.rng() * 0.10) },
        uSegments: { value: 2 + Math.floor(opts.rng() * 3) }
      }
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.frustumCulled = false;
    group.add(mesh);

    routes.push({
      curve,
      mesh,
      material,
      color,
      accentTier,
      speed: (material.uniforms.uSpeed.value as number),
      segments: (material.uniforms.uSegments.value as number),
      baseVis: accentTier === 1 ? 0.95 : 0.55
    });
  }

  return { routes, group };
}

// Assign agents to routes. Returns per-agent assignment data so the agents
// can be advected along routes by the dramaturgy update each frame.
export interface AgentRouteBind {
  routeIdx: number;     // index into routes, or -1
  s: number;            // [0,1] along curve
  ds: number;           // per-second progress
  offsetX: number;      // perpendicular offset
  offsetY: number;
  offsetZ: number;
  driftWeight: number;  // 0 = locked to route, 1 = free drift
}

export function bindAgentsToRoutes(
  rng: RNG,
  routes: Route[],
  agentCount: number,
  routedFraction = 0.62
): AgentRouteBind[] {
  const out: AgentRouteBind[] = [];
  for (let i = 0; i < agentCount; i++) {
    const routed = rng() < routedFraction;
    if (!routed || routes.length === 0) {
      out.push({
        routeIdx: -1, s: 0, ds: 0,
        offsetX: 0, offsetY: 0, offsetZ: 0,
        driftWeight: 1
      });
      continue;
    }
    const ridx = Math.floor(rng() * routes.length);
    out.push({
      routeIdx: ridx,
      s: rng(),
      ds: (0.012 + rng() * 0.04) * (rng() < 0.5 ? 1 : -1),
      offsetX: rangeRNG(rng, -0.25, 0.25),
      offsetY: rangeRNG(rng, -0.05, 0.10),
      offsetZ: rangeRNG(rng, -0.25, 0.25),
      driftWeight: rangeRNG(rng, 0.05, 0.55)
    });
  }
  return out;
}
