import { BufferAttribute, BufferGeometry } from 'three';

const SEGMENTS = 10; // per half of the profile
const THICKNESS = 0.2;
const TIP_LIFT = 0.28; // eave tips curl up

/**
 * Gable roof: profile in x/y (ridge at x = 0, y = rise; eaves at x = +-(w / 2 + overhang), y ~ 0),
 * extruded along z for length `d`. The top is concave (steep at the ridge, flattening to the eave,
 * then curling up at the tip). Includes an under-surface, both gable ends and the eave edges.
 */
export function buildRoofGeometry(w: number, d: number, rise: number, overhang: number): BufferGeometry {
  const half = w / 2 + overhang;
  // Top profile, left eave -> ridge -> right eave.
  const top: [number, number][] = [];
  for (let i = -SEGMENTS; i <= SEGMENTS; i++) {
    const s = Math.abs(i) / SEGMENTS; // 0 ridge .. 1 eave
    const y = rise * (1 - s) ** 1.7 + TIP_LIFT * s ** 6;
    top.push([Math.sign(i) * s * half, y]);
  }
  const bottom = top.map(([x, y]): [number, number] => [x * 0.97, y - THICKNESS]);

  const pos: number[] = [];
  const idx: number[] = [];
  const quad = (a: number[], b: number[], c: number[], e: number[]): void => {
    const base = pos.length / 3;
    pos.push(...a, ...b, ...c, ...e);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const z0 = -d / 2;
  const z1 = d / 2;
  for (let i = 0; i < top.length - 1; i++) {
    const [ax, ay] = top[i]!;
    const [bx, by] = top[i + 1]!;
    // Upper surface (faces up); the ridge vertex is duplicated by the separate quads so the ridge stays crisp.
    quad([ax, ay, z0], [ax, ay, z1], [bx, by, z1], [bx, by, z0]);
    const [cx, cy] = bottom[i]!;
    const [ex, ey] = bottom[i + 1]!;
    // Underside (faces down).
    quad([cx, cy, z0], [ex, ey, z0], [ex, ey, z1], [cx, cy, z1]);
    // Gable end faces: a strip between top and bottom at each end.
    quad([ax, ay, z1], [cx, cy, z1], [ex, ey, z1], [bx, by, z1]);
    quad([ax, ay, z0], [bx, by, z0], [ex, ey, z0], [cx, cy, z0]);
  }
  // Eave edges close the slab at both ends of the profile.
  for (const i of [0, top.length - 1]) {
    const sgn = i === 0 ? 1 : -1;
    const [tx, ty] = top[i]!;
    const [bx, by] = bottom[i]!;
    if (sgn > 0) quad([tx, ty, z0], [bx, by, z0], [bx, by, z1], [tx, ty, z1]);
    else quad([tx, ty, z0], [tx, ty, z1], [bx, by, z1], [bx, by, z0]);
  }

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
