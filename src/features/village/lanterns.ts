import { BoxGeometry, Color, ConeGeometry, CylinderGeometry, InstancedMesh, Matrix4, MeshBasicMaterial, SphereGeometry, type BufferGeometry, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { XZ } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import { createToonMaterial } from '../../shared/toon';

export const LANTERN_RADIUS = 0.35; // circle collider
const WINDOW_COLOR = '#ffcf8a'; // warm emissive, mandated by the brief

/** Stone lanterns: one InstancedMesh for the stone body, one for the glowing window box. No PointLights. */
export function buildLanterns(spots: XZ[], heightAt: (x: number, z: number) => number): { meshes: InstancedMesh[]; geometries: BufferGeometry[]; materials: Material[] } {
  const stoneParts: BufferGeometry[] = [];
  const base = new BoxGeometry(0.55, 0.18, 0.55);
  base.translate(0, 0.09, 0);
  const post = new CylinderGeometry(0.09, 0.12, 0.7, 8);
  post.translate(0, 0.53, 0);
  const deck = new BoxGeometry(0.44, 0.08, 0.44);
  deck.translate(0, 0.92, 0);
  const roof = new ConeGeometry(0.46, 0.3, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 1.33, 0);
  const cap = new SphereGeometry(0.08, 8, 6);
  cap.translate(0, 1.52, 0);
  stoneParts.push(base, post, deck, roof, cap);
  const stone = mergeGeometries(stoneParts.map((p) => p.toNonIndexed()), false);
  stoneParts.forEach((p) => p.dispose());

  const lamp = new BoxGeometry(0.28, 0.3, 0.28);
  lamp.translate(0, 1.11, 0);

  const stoneMat = createToonMaterial({ color: new Color(PALETTE.snow).lerp(new Color(PALETTE.shadowTint), 0.3) });
  const lampMat = new MeshBasicMaterial({ color: WINDOW_COLOR });
  const meshes = [new InstancedMesh(stone, stoneMat, spots.length), new InstancedMesh(lamp, lampMat, spots.length)];
  const m = new Matrix4();
  spots.forEach((s, i) => {
    m.makeTranslation(s.x, heightAt(s.x, s.z), s.z);
    for (const mesh of meshes) mesh.setMatrixAt(i, m);
  });
  meshes[0]!.castShadow = true;
  meshes[0]!.name = 'lantern-stone';
  meshes[1]!.name = 'lantern-window';
  return { meshes, geometries: [stone, lamp], materials: [stoneMat, lampMat] };
}
