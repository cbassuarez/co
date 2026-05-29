import * as THREE from 'three';
import type { Params } from './params';

export function createRenderer(canvas: HTMLCanvasElement, params: Params): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // bloom + grain handle softening; antialias is expensive
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    stencil: false,
    depth: true
  });

  const dprCap = params.quality === 'high' ? 1.75 : params.quality === 'med' ? 1.25 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  return renderer;
}

export function bindResize(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  onResize?: (w: number, h: number) => void
): () => void {
  const handler = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    onResize?.(w, h);
  };
  window.addEventListener('resize', handler, { passive: true });
  handler();
  return () => window.removeEventListener('resize', handler);
}
