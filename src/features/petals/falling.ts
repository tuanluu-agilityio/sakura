import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedBufferAttribute, InstancedMesh,
  ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector4,
} from 'three';
import { LAYOUT, type TreeSpot } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { QualityProfile, Terrain } from '../../core/types';
import fragmentShader from './petal.frag.glsl?raw';
import vertexShader from './petal.vert.glsl?raw';

/** Crown geometry derived from tree scale (sakura-trees: hero scale 2.2 is ~11.2 m tall). */
export const CROWN = {
  radiusPerScale: 4.5,
  heightPerScale: 11.2 / 2.2,
  bottomFraction: 0.5, // blossom anchors start at half the tree height
  heroScale: 2.2,
  heroRadius: 9,
  heroWeight: 0.35, // the hero dominates the intro view
};

export interface PetalVolume { x: number; z: number; radius: number; yBottom: number; yTop: number }

export function petalCount(profile: Pick<QualityProfile, 'petals'>, reduced: boolean): number {
  return reduced ? Math.floor(profile.petals / 2) : profile.petals;
}

/** Hero crown first, then one per secondary tree. Heights are relative to the tree base. */
export function petalVolumes(trees: TreeSpot[]): { volumes: PetalVolume[]; weights: number[] } {
  const crown = (x: number, z: number, scale: number, radius: number): PetalVolume => {
    const h = CROWN.heightPerScale * scale;
    return { x, z, radius, yBottom: h * CROWN.bottomFraction, yTop: h };
  };
  const volumes = [
    crown(LAYOUT.mainTree.x, LAYOUT.mainTree.z, CROWN.heroScale, CROWN.heroRadius),
    ...trees.map((t) => crown(t.x, t.z, t.scale, CROWN.radiusPerScale * t.scale)),
  ];
  // Secondary trees share the rest by crown area (scale^2).
  const area = trees.reduce((s, t) => s + t.scale * t.scale, 0);
  const weights = [CROWN.heroWeight, ...trees.map((t) => ((1 - CROWN.heroWeight) * t.scale * t.scale) / area)];
  return { volumes, weights };
}

/** Index into `weights` for a uniform sample `u` in [0,1). */
export function pickWeighted(weights: number[], u: number): number {
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (u < acc) return i;
  }
  return weights.length - 1;
}

/** Bent 2-triangle petal, 0.09 x 0.06 m, folded along its long axis (in the XY plane). */
export function petalGeometry(): BufferGeometry {
  const w = 0.045;
  const h = 0.03;
  const bend = 0.012;
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-w, 0, 0, w, 0, 0, 0, h, bend, 0, -h, bend], 3));
  g.setIndex([0, 1, 2, 0, 3, 1]);
  g.computeVertexNormals();
  return g;
}

export function createPetalUniforms() {
  return {
    uTime: { value: 0 },
    uWindDir: { value: new Vector2(1, 0) },
    uWindStrength: { value: 0 },
    uGust: { value: 0 },
    uInfluence: { value: new Vector4(0, 0, 0, 0) },
    uColorA: { value: new Color(PALETTE.petal) },
    uColorB: { value: new Color(PALETTE.blossomDeep) },
  };
}
export type PetalUniforms = ReturnType<typeof createPetalUniforms>;

/** Seeded PRNG (mulberry32), floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform point inside the unit sphere (rejection sampling). */
function unitBall(rand: () => number, out: number[]): void {
  for (;;) {
    const x = rand() * 2 - 1, y = rand() * 2 - 1, z = rand() * 2 - 1;
    if (x * x + y * y + z * z <= 1) { out[0] = x; out[1] = y; out[2] = z; return; }
  }
}

/** ONE InstancedMesh of falling petals; all motion is in the vertex shader. */
export function createFallingPetals(o: {
  count: number; terrain: Terrain; rand: () => number; uniforms: PetalUniforms;
}): InstancedMesh {
  const { volumes, weights } = petalVolumes(LAYOUT.trees);
  const n = o.count;
  const seed = new Float32Array(n * 4);
  const base = new Float32Array(n * 4);
  const lateral = new Float32Array(n);
  const u = [0, 0, 0];
  const baseY = volumes.map((v) => o.terrain.heightAt(v.x, v.z));
  for (let i = 0; i < n; i++) {
    const vi = pickWeighted(weights, o.rand());
    const v = volumes[vi]!;
    unitBall(o.rand, u);
    const x = v.x + u[0]! * v.radius;
    const z = v.z + u[2]! * v.radius;
    const mid = (v.yTop + v.yBottom) / 2;
    const half = (v.yTop - v.yBottom) / 2;
    seed.set([vi, o.rand(), 18 + o.rand() * 22, 0.8 + o.rand() * 0.5], i * 4);
    base.set([x, baseY[vi]! + mid + u[1]! * half, z, o.terrain.heightAt(x, z)], i * 4);
    lateral[i] = Math.min(1, Math.hypot(u[0]!, u[2]!));
  }
  const geometry = petalGeometry();
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(seed, 4));
  geometry.setAttribute('aBase', new InstancedBufferAttribute(base, 4));
  geometry.setAttribute('aLateral', new InstancedBufferAttribute(lateral, 1));

  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog]),
    vertexShader, fragmentShader, side: DoubleSide, fog: true,
  });
  // Share (not clone) the live uniforms so per-frame writes and `userData.influence` stay valid.
  Object.assign(material.uniforms, o.uniforms);
  material.userData.influence = o.uniforms.uInfluence.value;

  const mesh = new InstancedMesh(geometry, material, n);
  mesh.name = 'petals-falling';
  mesh.frustumCulled = false; // positions are computed on the GPU
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}
