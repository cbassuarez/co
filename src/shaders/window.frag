// Window fragment shader. Renders a translucent rectangular aperture with
// a soft luminous frame. The aperture parameter controls vertical opening
// (the "shutter") — when 0, the window is closed (frame only); when 1, fully
// open.
precision highp float;

varying vec2 vUv;

uniform vec3 uColor;
uniform float uAperture;    // 0..1
uniform float uIntensity;   // 0..1 global
uniform float uTime;
uniform float uSeed;

void main() {
  // Distance from center, in unit square
  vec2 c = vUv - 0.5;
  float ax = abs(c.x);
  float ay = abs(c.y);

  // Aperture: vertical shutter — open zone is around y=0, width = uAperture
  float shutterHalf = 0.46 * uAperture;
  float openY = step(ay, shutterHalf);

  // Soft falloff at the inner edge of the open zone
  float openFade = smoothstep(shutterHalf + 0.03, shutterHalf - 0.02, ay);

  // Frame: thin lines near outer rectangle edge
  float frameThickness = 0.012;
  float frameX = smoothstep(0.5, 0.5 - frameThickness, ax) - smoothstep(0.5 - frameThickness, 0.5 - frameThickness * 2.0, ax);
  float frameY = smoothstep(0.5, 0.5 - frameThickness, ay) - smoothstep(0.5 - frameThickness, 0.5 - frameThickness * 2.0, ay);
  float frame = max(frameX, frameY);
  frame *= step(ax, 0.5) * step(ay, 0.5);
  // Also a soft inner contour, just inside the rectangle, very faint
  float innerLine = (smoothstep(0.47, 0.475, ax) - smoothstep(0.475, 0.48, ax)) +
                    (smoothstep(0.47, 0.475, ay) - smoothstep(0.475, 0.48, ay));

  // Aperture fill — very soft glow inside the open band
  float fill = openFade * (0.18 + 0.12 * sin(uTime * 0.6 + uSeed * 6.0));

  // Vertical scan lines inside the window — a near-signage rhythm, but unreadable
  float vbars = 0.5 + 0.5 * sin(vUv.x * 60.0 + uSeed);
  vbars = pow(vbars, 24.0) * 0.12 * openFade;

  // Mild horizontal flicker indicating "open" state
  float flicker = 0.9 + 0.1 * sin(uTime * 8.0 + uSeed * 11.0);

  float a = (frame * 0.85 + innerLine * 0.25 + fill + vbars) * flicker;
  a *= uIntensity;
  if (a < 0.002) discard;

  vec3 col = uColor * a;
  gl_FragColor = vec4(col, 1.0);
}
