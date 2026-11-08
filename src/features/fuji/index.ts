import * as THREE from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { Feature } from '../../core/types';
import { SUN_DIR } from '../../shared/sun';
import { buildFujiGeometry } from './geometry';
import frag from './fuji.frag.glsl?raw';
import vert from './fuji.vert.glsl?raw';

let scene: THREE.Scene | null = null;
let mesh: THREE.Mesh | null = null;

const feature: Feature = {
  name: 'fuji',
  init(ctx) {
    scene = ctx.scene;
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      fog: false,
      depthWrite: true,
      uniforms: {
        uHeight: { value: LAYOUT.fuji.height },
        uFuji: { value: new THREE.Color(PALETTE.fuji) },
        uSnow: { value: new THREE.Color(PALETTE.snow) },
        uHorizon: { value: new THREE.Color(PALETTE.skyHorizon) },
        uShadow: { value: new THREE.Color(PALETTE.shadowTint) },
        uSunDir: { value: SUN_DIR },
        uHaze: { value: 0.35 },
        fogExempt: { value: 1 },
      },
    });
    mesh = new THREE.Mesh(buildFujiGeometry(7), material);
    mesh.name = 'fuji';
    mesh.position.set(LAYOUT.fuji.x, 0, LAYOUT.fuji.z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
  },
  /** Nothing here depends on the quality profile; intentionally a no-op. */
  setQuality() {},
  dispose() {
    if (!mesh) return;
    scene?.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    mesh = null;
  },
};

export default feature;
