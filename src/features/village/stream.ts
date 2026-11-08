import { BufferAttribute, BufferGeometry, Color, Mesh, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { PALETTE } from '../../core/palette';
import type { Collider } from '../../core/types';
import { LAYOUT, type XZ } from '../../core/layout';
import vertexShader from './stream.vert.glsl?raw';
import fragmentShader from './stream.frag.glsl?raw';

/** Water surface height: above the bed (-0.6), below the bank (0). */
export const WATER_Y = -0.15;
const COLLIDER_INSET = 0.1;
const UV_METRES = 3;

export interface Ribbon { positions: Float32Array; uvs: Float32Array; indices: Uint32Array }

/** Flat ribbon along a polyline: uv.x across 0..1, uv.y = metres along / 3. Samples every `segLen`. */
export function buildRibbon(pts: XZ[], width: number, y: number, segLen: number): Ribbon {
  // Resample at fixed arc length, keeping every polyline corner.
  const samples: { x: number; z: number; s: number }[] = [];
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / segLen));
    for (let k = 0; k < n; k++) samples.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n, s: s + (len * k) / n });
    s += len;
  }
  const last = pts[pts.length - 1]!;
  samples.push({ x: last.x, z: last.z, s });

  const count = samples.length;
  const positions = new Float32Array(count * 2 * 3);
  const uvs = new Float32Array(count * 2 * 2);
  const indices = new Uint32Array((count - 1) * 6);
  for (let i = 0; i < count; i++) {
    const p = samples[i]!;
    const prev = samples[Math.max(0, i - 1)]!;
    const next = samples[Math.min(count - 1, i + 1)]!;
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl; // left normal in the xz plane
    const nz = tx / tl;
    const h = width / 2;
    positions.set([p.x + nx * h, y, p.z + nz * h, p.x - nx * h, y, p.z - nz * h], i * 6);
    uvs.set([0, p.s / UV_METRES, 1, p.s / UV_METRES], i * 4);
  }
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    indices.set([a, a + 2, a + 1, a + 1, a + 2, a + 3], i * 6);
  }
  return { positions, uvs, indices };
}

/** Box colliders tiling the stream, with a walkable gap around the bridge (bridge.width/2 + 1.1 each side). */
export function streamColliders(pts: XZ[], width: number, bridge: { x: number; z: number; width: number }, chunk = 1): Collider[] {
  const out: Collider[] = [];
  const keepFrom = bridge.width / 2 + 1.1 - chunk / 2; // box centres closer than this to the bridge are dropped
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / chunk));
    const rot = Math.atan2(b.x - a.x, b.z - a.z); // local z along the stream
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = a.x + (b.x - a.x) * t;
      if (Math.abs(x - bridge.x) < keepFrom) continue;
      out.push({ kind: 'box', x, z: a.z + (b.z - a.z) * t, hw: width / 2 - COLLIDER_INSET, hd: chunk / 2, rot });
    }
  }
  return out;
}

export function createStreamMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      { uTime: { value: 0 }, uColor: { value: new Color(PALETTE.water) }, uFoam: { value: new Color(PALETTE.snow) } },
    ]),
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog: true,
  });
}

const RIBBON_SEG = 2;
const RIBBON_EXTRA = 1.4; // visual width beyond LAYOUT.stream.width: the bank ramp hides the water until ~2.2 m from the centreline

/** The stream mesh (renderOrder 1, after opaque geometry) with its owned geometry and material. */
export function createStreamMesh(): { mesh: Mesh; geometry: BufferGeometry; material: ShaderMaterial } {
  const ribbon = buildRibbon(LAYOUT.stream.points, LAYOUT.stream.width + RIBBON_EXTRA, WATER_Y, RIBBON_SEG);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(ribbon.positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(ribbon.uvs, 2));
  geometry.setIndex(new BufferAttribute(ribbon.indices, 1));
  const material = createStreamMaterial();
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = 1;
  mesh.name = 'stream';
  return { mesh, geometry, material };
}
