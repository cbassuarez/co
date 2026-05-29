// co — entrypoint.
// Boot the engine, build the scene, install the systems, run the loop.

import * as THREE from 'three';
import { readParams } from './engine/params';
import { makeRNG } from './engine/seed';
import { Clock } from './engine/clock';
import { createRenderer, bindResize } from './engine/renderer';
import { createCamera, driftCamera } from './scene/camera';
import { createWorld } from './scene/scene';
import { createPost } from './scene/post';
import { createAgents } from './systems/agents';
import { createRoutes, bindAgentsToRoutes } from './systems/routes';
import { createWindows } from './systems/windows';
import { scheduleSignals, sampleSignals } from './systems/signals';
import { createGroundHalo } from './systems/placeFields';
import { curvesAtT, updateAgents } from './systems/dramaturgy';

function bootHud(showHud: boolean): { el: HTMLElement | null, set: (s: string) => void } {
  const el = document.getElementById('hud');
  if (!el) return { el: null, set: () => {} };
  if (showHud) el.classList.remove('hud--hidden');
  return {
    el,
    set: (s: string) => { if (showHud && el) el.textContent = s; }
  };
}

function applyCursor(showCursor: boolean) {
  if (showCursor) {
    document.body.style.cursor = 'auto';
    document.documentElement.style.cursor = 'auto';
  }
}

