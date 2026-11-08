import { BoxGeometry, Color, Group, Mesh, type Material } from 'three';
import { PALETTE } from '../../core/palette';
import type { Collider } from '../../core/types';
import { createToonMaterial } from '../../shared/toon';

export const SEAT_HEIGHT = 0.45;

export interface Bench { group: Group; collider: Collider; dispose(): void }

/** Stone bench centred on (x, z), seat top SEAT_HEIGHT above groundY, backrest on the north (-z) side. */
export function createBench(x: number, z: number, groundY: number): Bench {
  const stone: Material = createToonMaterial({ color: new Color(PALETTE.path).lerp(new Color('#9a9a9a'), 0.65) });
  const geos: BoxGeometry[] = [];
  const group = new Group();
  const box = (w: number, h: number, d: number, px: number, py: number, pz: number): void => {
    const g = new BoxGeometry(w, h, d);
    geos.push(g);
    const m = new Mesh(g, stone);
    m.position.set(px, py, pz);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  };
  const legH = SEAT_HEIGHT - 0.12;
  box(2, 0.12, 0.55, 0, SEAT_HEIGHT - 0.06, 0);
  box(0.25, legH, 0.45, -0.75, legH / 2, 0);
  box(0.25, legH, 0.45, 0.75, legH / 2, 0);
  box(2, 0.3, 0.1, 0, SEAT_HEIGHT + 0.15, -0.25);
  group.position.set(x, groundY, z);
  return {
    group,
    collider: { kind: 'box', x, z, hw: 1.0, hd: 0.3, rot: 0 },
    dispose() { for (const g of geos) g.dispose(); stone.dispose(); group.removeFromParent(); },
  };
}
