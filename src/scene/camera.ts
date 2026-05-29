import * as THREE from 'three';

export function createCamera(): THREE.PerspectiveCamera {
  // FOV wider, position farther back — references show a wide civic field, not
  // a portrait. Camera floats at human-shoulder height, slightly above the
  // mass of bodies.
  const cam = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 260);
  cam.position.set(0, 2.4, 26);
  cam.lookAt(0, 1.2, 0);
  return cam;
}

// Very slow, near-imperceptible parallax drift through the cycle.
// We want the camera to breathe, not to "fly".
export function driftCamera(cam: THREE.PerspectiveCamera, t: number, elapsed: number) {
  const breathe = Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  const slowX = Math.sin(elapsed * 0.045) * 1.1;
  const slowY = Math.sin(elapsed * 0.033) * 0.25;
  cam.position.x = slowX;
  cam.position.y = 2.30 + slowY + breathe * 0.30;
  cam.position.z = 26 - breathe * 1.4;
  cam.lookAt(0, 1.15 + breathe * 0.20, 0);
}
