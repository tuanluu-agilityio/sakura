import { BoxGeometry, Color, InstancedMesh, Matrix4, Mesh, type BufferGeometry, type Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { Collider } from '../../core/types';
import { createToonMaterial } from '../../shared/toon';

const DECK_LIFT = 0.12; // deck top above the bank height
const PLANK_T = 0.1;
const PLANK_D = 0.3;
const PLANK_GAP = 0.04;
const RAIL_HEIGHTS = [0.5, 0.95];

/** Railing colliders: two thin boxes beside the deck along the span. */
export function bridgeColliders(): Collider[] {
  const { x, z, length, width } = LAYOUT.bridge;
  return [-1, 1].map((s): Collider => ({ kind: 'box', x: x + s * (width / 2 + 0.05), z, hw: 0.06, hd: length / 2, rot: 0 }));
}

export function buildBridge(bankY: number): { objects: (InstancedMesh | Mesh)[]; geometries: BufferGeometry[]; materials: Material[] } {
  const { x, z, length, width } = LAYOUT.bridge;
  const top = bankY + DECK_LIFT;
  const wood = createToonMaterial({ color: new Color(PALETTE.trunk).lerp(new Color(PALETTE.path), 0.3) });
  const dark = createToonMaterial({ color: PALETTE.trunk });

  const plank = new BoxGeometry(width, PLANK_T, PLANK_D);
  const count = Math.floor(length / (PLANK_D + PLANK_GAP));
  const deck = new InstancedMesh(plank, wood, count);
  const m = new Matrix4();
  const span = count * (PLANK_D + PLANK_GAP) - PLANK_GAP;
  for (let i = 0; i < count; i++) {
    m.makeTranslation(x, top - PLANK_T / 2, z - span / 2 + PLANK_D / 2 + i * (PLANK_D + PLANK_GAP));
    deck.setMatrixAt(i, m);
  }
  deck.castShadow = true;
  deck.receiveShadow = true;
  deck.name = 'bridge-deck';

  const parts: BufferGeometry[] = [];
  const add = (w: number, h: number, d: number, px: number, py: number, pz: number): void => {
    const g = new BoxGeometry(w, h, d);
    g.translate(px, py, pz);
    parts.push(g);
  };
  add(0.14, 0.2, length, -(width / 2 - 0.2), top - PLANK_T - 0.1, 0); // stringers under the deck
  add(0.14, 0.2, length, width / 2 - 0.2, top - PLANK_T - 0.1, 0);
  for (const s of [-1, 1]) {
    const rx = s * (width / 2 + 0.05);
    for (const h of RAIL_HEIGHTS) add(0.1, 0.08, length, rx, top + h, 0);
    for (let i = 0; i <= 4; i++) add(0.12, 1.05, 0.12, rx, top + 0.5, -length / 2 + 0.1 + (i * (length - 0.2)) / 4);
  }
  const rails = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  parts.forEach((p) => p.dispose());
  const railMesh = new Mesh(rails, dark);
  railMesh.position.set(x, 0, z);
  railMesh.castShadow = true;
  railMesh.receiveShadow = true;
  railMesh.name = 'bridge-rails';
  return { objects: [deck, railMesh], geometries: [plank, rails], materials: [wood, dark] };
}
