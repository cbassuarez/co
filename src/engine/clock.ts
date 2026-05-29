// Deterministic 120-second loop clock.
// elapsed is wall time since start (used for jitter / smoothing).
// t is normalized [0,1) over the loop.
// cycle increments each time we wrap.

export interface ClockState {
  elapsed: number;
  delta: number;
  cycleSeconds: number;
  cycleTime: number;   // seconds within current loop, [0, cycleSeconds)
  t: number;           // cycleTime / cycleSeconds
  cycle: number;       // integer loop count since start
  fps: number;
}

export class Clock {
  private start: number = performance.now() / 1000;
  private last: number = this.start;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fpsSmoothed = 60;
  state: ClockState;

  constructor(cycleSeconds: number, startOffsetSeconds = 0) {
    this.start -= startOffsetSeconds;
    this.last = performance.now() / 1000;
    this.state = {
      elapsed: startOffsetSeconds,
      delta: 0,
      cycleSeconds,
      cycleTime: startOffsetSeconds % cycleSeconds,
      t: (startOffsetSeconds % cycleSeconds) / cycleSeconds,
      cycle: Math.floor(startOffsetSeconds / cycleSeconds),
      fps: 60
    };
  }

  tick(): ClockState {
    const now = performance.now() / 1000;
    let dt = now - this.last;
    if (dt > 0.1) dt = 0.1; // clamp pathological gaps
    this.last = now;

    const s = this.state;
    s.elapsed += dt;
    s.delta = dt;

    const c = s.cycleSeconds;
    const newCycleTime = s.cycleTime + dt;
    if (newCycleTime >= c) {
      s.cycleTime = newCycleTime - c;
      s.cycle += 1;
    } else {
      s.cycleTime = newCycleTime;
    }
    s.t = s.cycleTime / c;

    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fpsSmoothed = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    s.fps = this.fpsSmoothed;
    return s;
  }
}
