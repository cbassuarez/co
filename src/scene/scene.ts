import * as THREE from 'three';

export interface World {
  scene: THREE.Scene;
  fogColor: THREE.Color;
  floor: THREE.Mesh;
}

export function createWorld(): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const fogColor = new THREE.Color(0x05070a);
  scene.fog = new THREE.FogExp2(fogColor, 0.04);

  // Floor reflection plane. We don't run a true mirror — that's heavy and the
  // references read more like wet asphalt than a mirror. Instead we render
  // soft vertical streaks that fall below each agent (handled in the agent
  // shader). The floor itself is a barely-luminous plane to seat the field.
  const floorGeom = new THREE.PlaneGeometry(120, 120, 1, 1);
  const floorMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0x0a0d12) },
      uFade: { value: 14.0 }
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform vec3 uColor;
      uniform float uFade;
      void main() {
        // soft falloff from origin so the floor reads as a luminous halo, not a slab
        float d = length(vWorld.xz);
        float a = smoothstep(uFade, 0.0, d);
        // slight banding across z so depth reads
        float bands = 0.5 + 0.5 * sin(vWorld.z * 0.4);
        a *= mix(0.45, 1.0, bands);
        gl_FragColor = vec4(uColor, a * 0.6);
      }
    `
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  return { scene, fogColor, floor };
}
