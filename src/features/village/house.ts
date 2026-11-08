import { BoxGeometry, Color, DoubleSide, InstancedMesh, Matrix4, Object3D, type BufferGeometry, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE } from '../../core/palette';
import { createToonMaterial } from '../../shared/toon';
import { HOUSE, type HousePlacement } from './placement';
import { buildRoofGeometry } from './roof';

const FLOOR_Y = 0.45; // floor level above local origin (the plinth sinks into the ground)
const WALL_H = 2.4;
const ENGAWA_DEPTH = 1.2;
const ROOF_RISE = 1.9;
const ROOF_OVERHANG = 0.9;

function box(w: number, h: number, d: number, x: number, y: number, z: number): BoxGeometry {
  const g = new BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/** Local frame: front (engawa) faces -z, footprint x +-HOUSE.hw, z +-HOUSE.hd. */
function buildWood(): BufferGeometry {
  const { hw, hd } = HOUSE;
  const bodyZ0 = -hd + ENGAWA_DEPTH;
  const bodyD = hd - bodyZ0;
  const parts: BufferGeometry[] = [
    box(2 * hw - 0.4, FLOOR_Y + 0.7, 2 * hd - 0.4, 0, (FLOOR_Y - 0.7) / 2, 0), // plinth sunk into the ground
    box(2 * hw - 0.8, WALL_H, bodyD, 0, FLOOR_Y + WALL_H / 2, bodyZ0 + bodyD / 2), // wood body
    box(2 * hw - 0.4, 0.12, ENGAWA_DEPTH, 0, FLOOR_Y + 0.06, -hd + ENGAWA_DEPTH / 2), // engawa deck
  ];
  for (const px of [-hw + 0.5, -hw / 3, hw / 3, hw - 0.5]) {
    parts.push(box(0.14, WALL_H + 0.1, 0.14, px, FLOOR_Y + WALL_H / 2, -hd + 0.2)); // engawa posts
  }
  parts.push(box(2 * hw - 0.4, 0.16, 0.18, 0, FLOOR_Y + WALL_H + 0.02, -hd + 0.2)); // eave beam
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  parts.forEach((p) => p.dispose());
  return merged;
}

function buildPlaster(): BufferGeometry {
  const { hw, hd } = HOUSE;
  const bodyZ0 = -hd + ENGAWA_DEPTH;
  const bodyD = hd - bodyZ0;
  const y = FLOOR_Y + WALL_H * 0.5 + 0.1;
  const h = WALL_H - 0.5;
  const parts: BufferGeometry[] = [];
  const xs = [-hw * 0.62, 0, hw * 0.62];
  const pw = hw * 0.5;
  const frontZ = bodyZ0 - 0.03;
  const backZ = hd + 0.03;
  for (const x of xs) {
    parts.push(box(pw, h, 0.06, x, y, frontZ), box(pw, h, 0.06, x, y, backZ));
  }
  const sideX = hw - 0.4 + 0.03;
  for (const s of [-1, 1]) parts.push(box(0.06, h, bodyD * 0.55, s * sideX, y, bodyZ0 + bodyD / 2));
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  parts.forEach((p) => p.dispose());
  return merged;
}

export interface Houses { meshes: InstancedMesh[]; geometries: BufferGeometry[]; materials: Material[] }

/** Three shared-geometry InstancedMeshes (wood, plaster, roof) for all houses; colour tint varies per instance. */
export function buildHouses(spots: HousePlacement[], heightAt: (x: number, z: number) => number): Houses {
  const wood = buildWood();
  const plaster = buildPlaster();
  // Profile across the footprint depth, ridge along the footprint width (rotated a quarter turn below).
  const roof = buildRoofGeometry(2 * HOUSE.hd, 2 * HOUSE.hw + 1.0, ROOF_RISE, ROOF_OVERHANG);
  roof.rotateY(Math.PI / 2);
  roof.translate(0, FLOOR_Y + WALL_H, 0);

  const woodMat = createToonMaterial({ color: PALETTE.trunk });
  const plasterMat = createToonMaterial({ color: new Color(PALETTE.snow).lerp(new Color(PALETTE.blossom), 0.25) });
  const roofMat = createToonMaterial({ color: new Color(PALETTE.shadowTint).multiplyScalar(0.45) });
  roofMat.side = DoubleSide;

  const defs: [BufferGeometry, Material][] = [[wood, woodMat], [plaster, plasterMat], [roof, roofMat]];
  const meshes = defs.map(([g, m]) => {
    const mesh = new InstancedMesh(g, m, spots.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'village-houses';
    return mesh;
  });

  const o = new Object3D();
  const m4 = new Matrix4();
  const tint = new Color();
  spots.forEach((s, i) => {
    const { hw, hd } = HOUSE;
    // Ground the house on the highest footprint corner so the plinth never floats.
    const gy = Math.max(heightAt(s.x, s.z), heightAt(s.x + hw, s.z + hd), heightAt(s.x - hw, s.z - hd), heightAt(s.x + hw, s.z - hd), heightAt(s.x - hw, s.z + hd));
    o.position.set(s.x, gy, s.z);
    o.rotation.set(0, s.rot, 0);
    o.updateMatrix();
    m4.copy(o.matrix);
    const v = 0.9 + ((i * 37) % 11) / 55; // deterministic 0.9..1.08 tint
    tint.setScalar(v);
    for (const mesh of meshes) {
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, tint);
    }
  });
  return { meshes, geometries: [wood, plaster, roof], materials: [woodMat, plasterMat, roofMat] };
}
