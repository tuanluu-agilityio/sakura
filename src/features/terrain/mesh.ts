import { BufferGeometry, Color, Float32BufferAttribute, Mesh, Uint32BufferAttribute, type MeshStandardMaterial } from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import { createToonMaterial } from '../../shared/toon';
import { hillHeight, ringDistance } from './boundary';
import { distToPath, distToStream, heightAt, smoothstep, valueNoise } from './height';

const HALF = 200; // 400 x 400 m plane

/** 2 m cells inside bounds, 4 m outside. */
function axis(): number[] {
  const b = LAYOUT.bounds.xMax;
  const out: number[] = [];
  for (let v = -HALF; v < -b; v += 4) out.push(v);
  for (let v = -b; v < b; v += 2) out.push(v);
  for (let v = b; v <= HALF; v += 4) out.push(v);
  return out;
}

export function createTerrainMesh(): Mesh {
  const xs = axis();
  const zs = axis();
  const nx = xs.length;
  const pos = new Float32Array(nx * zs.length * 3);
  const col = new Float32Array(nx * zs.length * 3);
  const grass = new Color(PALETTE.grass);
  const dark = new Color(PALETTE.grassDark);
  const path = new Color(PALETTE.path);
  const water = new Color(PALETTE.water);
  const c = new Color();
  const half = LAYOUT.pathWidth / 2;

  for (let j = 0; j < zs.length; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i]!;
      const z = zs[j]!;
      const k = (j * nx + i) * 3;
      pos[k] = x;
      pos[k + 1] = heightAt(x, z) + hillHeight(x, z);
      pos[k + 2] = z;
      c.copy(grass).lerp(dark, valueNoise(x / 9, z / 9) * 0.8);
      c.lerp(path, 1 - smoothstep(half - 0.4, half + 0.6, distToPath(x, z)));
      c.lerp(water, 1 - smoothstep(LAYOUT.stream.width / 2 - 0.2, LAYOUT.stream.width / 2 + 0.8, distToStream(x, z)));
      c.multiplyScalar(1 - 0.15 * smoothstep(50, 100, ringDistance(x, z)));
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    }
  }

  const idx = new Uint32Array((nx - 1) * (zs.length - 1) * 6);
  let n = 0;
  for (let j = 0; j < zs.length - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const d = a + nx;
      const e = d + 1;
      idx[n++] = a; idx[n++] = d; idx[n++] = b;
      idx[n++] = b; idx[n++] = d; idx[n++] = e;
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new Float32BufferAttribute(col, 3));
  geo.setIndex(new Uint32BufferAttribute(idx, 1));
  geo.computeVertexNormals();

  const mat = createToonMaterial({ color: PALETTE.snow }) as MeshStandardMaterial;
  mat.vertexColors = true;
  const mesh = new Mesh(geo, mat);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}
