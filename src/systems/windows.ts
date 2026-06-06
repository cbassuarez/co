import * as THREE from 'three';
import type { RNG } from '../engine/seed';
import { rangeRNG } from '../engine/seed';
import type { PlaceConfig } from '../place/place';
import winVert from '../shaders/window.vert?raw';
import winFrag from '../shaders/window.frag?raw';

export interface WindowField {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  openAt: number;      // normalized t [0,1] when this window peaks
  openWidth: number;   // how wide its open arc is
  seed: number;
  bounds: THREE.Box3;  // world-space AABB for agent affinity testing
}

export interface WindowSystem {
  windows: WindowField[];
  group: THREE.Group;
}

export function createWindows(opts: {
  rng: RNG;
  count: number;
  fieldWidth: number;
  fieldDepth: number;
  place: PlaceConfig;
}): WindowSystem {
  const group = new THREE.Group();
  group.renderOrder = 6;
  const windows: WindowField[] = [];

  const winCfg = opts.place.windows;
  const color = new THREE.Color(winCfg.color);
  // aspect < 1 = tall/narrow facade; > 1 = wide/shallow billboard. 1 = baseline.
  const asp = Math.sqrt(winCfg.aspect);
  const commonOpen = opts.place.tempo.syncTime; // where synchronised windows converge

  // Distribute window peak times across the cycle so different windows are
  // open at different phases (unless `sync` pulls them together).
  for (let i = 0; i < opts.count; i++) {
    const w = rangeRNG(opts.rng, 1.4, 2.6) * asp;
    const h = rangeRNG(opts.rng, 1.8, 3.4) / asp;
    const geom = new THREE.PlaneGeometry(w, h, 1, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader: winVert,
      fragmentShader: winFrag,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: color.clone() },
        uAperture: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uTime: { value: 0.0 },
        uSeed: { value: opts.rng() * 100.0 }
      }
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.frustumCulled = false;

    // Distribute windows in a soft arc behind the main agent zone. Narrow arc =
    // a building facade facing the camera; wide arc = signs along a boulevard.
    const angle = rangeRNG(opts.rng, -winCfg.arcWidth, winCfg.arcWidth);
    const radius = rangeRNG(opts.rng, opts.fieldWidth * winCfg.arcRadiusScale * 0.6, opts.fieldWidth * winCfg.arcRadiusScale * 1.4);
    mesh.position.set(
      Math.sin(angle) * radius,
      h * 0.5 + rangeRNG(opts.rng, -0.05, 0.4),
      -Math.cos(angle) * radius * 0.7 + rangeRNG(opts.rng, -1.5, 0.8)
    );
    mesh.rotation.y = -angle * 0.7 + rangeRNG(opts.rng, -0.25, 0.25);

    const bounds = new THREE.Box3().setFromObject(mesh);
    bounds.expandByScalar(0.8);

    group.add(mesh);

    // Staggered opening, pulled toward a common moment by `sync`.
    const stagger = 0.18 + (i / opts.count) * 0.8;
    const openAt = stagger + (commonOpen - stagger) * winCfg.sync + rangeRNG(opts.rng, -0.04, 0.04);

    windows.push({
      mesh,
      material,
      openAt,
      openWidth: rangeRNG(opts.rng, 0.10, 0.22),
      seed: material.uniforms.uSeed.value as number,
      bounds
    });
  }

  return { windows, group };
}

// Per-window aperture: a smooth bump centered at openAt that returns to zero
// outside ±openWidth.
export function windowAperture(t: number, openAt: number, openWidth: number): number {
  // wrap t around so windows near 0/1 still open cleanly
  let d = t - openAt;
  if (d > 0.5) d -= 1.0;
  if (d < -0.5) d += 1.0;
  const nd = Math.abs(d) / openWidth;
  if (nd >= 1) return 0;
  // smoothstep bump: 1 at center, 0 at the edges
  const x = 1 - nd;
  return x * x * (3 - 2 * x);
}
