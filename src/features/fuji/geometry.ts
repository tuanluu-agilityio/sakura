import * as THREE from 'three';
import { LAYOUT } from '../../core/layout';

const { baseRadius: R, height: H } = LAYOUT.fuji;
const RADIAL = 128;
const VERTICAL = 48;
const CRATER = 0.04 * R;

const ridge = (angle: number, h01: number) =>
  0.6 * Math.sin(7 * angle + 3 * h01) + 0.4 * Math.sin(13 * angle - 2 * h01);

/** Concave cone profile with radial ridges, ending at crater radius 0.04R at h01 = 1; h01 in [0,1] (0 = base). */
export function fujiRadiusAt(h01: number, angle: number): number {
  return R * Math.pow(1 - h01, 1.35) * (1 + 0.04 * ridge(angle, h01)) + CRATER * h01;
}

/** Seeded mulberry32 for small deterministic jitter. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Origin at base centre, +Y up. Flat crater cap of radius 0.04R at h01 = 1. */
export function buildFujiGeometry(seed: number): THREE.BufferGeometry {
  const rand = rng(seed);
  const pos = new Float32Array((RADIAL * (VERTICAL + 1) + 1) * 3);
  let n = 0;
  for (let j = 0; j <= VERTICAL; j++) {
    const h = j / VERTICAL;
    for (let i = 0; i < RADIAL; i++) {
      const a = (i / RADIAL) * Math.PI * 2;
      const jitter = j === 0 || j === VERTICAL ? 0 : (rand() - 0.5) * 2;
      const r = fujiRadiusAt(h, a) + jitter;
      pos[n++] = Math.cos(a) * r;
      pos[n++] = h * H;
      pos[n++] = Math.sin(a) * r;
    }
  }
  const centre = RADIAL * (VERTICAL + 1);
  pos[n++] = 0;
  pos[n++] = H;
  pos[n++] = 0;

  const idx: number[] = [];
  for (let j = 0; j < VERTICAL; j++) {
    for (let i = 0; i < RADIAL; i++) {
      const i1 = (i + 1) % RADIAL;
      const a = j * RADIAL + i;
      const b = j * RADIAL + i1;
      const c = (j + 1) * RADIAL + i;
      const d = (j + 1) * RADIAL + i1;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (let i = 0; i < RADIAL; i++) idx.push(centre, VERTICAL * RADIAL + ((i + 1) % RADIAL), VERTICAL * RADIAL + i);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
