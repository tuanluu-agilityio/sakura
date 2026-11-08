import * as THREE from 'three';
import { PALETTE } from '../../core/palette';
import type { QualityProfile, WorldContext } from '../../core/types';
import { SUN_DIR } from '../../shared/sun';

export { SUN_DIR };
export const SUN_COLOR = '#ffe2b8';
export const SUN_INTENSITY = 2.4;
export const HEMI = { sky: PALETTE.skyTop, ground: PALETTE.grass, intensity: 0.7 };
export const SHADOW = { bias: -0.0004, normalBias: 0.04, halfExtent: 60 };

const SUN_DISTANCE = 120;

/** Snap the shadow-frustum centre to a 1 m grid so shadows do not shimmer while the player moves. */
export function shadowFrustum(
  playerPos: { x: number; z: number },
  _halfExtent: number,
  out: { cx: number; cz: number } = { cx: 0, cz: 0 },
): { cx: number; cz: number } {
  out.cx = Math.round(playerPos.x) || 0; // `|| 0` turns -0 into 0
  out.cz = Math.round(playerPos.z) || 0;
  return out;
}

export interface SkyLight { update(): void; setQuality(p: QualityProfile): void; dispose(): void }

export function createLight(ctx: WorldContext): SkyLight {
  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.castShadow = true;
  sun.shadow.mapSize.set(ctx.quality.shadowMapSize, ctx.quality.shadowMapSize);
  const h = SHADOW.halfExtent;
  const cam = sun.shadow.camera;
  cam.left = -h; cam.right = h; cam.top = h; cam.bottom = -h;
  cam.near = 1; cam.far = SUN_DISTANCE * 2;
  cam.updateProjectionMatrix();
  sun.shadow.bias = SHADOW.bias;
  sun.shadow.normalBias = SHADOW.normalBias;
  const hemi = new THREE.HemisphereLight(HEMI.sky, HEMI.ground, HEMI.intensity);
  ctx.scene.add(sun, sun.target, hemi);

  const centre = { cx: 0, cz: 0 };
  const update = (): void => {
    const { cx, cz } = shadowFrustum(ctx.player.position, SHADOW.halfExtent, centre);
    sun.target.position.set(cx, 0, cz);
    sun.position.set(cx, 0, cz).addScaledVector(SUN_DIR, SUN_DISTANCE);
    sun.target.updateMatrixWorld();
  };
  update();

  return {
    update,
    setQuality(p) {
      if (sun.shadow.mapSize.x === p.shadowMapSize) return;
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      sun.shadow.mapSize.set(p.shadowMapSize, p.shadowMapSize);
    },
    dispose() {
      sun.shadow.map?.dispose();
      sun.dispose();
      hemi.dispose();
      ctx.scene.remove(sun, sun.target, hemi);
    },
  };
}
