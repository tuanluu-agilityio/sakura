import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Matrix4, Quaternion,
  ShaderMaterial, Vector2, Vector3, Euler, type Scene,
} from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { WindState } from '../../core/types';
import fragmentShader from './grass.frag.glsl?raw';
import vertexShader from './grass.vert.glsl?raw';
import { heightAt, valueNoise } from './height';
import { surfaceAt } from './surface';

export const GRASS = { bladesAtDensity1: 90000, bladeHeight: 0.45, viewRadius: 60 };
const SEED = 20260;

export function grassCount(density: number): number {
  return Math.round(GRASS.bladesAtDensity1 * density);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded scatter inside the view radius; returns x,z pairs (length 2 * count), all accepted. */
export function scatterGrass(count: number, seed: number, accept: (x: number, z: number) => boolean): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(count * 2);
  let n = 0;
  let tries = 0;
  while (n < count) {
    if (++tries > count * 100 + 1000) throw new Error('scatterGrass: acceptance region too small');
    const r = Math.sqrt(rnd()) * GRASS.viewRadius;
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!accept(x, z)) continue;
    out[n * 2] = x;
    out[n * 2 + 1] = z;
    n++;
  }
  return out;
}

/** Two crossed quads (4 triangles), base at y = 0. */
function bladeGeometry(): BufferGeometry {
  const w = 0.05;
  const h = GRASS.bladeHeight;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let q = 0; q < 2; q++) {
    const c = q === 0 ? 1 : 0;
    const s = q === 0 ? 0 : 1;
    const o = q * 4;
    // base is wide, tip is narrow
    pos.push(-w * c, 0, -w * s, w * c, 0, w * s, -w * 0.3 * c, h, -w * 0.3 * s, w * 0.3 * c, h, w * 0.3 * s);
    idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

export interface GrassOptions {
  scene: Scene;
  wind: WindState;
  /** Blade count for a density; defaults to `grassCount`. */
  count?: (density: number) => number;
}

export function createGrass({ scene, wind, count = grassCount }: GrassOptions) {
  const uniforms = {
    uTime: { value: 0 },
    uWindDir: { value: new Vector2(1, 0) },
    uWind: { value: 0.1 },
    uBladeHeight: { value: GRASS.bladeHeight },
  };
  let mesh: InstancedMesh | null = null;

  const accept = (x: number, z: number): boolean =>
    Math.abs(z - LAYOUT.railway.z) >= LAYOUT.railway.width / 2 + 0.5 && surfaceAt(x, z) === 'grass';

  function teardown(): void {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as ShaderMaterial).dispose();
    mesh.dispose();
    mesh = null;
  }

  function build(n: number): void {
    const pos = scatterGrass(n, SEED, accept);
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: DoubleSide });
    const m = new InstancedMesh(bladeGeometry(), material, n);
    m.frustumCulled = false; // instances span the whole view radius
    m.castShadow = false;
    m.receiveShadow = false;
    const rnd = mulberry32(SEED + 1);
    const mat = new Matrix4();
    const q = new Quaternion();
    const e = new Euler();
    const p = new Vector3();
    const s = new Vector3();
    const a = new Color(PALETTE.grass);
    const b = new Color(PALETTE.grassDark);
    const c = new Color();
    for (let i = 0; i < n; i++) {
      const x = pos[i * 2]!;
      const z = pos[i * 2 + 1]!;
      p.set(x, heightAt(x, z), z);
      q.setFromEuler(e.set(0, rnd() * Math.PI, 0));
      const k = 0.8 + rnd() * 0.6;
      s.set(k, k, k);
      m.setMatrixAt(i, mat.compose(p, q, s));
      m.setColorAt(i, c.copy(a).lerp(b, valueNoise(x * 0.15, z * 0.15) * 0.6 + rnd() * 0.4));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    scene.add(m);
    mesh = m;
  }

  return {
    setQuality(density: number): void {
      teardown();
      build(count(density));
    },
    update(elapsed: number): void {
      uniforms.uTime.value = elapsed;
      uniforms.uWindDir.value.copy(wind.direction);
      uniforms.uWind.value = 0.1 + wind.strength * 0.5 + wind.gust * 0.4;
    },
    dispose: teardown,
  };
}