async function main() {
  const params = readParams();
  applyCursor(params.showCursor);
  const hud = bootHud(params.showHud);

  const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('co: #stage canvas not found');

  const renderer = createRenderer(canvas, params);
  const camera = createCamera();
  const world = createWorld();

  const post = createPost(world.scene);

  const rng = makeRNG(params.seed);

  // ----- Build the systems -----
  // Agent count scales with quality.
  const agentCount =
    params.quality === 'high' ? 1100 :
    params.quality === 'med'  ? 700  :
    420;

  const fieldWidth = 10.0;
  const fieldDepth = 9.0;
  const fieldHeight = 4.0;

  const agents = createAgents({
    count: agentCount,
    rng,
    fieldWidth, fieldDepth, fieldHeight
  });
  world.scene.add(agents.mesh);

  const routes = createRoutes({
    rng,
    count: 14,
    fieldWidth, fieldDepth
  });
  world.scene.add(routes.group);

  const windows = createWindows({
    rng,
    count: 6,
    fieldWidth, fieldDepth
  });
  world.scene.add(windows.group);

  const halo = createGroundHalo();
  world.scene.add(halo.mesh);

  const binds = bindAgentsToRoutes(rng, routes.routes, agents.count, 0.66);
  // sync the bind data back into agents.routeIndex / agents.routeAff
  for (let i = 0; i < agents.count; i++) {
    agents.routeIndex[i] = binds[i].routeIdx;
    if (binds[i].routeIdx >= 0) {
      const r = routes.routes[binds[i].routeIdx];
      // Take the agent's accent affinity from its route if the route is accent.
      if (r.accentTier === 1) {
        agents.colors[i * 3 + 0] = r.color.r;
        agents.colors[i * 3 + 1] = r.color.g;
        agents.colors[i * 3 + 2] = r.color.b;
        agents.routeAff[i] = Math.max(agents.routeAff[i], 0.85);
      } else {
        agents.routeAff[i] = Math.min(agents.routeAff[i], 0.18);
      }
    }
  }
  agents.attrCol.needsUpdate = true;
  agents.attrAff.needsUpdate = true;

  const signals = scheduleSignals(rng);

  bindResize(renderer, camera, (w, h) => post.setSize(w, h));

  const clock = new Clock(params.durationSeconds, params.startAt);

  // Capture-mode hook: when ?mode=capture, expose a deterministic time setter
  // so a Puppeteer harness can step through the cycle frame-by-frame.
  let forcedT: number | null = null;
  if (params.mode === 'capture' || params.mode === 'debug') {
    (window as any).__coSetT = (tSeconds: number) => {
      forcedT = tSeconds;
    };
    (window as any).__coReady = true;
  }

  let last = performance.now();
  function frame(now: number) {
    last = now;

    const state = clock.tick();
    if (forcedT !== null) {
      state.cycleTime = forcedT % params.durationSeconds;
      state.t = state.cycleTime / params.durationSeconds;
      state.elapsed = forcedT;
    }

    // Sample signals & curves
    const sig = sampleSignals(signals, state.t);
    const curves = curvesAtT(state.t, sig);

    // Camera drift
    driftCamera(camera, state.t, state.elapsed);

    // Update agent advection + brightness
    updateAgents(
      agents,
      binds,
      routes.routes,
      windows.windows,
      curves,
      sig,
      state.t,
      Math.min(0.05, state.delta),
      state.elapsed
    );

    // Push uniforms — agents
    const am = agents.material.uniforms;
    am.uTime.value = state.elapsed;
    am.uT.value = state.t;
    am.uJitter.value = curves.jitter;
    am.uDensity.value = curves.density;
    am.uSync.value = curves.syncStrength;
    am.uAccent.value = curves.accent;

    // Push uniforms — routes
    for (let i = 0; i < routes.routes.length; i++) {
      const r = routes.routes[i];
      const u = r.material.uniforms;
      u.uTime.value = state.elapsed;
      u.uVisibility.value = r.baseVis * (0.35 + curves.routeVis * 0.85);
      // accent routes flare more strongly at sync
      const accentBoost = r.accentTier === 1 ? (1.0 + curves.syncStrength * 0.7 + sig.pulseLevel * 0.6) : 1.0;
      u.uIntensity.value = (0.3 + curves.routeVis * 0.9) * accentBoost;
    }

    // Push uniforms — windows
    for (let i = 0; i < windows.windows.length; i++) {
      const w = windows.windows[i];
      const ap = (() => {
        // local aperture sampling
        let d = state.t - w.openAt;
        if (d > 0.5) d -= 1.0;
        if (d < -0.5) d += 1.0;
        const nd = Math.abs(d) / w.openWidth;
        if (nd >= 1) return 0;
        const x = 1 - nd;
        return x * x * (3 - 2 * x);
      })();
      const u = w.material.uniforms;
      u.uTime.value = state.elapsed;
      u.uAperture.value = ap;
      // base presence + signal lift
      u.uIntensity.value = 0.25 + ap * 0.85 + sig.clarifyLevel * 0.4 + curves.syncStrength * 0.3;
    }

    // halo
    halo.material.uniforms.uTime.value = state.elapsed;
    halo.material.uniforms.uIntensity.value = curves.haloIntensity;

    // post overlays (grain + vignette as in-scene quads)
    post.setGrainAmount(curves.grain);
    post.setVignette(curves.vignette);
    post.setTime(state.elapsed);

    renderer.render(world.scene, camera);

    if (hud.el) {
      const t = state.t.toFixed(3);
      const sec = state.cycleTime.toFixed(2);
      const fps = state.fps.toFixed(1);
      hud.set(
`co · seed=${params.seed} · cycle ${state.cycle}
phase: ${curves.phaseLabel}
t=${t}  s=${sec}/${params.durationSeconds.toFixed(0)}  ${fps} fps
density=${curves.density.toFixed(2)} routeVis=${curves.routeVis.toFixed(2)} sync=${curves.syncStrength.toFixed(2)}
signals: pulse=${sig.pulseLevel.toFixed(2)} clarify=${sig.clarifyLevel.toFixed(2)} dim=${sig.dimLevel.toFixed(2)}`
      );
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Allow keyboard r to reload (debug only — exhibition runtime should not
  // expose this). We only enable when ?mode=debug.
  if (params.mode === 'debug') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r') window.location.reload();
    });
  }
}

main().catch((err) => {
  console.error('co: boot failed', err);
});
