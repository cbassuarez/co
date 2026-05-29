// Dramaturgy: the 120-second curves. These produce the "macro arc" the doc
// requires — dispersed → routing → co-presence → rare sync → dénouement.
//
// All curves take normalized cycle time t in [0,1).

import * as THREE from 'three';
import type { AgentPool } from './agents';
import type { Route, AgentRouteBind } from './routes';
import type { WindowField } from './windows';
import { windowAperture } from './windows';
import type { SignalSample } from './signals';

function smoothstep(a: number, b: number, x: number): number {
  if (b === a) return x < a ? 0 : 1;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function bump(t: number, c: number, w: number): number {
  const d = Math.abs(t - c) / w;
  if (d >= 1) return 0;
  const x = 1 - d;
  return x * x * (3 - 2 * x);
}

export interface PhaseCurves {
  density: number;       // 0..1
  routeVis: number;      // 0..1
  syncStrength: number;  // 0..1
  jitter: number;        // 0..1 (multiplier; 1 ≈ baseline)
  bloom: number;         // bloom strength
  grain: number;         // grain amount
  vignette: number;      // vignette strength
  accent: number;        // global accent mix
  haloIntensity: number; // place-field halo
  phaseLabel: string;    // for HUD
}

export function curvesAtT(t: number, sig: SignalSample): PhaseCurves {
  // density: low → strong → peak → dissolve
  const density =
    smoothstep(0.00, 0.35, t) * 0.55 +
    smoothstep(0.35, 0.65, t) * 0.35 +
    bump(t, 0.72, 0.10) * 0.20 -
    smoothstep(0.82, 1.00, t) * 0.65;

  const densityClamped = Math.max(0.04, Math.min(1.0, density));

  // route visibility
  const routeVis =
    smoothstep(0.10, 0.30, t) * 0.45 +
    smoothstep(0.30, 0.55, t) * 0.30 +
    bump(t, 0.68, 0.06) * 0.55 +
    bump(t, 0.78, 0.06) * 0.30 -
    smoothstep(0.86, 1.00, t) * 0.80;
  const routeVisClamped = Math.max(0.0, Math.min(1.0, routeVis));

  // synchronization — rare and earned
  const syncStrength =
    bump(t, 0.68, 0.06) * 1.00 +
    bump(t, 0.78, 0.07) * 0.55;
  const syncClamped = Math.max(0, Math.min(1, syncStrength));

  // jitter — moderate at start, lifts during routing, settles during sync
  const jitter =
    0.55 +
    smoothstep(0.20, 0.45, t) * 0.40 -
    syncClamped * 0.55 +
    smoothstep(0.84, 1.00, t) * 0.20;

  // bloom — restrained early, grows with density, peaks at sync, softens at reset
  const bloom = 0.55 + densityClamped * 0.55 + syncClamped * 0.85 + sig.pulseLevel * 0.6
              - smoothstep(0.88, 1.0, t) * 0.6;

  // grain — slight increase during routing, settle at sync
  const grain = 0.05 + smoothstep(0.20, 0.50, t) * 0.04 - syncClamped * 0.02;

  // vignette — open early, close softly at the end
  const vignette = 0.45 + smoothstep(0.40, 0.80, t) * 0.20 + smoothstep(0.85, 1.0, t) * 0.15;

  // accent — accent routes & agents glow more strongly during routing and sync
  const accent = smoothstep(0.20, 0.50, t) * 0.4 + syncClamped * 0.7
              + sig.clarifyLevel * 0.4;

  // halo — place-field central glow lifts during co-presence band and sync
  const halo = smoothstep(0.42, 0.62, t) * 0.6 + syncClamped * 0.55
             - smoothstep(0.88, 1.0, t) * 0.7;

  const phaseLabel =
    t < 0.17 ? '00 — dispersed attention' :
    t < 0.375 ? '01 — routing appears' :
    t < 0.625 ? '02 — co-presence thickens' :
    t < 0.833 ? '03 — rare synchronization' :
    '04 — dénouement';

  return {
    density: densityClamped,
    routeVis: routeVisClamped,
    syncStrength: syncClamped,
    jitter: Math.max(0.1, Math.min(1.6, jitter)),
    bloom: Math.max(0.2, Math.min(2.4, bloom)),
    grain: Math.max(0.02, Math.min(0.12, grain)),
    vignette: Math.max(0.0, Math.min(0.9, vignette)),
    accent: Math.max(0, Math.min(1, accent)),
    haloIntensity: Math.max(0, Math.min(1, halo)),
    phaseLabel
  };
}

// --- Per-frame update for the agent pool. We advect agents along their
// route bindings, apply jitter, and update brightness uniforms.

const tmpPoint = new THREE.Vector3();
const tmpTangent = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export function updateAgents(
  agents: AgentPool,
  binds: AgentRouteBind[],
  routes: Route[],
  windows: WindowField[],
  curves: PhaseCurves,
  sig: SignalSample,
  t: number,
  dt: number,
  elapsed: number
): void {
  const pos = agents.positions;
  const bri = agents.brightness;
  const seeds = agents.seeds;
  const phases = agents.phases;
  const aff = agents.routeAff;

  // How many agents are "live" this frame (density scales the active count).
  const activeFraction = 0.25 + curves.density * 0.75;
  const activeCount = Math.floor(agents.count * activeFraction);
  agents.setActiveCount(activeCount);

  for (let i = 0; i < activeCount; i++) {
    const b = binds[i];

    if (b.routeIdx >= 0 && routes[b.routeIdx]) {
      const route = routes[b.routeIdx];
      // Advance along curve.
      // Routes traverse faster during routing phase; settle during sync.
      const speedScale = 0.5 + curves.routeVis * 1.4 - curves.syncStrength * 0.45;
      b.s += b.ds * speedScale * dt;
      if (b.s > 1) b.s -= 1;
      if (b.s < 0) b.s += 1;

      route.curve.getPointAt(b.s, tmpPoint);
      route.curve.getTangentAt(b.s, tmpTangent);
      tmpRight.crossVectors(tmpTangent, UP).normalize();

      // Target position = curve point + perpendicular offset (in route frame)
      const tx = tmpPoint.x + tmpRight.x * b.offsetX + b.offsetZ * tmpTangent.x;
      const ty = tmpPoint.y + b.offsetY;
      const tz = tmpPoint.z + tmpRight.z * b.offsetX + b.offsetZ * tmpTangent.z;

      // Drift weight — partial lock to route. Sync reduces drift (alignment).
      const lock = 1 - b.driftWeight * (1 - curves.syncStrength * 0.7);
      const lerpK = Math.min(1, lock * (1.2 + curves.routeVis * 0.8) * dt);

      pos[i * 3 + 0] += (tx - pos[i * 3 + 0]) * lerpK;
      pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * lerpK;
      pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * lerpK;
    } else {
      // Unrouted drift: slow noise wander toward center, with a tendency to
      // disperse during dénouement.
      const seed = seeds[i];
      const vx = Math.sin(elapsed * 0.4 + seed * 0.7) * 0.12;
      const vz = Math.cos(elapsed * 0.3 + seed * 1.3) * 0.12;
      const dispersal = curves.density < 0.3 ? -0.6 : 0; // pushes outward at low density
      pos[i * 3 + 0] += (vx - pos[i * 3 + 0] * 0.02 - pos[i * 3 + 0] * dispersal * 0.01) * dt;
      pos[i * 3 + 2] += (vz - pos[i * 3 + 2] * 0.02 - pos[i * 3 + 2] * dispersal * 0.01) * dt;
    }

    // Brightness: per-agent base * dramaturgy density * signal lift
    // + accent burst on the major sync, biased by aff.
    const baseB = 0.35 + curves.density * 0.65;
    const pulseB = sig.pulseLevel * (0.4 + aff[i] * 0.8);
    const syncB = curves.syncStrength * (0.3 + aff[i] * 0.4);
    let agentB = baseB + pulseB + syncB;

    // Window affinity — agents inside a window's AABB during its open phase
    // get a brightness lift. We approximate with bounding box test.
    for (let wi = 0; wi < windows.length; wi++) {
      const wfield = windows[wi];
      const ap = windowAperture(t, wfield.openAt, wfield.openWidth);
      if (ap < 0.05) continue;
      const wb = wfield.bounds;
      const px = pos[i * 3 + 0], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
      if (px > wb.min.x && px < wb.max.x &&
          py > wb.min.y && py < wb.max.y &&
          pz > wb.min.z && pz < wb.max.z) {
        agentB += ap * 0.4;
      }
    }

    bri[i] = Math.min(1.8, agentB);

    // gentle phase advance
    phases[i] += dt * (0.4 + curves.syncStrength * 1.8);
  }

  agents.attrPos.needsUpdate = true;
  agents.attrBri.needsUpdate = true;
}
