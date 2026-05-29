// Route fragment shader. Renders a route tube as a luminous accumulated trail
// with a head-bright / tail-fade modulation that moves slowly along the curve.
precision highp float;

varying vec2 vUv;
varying float vDepth;

uniform vec3 uColor;
uniform float uTime;
uniform float uVisibility;   // 0..1 — route's overall presence
uniform float uIntensity;    // 0..1 — global multiplier (dramaturgy)
uniform float uSpeed;        // along-curve scroll speed (signed)
uniform float uSegments;     // how many bright pulses ride the curve

void main() {
  // distance from tube center (uv.y goes around circumference)
  float ring = abs(vUv.y - 0.5) * 2.0;
  float core = exp(-ring * ring * 6.0); // soft tube cross-section

  // along-curve modulation: a slow-moving luminance wave so the route looks
  // like accumulated light traversing the space.
  float s = vUv.x;
  float pulse = 0.45 + 0.55 * sin((s * uSegments - uTime * uSpeed) * 6.28318);
  pulse = pow(pulse, 1.8);

  // Endpoints fade so the routes feel "drawn in" rather than cut.
  float endFade = smoothstep(0.0, 0.05, s) * smoothstep(1.0, 0.92, s);

  // Depth fade
  float depthFade = exp(-max(0.0, vDepth - 16.0) * 0.05);

  float a = core * pulse * endFade * uVisibility * uIntensity * depthFade;
  if (a < 0.001) discard;

  vec3 col = uColor * a * 1.4;
  gl_FragColor = vec4(col, 1.0);
}
