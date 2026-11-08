import { BoxGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, type Material } from 'three';
import { createToonMaterial } from '../../shared/toon';
import { sleeperXs } from './logic';

/** Rail head height above terrain at the railway z; duplicated by value in the train feature. */
export const RAIL_TOP = 0.42;
const BALLAST_H = 0.15;
const SLEEPER = { w: 0.25, h: 0.12, d: 2.4 };
const RAIL = { w: 0.07, h: 0.15 };
const RAIL_Z = 0.7175;

export interface Track { group: Group; dispose(): void }

/** Ballast strip, instanced sleepers and two rails along x in [xMin, xMax] at depth z; y from `groundY`. */
export function buildTrack(z: number, xMin: number, xMax: number, groundY: number): Track {
  const group = new Group();
  const geos: BoxGeometry[] = [];
  const mats: Material[] = [];
  const mat = (c: string): Material => {
    const m = createToonMaterial({ color: new Color(c) });
    mats.push(m);
    return m;
  };
  const geo = (w: number, h: number, d: number): BoxGeometry => {
    const g = new BoxGeometry(w, h, d);
    geos.push(g);
    return g;
  };

  const ballast = new Mesh(geo(xMax - xMin, BALLAST_H, 3.4), mat('#8d8a85'));
  ballast.position.set((xMin + xMax) / 2, groundY + BALLAST_H / 2, z);
  ballast.receiveShadow = true;
  group.add(ballast);

  const xs = sleeperXs(xMin, xMax);
  const sleepers = new InstancedMesh(geo(SLEEPER.w, SLEEPER.h, SLEEPER.d), mat('#4a3628'), xs.length);
  const m4 = new Matrix4();
  xs.forEach((x, i) => sleepers.setMatrixAt(i, m4.makeTranslation(x, groundY + BALLAST_H + SLEEPER.h / 2, z)));
  sleepers.receiveShadow = true;
  group.add(sleepers);

  const railMat = mat('#8c9299');
  const railGeo = geo(xMax - xMin, RAIL.h, RAIL.w);
  for (const s of [-1, 1]) {
    const rail = new Mesh(railGeo, railMat);
    rail.position.set((xMin + xMax) / 2, groundY + RAIL_TOP - RAIL.h / 2, z + s * RAIL_Z);
    rail.castShadow = true;
    group.add(rail);
  }

  return {
    group,
    dispose() {
      sleepers.dispose();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      group.removeFromParent();
    },
  };
}
