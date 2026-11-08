import * as THREE from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { Feature } from '../../core/types';
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
        // Local copy of the sun direction (-0.5, 0.45, -0.3) normalised; features never import each other.
        uSunDir: { value: new THREE.Vector3(-0.5, 0.45, -0.3).normalize() },
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
  dispose() {
    if (!mesh) return;
    scene?.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    mesh = null;
  },
};

export default feature;
