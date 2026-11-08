import { BoxGeometry, CylinderGeometry, Mesh, type BufferGeometry, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createToonMaterial } from '../../shared/toon';

export const TORII_COLOR = '#d9482f'; // vermilion, mandated by the brief
export const PILLAR = { r: 0.22, h: 4.2, half: 1.8 } as const; // half = pillar offset from the gate centre

/** Gate along local x (pillars at x = +-half). Rotated a quarter turn so the passage runs along world x. */
export function buildTorii(groundY: number, x: number, z: number): { mesh: Mesh; geometry: BufferGeometry; material: Material } {
  const { r, h, half } = PILLAR;
  const parts: BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const p = new CylinderGeometry(r * 0.92, r, h, 12);
    p.translate(s * half, h / 2, 0);
    parts.push(p);
  }
  const nuki = new BoxGeometry(2 * half + 0.9, 0.2, 0.26);
  nuki.translate(0, h - 0.95, 0);
  const shimaki = new BoxGeometry(2 * half + 1.5, 0.22, 0.4);
  shimaki.translate(0, h + 0.05, 0);
  const kasagi = new BoxGeometry(2 * half + 2.6, 0.3, 0.56);
  kasagi.translate(0, h + 0.3, 0);
  parts.push(nuki, shimaki, kasagi);
  for (const s of [-1, 1]) {
    const tip = new BoxGeometry(0.9, 0.3, 0.56); // upturned ends of the kasagi
    tip.rotateZ(s * 0.28);
    tip.translate(s * (half + 1.55), h + 0.45, 0);
    parts.push(tip);
  }
  const geometry = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  parts.forEach((p) => p.dispose());
  const material = createToonMaterial({ color: TORII_COLOR });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, groundY, z);
  mesh.rotation.y = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'torii';
  return { mesh, geometry, material };
}

/** World positions of the two pillars for a gate at (x, z) (passage along world x, so pillars split in z). */
export function pillarSpots(x: number, z: number): { x: number; z: number }[] {
  return [{ x, z: z - PILLAR.half }, { x, z: z + PILLAR.half }];
}
