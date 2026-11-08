import { PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, WebGLRenderer, Color } from 'three';
import { PALETTE } from './palette';
import type { QualityProfile } from './types';

export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(new Color(PALETTE.skyHorizon));
  return renderer;
}

/** Fit renderer + camera to the window, capping pixel ratio by the quality profile. */
export function resizeRenderer(renderer: WebGLRenderer, camera: PerspectiveCamera, profile: QualityProfile): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio));
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
