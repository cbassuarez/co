import * as THREE from 'three';
import type { PlaceConfig } from '../place/place';

// Place-fields are the temporary collective formations of the system. They
// are not "objects" the viewer reads — they are the emergent thickening of
// agents + routes + windows + signals in a region of space at a moment in
// time. The dramaturgy layer produces them by adjusting agent brightness,
// route visibility, and signal contributions.
//
// We add one explicit ground halo here: a low, breathing luminous region
// near the floor that lifts during the major co-presence band, then
// dissolves. It seats the central image and reinforces the "place" reading
// without depicting a place.

export interface PlaceField {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
}

export function createGroundHalo(place: PlaceConfig): PlaceField {
  const geom = new THREE.PlaneGeometry(28, 28, 1, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uIntensity: { value: 0.0 },
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Color(place.halo.color) },
      uBreathHz: { value: place.halo.breathHz },
      uRadius: { value: place.halo.radius }
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      varying vec3 vW;
      uniform float uIntensity;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uBreathHz;
      uniform float uRadius;
      void main() {
        float d = length(vW.xz);
        float halo = smoothstep(uRadius, 0.0, d) * 0.5;
        // Subtle breathing, at the place's own rate
        float breathe = 0.85 + 0.15 * sin(uTime * uBreathHz);
        float a = halo * uIntensity * breathe;
        if (a < 0.001) discard;
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geom, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.001;
  mesh.renderOrder = 4;
  return { mesh, material };
}
