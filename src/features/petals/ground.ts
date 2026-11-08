import { Color, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { Terrain } from '../../core/types';
import { createToonMaterial } from '../../shared/toon';
import { petalGeometry, petalVolumes, pickWeighted } from './falling';

export const GROUND = { share: 0.35, radiusFactor: 1.1, lift: 0.01 };

export function groundCount(petals: number): number {
  return Math.floor(GROUND.share * petals);
}

/**
 * Seeded polar scatter around each tree base; r = R * u gives density ~ 1/r (falls off
 * with distance). Rejects water. Returns x,z pairs (fewer only if a tree is ringed by water).
 */
export function scatterGround(count: number, terrain: Terrain, rand: () => number): Float32Array {
  const { volumes, weights } = petalVolumes(LAYOUT.trees);
  const out = new Float32Array(count * 2);
  let n = 0;
  let tries = 0;
  while (n < count && tries++ < count * 20) {
    const v = volumes[pickWeighted(weights, rand())]!;
    const r = rand() * v.radius * GROUND.radiusFactor;
    const a = rand() * Math.PI * 2;
    const x = v.x + Math.cos(a) * r;
    const z = v.z + Math.sin(a) * r;
    if (terrain.surfaceAt(x, z) === 'water') continue;
    out[n * 2] = x;
    out[n * 2 + 1] = z;
    n++;
  }
  return n === count ? out : out.slice(0, n * 2);
}

/** ONE static InstancedMesh of flat petals lying on the terrain. */
export function createGroundPetals(o: { count: number; terrain: Terrain; rand: () => number }): InstancedMesh {
  const pos = scatterGround(o.count, o.terrain, o.rand);
  const n = pos.length / 2;
  const geometry = petalGeometry();
  geometry.rotateX(-Math.PI / 2); // lie flat, fold bulging up
  // Base colour white (PALETTE.snow) so instance colours give the exact petal tones.
  const mesh = new InstancedMesh(geometry, createToonMaterial({ color: PALETTE.snow }), n);
  mesh.name = 'petals-ground';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  const a = new Color(PALETTE.petal);
  const b = new Color(PALETTE.blossomDeep);
  const c = new Color();
  for (let i = 0; i < n; i++) {
    const x = pos[i * 2]!;
    const z = pos[i * 2 + 1]!;
    p.set(x, o.terrain.heightAt(x, z) + GROUND.lift, z);
    q.setFromEuler(e.set(0, o.rand() * Math.PI * 2, 0));
    const k = 0.8 + o.rand() * 0.5;
    mesh.setMatrixAt(i, m.compose(p, q, s.set(k, k, k)));
    mesh.setColorAt(i, c.copy(a).lerp(b, o.rand()));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
