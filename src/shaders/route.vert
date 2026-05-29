// Route vertex shader. We pass uv.x as position along the curve and uv.y
// across the tube circumference.
varying vec2 vUv;
varying float vDepth;

void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
