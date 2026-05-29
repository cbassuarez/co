// URL parameter parsing for runtime modes.

export type Mode = 'exhibition' | 'debug' | 'capture';

export interface Params {
  mode: Mode;
  seed: string;
  durationSeconds: number;
  showHud: boolean;
  showCursor: boolean;
  quality: 'high' | 'med' | 'low';
  startAt: number;     // seconds offset into the loop (debug/capture only)
  paused: boolean;
}

const DEFAULTS: Params = {
  mode: 'exhibition',
  seed: 'co-v1.0.0',
  durationSeconds: 120,
  showHud: false,
  showCursor: false,
  quality: 'high',
  startAt: 0,
  paused: false
};

function parseFloatOr(v: string | null, fallback: number): number {
  if (v == null) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseBoolOr(v: string | null, fallback: boolean): boolean {
  if (v == null) return fallback;
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return fallback;
}

export function readParams(): Params {
  const u = new URL(window.location.href);
  const q = u.searchParams;

  const modeRaw = (q.get('mode') ?? '').toLowerCase();
  const mode: Mode =
    modeRaw === 'debug' ? 'debug' :
    modeRaw === 'capture' ? 'capture' :
    'exhibition';

  const showHud = parseBoolOr(q.get('hud'), mode === 'debug');
  const showCursor = parseBoolOr(q.get('cursor'), mode === 'debug');

  const qualityRaw = (q.get('quality') ?? '').toLowerCase();
  const quality: Params['quality'] =
    qualityRaw === 'low' ? 'low' :
    qualityRaw === 'med' || qualityRaw === 'medium' ? 'med' :
    'high';

  return {
    ...DEFAULTS,
    mode,
    seed: q.get('seed') ?? DEFAULTS.seed,
    durationSeconds: parseFloatOr(q.get('duration'), DEFAULTS.durationSeconds),
    showHud,
    showCursor,
    quality,
    startAt: parseFloatOr(q.get('t'), 0),
    paused: parseBoolOr(q.get('paused'), false)
  };
}
