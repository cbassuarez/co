// Post processing — done as in-scene full-screen quads rather than through
// EffectComposer. We had bloom-tile artifacts and a linear/sRGB mismatch with
// the composer pipeline; bakey halation in the agent shader plus a vignette/
// grain overlay quad gives us a cleaner, faster pipeline.

import * as THREE from 'three';

export interface PostStack {
  overlay: THREE.Mesh;
  material: THREE.ShaderMaterial;
  setSize(w: number, h: number): void;
  setBloomStrength(s: number): void; // kept for API compatibility, no-op
  setGrainAmount(a: number): void;
  setVignette(v: number): void;
  setTime(t: number): void;
}

const OverlayFrag = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform vec2 uResolution;

float hash(vec2 p, float t) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33 + t);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 1.4;

  // Vignette: an additive *darkening* via low alpha at the edges of a black
  // overlay. We want the field to subtly close at the edges without crushing.
  float vig = smoothstep(0.55, 1.05, r) * uVignette;

  // Grain: subtle, frame-quantized.
  float tq = floor(uTime * 24.0);
  float n = hash(gl_FragCoord.xy, tq);
  float g = (n - 0.5) * uGrain;

  vec3 col = vec3(g);          // grain only — both + and -, summed onto scene
  float a = vig + abs(g) * 0.6; // alpha controls how much we contribute
  // Because we're additive-blended onto the scene, positive g brightens,
  // negative g darkens. Vignette is purely darkening so we encode it as
  // negative R/G/B contribution via blending mode.

  // We use a custom blend mode in the material setup: SubtractEquation for
  // vignette, regular Additive for grain. Since WebGL can't mix per-pixel,
  // we approximate by outputting vec4 where rgb is grain only, and a separate
  // vignette mesh handles darkening.
  gl_FragColor = vec4(col, 1.0);
}
`;

const VignetteFrag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uStrength;
void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 1.4;
  float v = smoothstep(0.55, 1.15, r);
  float a = v * uStrength;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}
`;

const FullScreenVert = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  // position is a [-1,1] quad; we skip the matrix transform and write
  // directly to clip space so the quad always covers the viewport.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export function createPost(scene: THREE.Scene): PostStack {
  // Full-screen quad — rendered last, in front of everything, with depthTest off.
  const geom = new THREE.PlaneGeometry(2, 2, 1, 1);

  // Grain pass — additive on top of the scene
  const grainMat = new THREE.ShaderMaterial({
    vertexShader: FullScreenVert,
    fragmentShader: OverlayFrag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uGrain: { value: 0.025 },
      uVignette: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(1, 1) }
    }
  });
  const grainQuad = new THREE.Mesh(geom, grainMat);
  grainQuad.frustumCulled = false;
  grainQuad.renderOrder = 990;
  scene.add(grainQuad);

  // Vignette pass — subtractive (regular alpha blend over scene)
  const vignetteMat = new THREE.ShaderMaterial({
    vertexShader: FullScreenVert,
    fragmentShader: VignetteFrag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uStrength: { value: 0.55 }
    }
  });
  const vignetteQuad = new THREE.Mesh(geom, vignetteMat);
  vignetteQuad.frustumCulled = false;
  vignetteQuad.renderOrder = 991;
  scene.add(vignetteQuad);

  return {
    overlay: grainQuad,
    material: grainMat,
    setSize(w, h) {
      grainMat.uniforms.uResolution.value.set(w, h);
    },
    setBloomStrength(_s: number) { /* baked into agent shader */ },
    setGrainAmount(a: number) {
      grainMat.uniforms.uGrain.value = a;
    },
    setVignette(v: number) {
      vignetteMat.uniforms.uStrength.value = v;
    },
    setTime(t: number) {
      grainMat.uniforms.uTime.value = t;
    }
  };
}
