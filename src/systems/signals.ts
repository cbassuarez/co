import type { RNG } from '../engine/seed';
import { rangeRNG } from '../engine/seed';
import type { PlaceConfig } from '../place/place';

// Signals are discrete events that propagate through the system.
// They don't have their own geometry — they modulate agents, routes, windows.
// Each signal is parameterized by:
//   - tFire: cycle time when it fires
//   - kind: pulse | clarify | dim
//   - magnitude: 0..1
//
// Within a signal's active half-life, it injects into global uniforms:
//   uSignalLevel = sum of active signal envelopes
//   uSignalKind  = dominant kind code
//
// We keep it pure-functional: scheduleSignals returns the schedule; the
// dramaturgy code samples it per frame.

export type SignalKind = 'pulse' | 'clarify' | 'dim';

export interface SignalEvent {
  tFire: number;       // cycle-normalized firing time
  halfLife: number;    // exponential decay rate, in cycle-normalized units
  kind: SignalKind;
  magnitude: number;   // 0..1
}

export function scheduleSignals(rng: RNG, place: PlaceConfig): SignalEvent[] {
  // Anchor signals to the dramaturgy:
  //   ~0.10  faint open pulse
  //   ~0.32  routing clarifying pulse
  //   ~0.55  pre-sync dim/anticipation
  //   ~0.68  major sync pulse (the big one)
  //   ~0.78  secondary softer pulse
  //   ~0.92  dimming wave toward dénouement
  const evs: SignalEvent[] = [
    { tFire: 0.06, halfLife: 0.05, kind: 'pulse',   magnitude: 0.25 },
    { tFire: 0.22, halfLife: 0.06, kind: 'clarify', magnitude: 0.40 },
    { tFire: 0.36, halfLife: 0.05, kind: 'pulse',   magnitude: 0.45 },
    { tFire: 0.50, halfLife: 0.08, kind: 'clarify', magnitude: 0.55 },
    { tFire: 0.58, halfLife: 0.05, kind: 'dim',     magnitude: 0.30 },
    { tFire: 0.68, halfLife: 0.10, kind: 'pulse',   magnitude: 1.00 }, // major sync
    { tFire: 0.78, halfLife: 0.07, kind: 'pulse',   magnitude: 0.55 }, // secondary
    { tFire: 0.88, halfLife: 0.08, kind: 'dim',     magnitude: 0.55 },
    { tFire: 0.96, halfLife: 0.06, kind: 'dim',     magnitude: 0.35 }
  ];
  // Shift the whole schedule so the major sync lands at the place's syncTime, and
  // scale every half-life by its tightness (deterministic — no rng consumed here).
  const shift = place.tempo.syncTime - 0.68;
  const tight = place.tempo.syncTightness;
  // small per-seed jitter so it isn't identical across seeds
  for (const e of evs) {
    e.tFire = (((e.tFire + shift) % 1) + 1) % 1;
    e.halfLife *= tight;
    e.tFire += rangeRNG(rng, -0.012, 0.012);
    e.magnitude *= 0.85 + rng() * 0.3;
  }
  return evs;
}

export interface SignalSample {
  level: number;
  pulseLevel: number;    // sum of pulse envelopes
  clarifyLevel: number;  // sum of clarify envelopes
  dimLevel: number;      // sum of dim envelopes
}

// Sample all signals at normalized cycle time t. Each event contributes
// an envelope:
//   env = magnitude * exp(-(|dt|/halfLife)^2)
export function sampleSignals(events: SignalEvent[], t: number): SignalSample {
  let p = 0, c = 0, d = 0;
  for (const e of events) {
    let dt = t - e.tFire;
    if (dt > 0.5) dt -= 1;
    if (dt < -0.5) dt += 1;
    const n = dt / e.halfLife;
    const env = e.magnitude * Math.exp(-n * n);
    if (env < 0.003) continue;
    if (e.kind === 'pulse') p += env;
    else if (e.kind === 'clarify') c += env;
    else d += env;
  }
  return { level: p + c + d, pulseLevel: p, clarifyLevel: c, dimLevel: d };
}
