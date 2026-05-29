// Agent vertex shader. Billboard a vertical quad around aPos toward the camera.
// We keep up = world-Y so that the figure-bar ambiguity is preserved — they
// stand. The quad is wider than a strict billboard so the floor reflection
// included in the fragment shader has space to live.

attribute vec3 aPos;
attribute vec3 aColor;
attribute float aBrightness;
attribute float aPhase;
attribute vec2 aScale;       // width, height
attribute float aRouteAff;   // 0..1
attribute float aSeed;

uniform float uTime;
uniform float uT;            // normalized cycle time
uniform float uJitter;       // global jitter amount
uniform float uDensity;      // global density (affects scale subtly)
uniform float uSync;         // global sync strength 0..1

varying vec2 vUv;
varying vec3 vColor;
varying float vBrightness;
varying float vRouteAff;
varying float vDepth;
varying float vSeed;

void main() {
  vUv = uv;
  vColor = aColor;
  vRouteAff = aRouteAff;
  vSeed = aSeed;

  // Frame-quantized local jitter — agent "corrects" itself a few times per second.
  float jq = floor(uTime * 12.0) * 0.0833;
  float jx = sin((aSeed + jq) * 91.7) * uJitter * 0.06;
  float jy = sin((aSeed * 2.3 + jq) * 47.1) * uJitter * 0.04;
  float jz = sin((aSeed * 3.1 + jq) * 33.7) * uJitter * 0.06;

  // Phase-based brightness pulse — when sync rises, all agents inhale together.
  float syncPulse = mix(
    0.7 + 0.3 * sin(uTime * 0.9 + aPhase),
    0.85 + 0.15 * sin(uTime * 1.6 + aSeed * 0.5),
    1.0 - uSync
  );
  vBrightness = aBrightness * syncPulse;

  // Camera-space billboard. We keep world up aligned (vertical figures).
  vec3 worldPos = aPos + vec3(jx, jy, jz);
  vec4 mv = viewMatrix * vec4(worldPos, 1.0);

  // Density very subtly enlarges agents during co-presence so the field thickens.
  vec2 s = aScale * (0.92 + uDensity * 0.18);

  vec2 corner = position.xy * s;
  mv.xy += corner;

  vDepth = -mv.z;

  gl_Position = projectionMatrix * mv;
}
