import * as THREE from 'three';
import { PALETTE } from '../../core/palette';
import { SUN_COLOR, SUN_DIR } from './light';
import vert from './dome.vert.glsl?raw';
import frag from './dome.frag.glsl?raw';

export const DOME_RADIUS = 1500;

export interface Dome { mesh: THREE.Mesh; update(camera: THREE.Camera): void; dispose(): void }

export function createDome(): Dome {
  const geometry = new THREE.SphereGeometry(DOME_RADIUS, 32, 16);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(PALETTE.skyTop) },
      uHorizon: { value: new THREE.Color(PALETTE.skyHorizon) },
      uSunDir: { value: SUN_DIR },
      uSunColor: { value: new THREE.Color(SUN_COLOR) },
    },
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return {
    mesh,
    update(camera) { mesh.position.copy(camera.position); },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
