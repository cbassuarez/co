// Agent fragment shader. Draws a luminous vertical trace with:
//   - a vertical core line
//   - a soft body lobe (gives figure-or-bar ambiguity)
//   - subtle head emphasis
//   - reflected copy below baseline (built-in floor reflection)
//   - per-instance color tint

precision highp float;

varying vec2 vUv;
varying vec3 vColor;
varying float vBrightness;
varying float vRouteAff;
varying float vDepth;
varying float vSeed;

uniform float uTime;
uniform float uT;
uniform float uSync;
uniform float uAccent; // 0..1 — pushes accent color over white

void main() {
  // vUv: x in [0,1] horizontal, y in [0,1] vertical (0 = bottom of plane).
  // We split the plane vertically into body (top) and reflection (bottom).
  float yLocal;
  bool isReflection = vUv.y < 0.5;
  if (isReflection) {
    // mirror so that body bottom = reflection bottom
    yLocal = (0.5 - vUv.y) * 2.0;
  } else {
    yLocal = (vUv.y - 0.5) * 2.0;
  }

  float x = vUv.x - 0.5;
  float ax = abs(x);

  // Core vertical line — sharp.
  float core = exp(-ax * 80.0);

  // Body lobe — softer falloff, brightest near hip height (~0.35..0.55)
  float bodyY = smoothstep(0.0, 0.18, yLocal) * smoothstep(1.0, 0.55, yLocal);
  float bodyX = exp(-ax * 18.0);
  float body = bodyX * bodyY * 0.5;

  // Head — soft bright dot near the top.
  float headY = exp(-pow((yLocal - 0.88) * 8.0, 2.0));
  float headX = exp(-ax * 35.0);
  float head = headX * headY * 0.7;

  // Feet — very faint flare at the base.
  float feetY = exp(-pow((yLocal - 0.02) * 10.0, 2.0));
  float feet = headX * feetY * 0.35;

  // Wide soft halation — this fakes bloom in-shader so we can skip the heavy
  // EffectComposer + UnrealBloomPass dance. It gives the luminous-body look.
  float halo = exp(-ax * ax * 4.0) * exp(-pow(yLocal - 0.5, 2.0) * 1.6) * 0.45;

  float fig = core + body + head + feet + halo;

  // Soft vertical streak that extends slightly above and below — this is
  // what makes the field read as "rain of bodies".
  float streak = exp(-ax * 200.0) * (1.0 - smoothstep(0.0, 1.0, yLocal)) * 0.4;
  fig += streak;

  // Reflection attenuation
  if (isReflection) {
    fig *= 0.32 * (1.0 - smoothstep(0.0, 1.0, 1.0 - yLocal));
  }

  // Per-agent vertical scan jitter — a one-pixel-ish shimmer to keep the
  // image "computed", per the spec.
  float scan = 0.92 + 0.08 * sin((vSeed + uTime * 3.0) * 33.0 + yLocal * 30.0);
  fig *= scan;

  // Color: warm-white base, lifted slightly toward accent (R/Y/B) by uAccent
  // and by per-instance routeAff (so accent-routed agents glow accent-tinted).
  vec3 warmWhite = vec3(0.96, 0.965, 0.99);
  float mixAccent = clamp(uAccent * 0.6 + vRouteAff * 0.85, 0.0, 1.0);
  vec3 base = mix(warmWhite, vColor, mixAccent);

  // Sync briefly lifts saturation toward pure color, then back down.
  base = mix(base, vColor, uSync * 0.35 * vRouteAff);

  // Depth-fade: very far agents get crushed so the field has volumetric breath.
  float depthFade = exp(-max(0.0, vDepth - 12.0) * 0.06);

  float a = fig * vBrightness * depthFade;
  if (a < 0.002) discard;

  // Additive: emit RGB scaled by alpha. The framebuffer is additive-blended
  // in the material setup, so we write premultiplied-style.
  vec3 col = base * a;

  gl_FragColor = vec4(col, 1.0);
}
