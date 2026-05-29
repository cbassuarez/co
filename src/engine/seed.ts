// Deterministic PRNG. Mulberry32 — small, fast, fine for visual seeding.

export type RNG = () => number;

export function hashStringToSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRNG(seedString: string): RNG {
  return mulberry32(hashStringToSeed(seedString));
}

export function rangeRNG(rng: RNG, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

export function pickRNG<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
