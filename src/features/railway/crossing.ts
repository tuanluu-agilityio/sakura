import { BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, SphereGeometry, type Material } from 'three';
import { createToonMaterial } from '../../shared/toon';

const ARM_LEN = 4;
const UP = (80 * Math.PI) / 180;
const PIVOT_Y = 1.0;
const LAMP_ON = new Color('#ff2a2a');
const LAMP_OFF = new Color('#4a1212');
const POST_SETBACK = 0.3; // signal post sits this far outward of the fence post

export interface PostSpec { x: number; z: number; groundY: number; dir: 1 | -1 }
export interface CrossingGear {
  group: Group;
  /** a in [0,1], 1 = arms down. Lamp A on = `lampA`, lamp B opposite; both off while a = 0. */
  update(a: number, lampA: boolean): void;
  dispose(): void;
}

/** Barrier arms on posts plus a signal post with two red lamps each. `dir`: arm extends toward +x (1) or -x (-1). */
export function buildCrossing(posts: PostSpec[]): CrossingGear {
  const group = new Group();
  const geos: { dispose(): void }[] = [];
  const mats: Material[] = [];
  const toon = (c: string): Material => {
    const m = createToonMaterial({ color: new Color(c) });
    mats.push(m);
    return m;
  };
  const box = (w: number, h: number, d: number): BoxGeometry => {
    const g = new BoxGeometry(w, h, d);
    geos.push(g);
    return g;
  };
  const red = toon('#d8372f');
  const white = toon('#f4f1ea');
  const dark = toon('#3b3b40');
  const lampA = new MeshBasicMaterial({ color: LAMP_OFF.clone() });
  const lampB = new MeshBasicMaterial({ color: LAMP_OFF.clone() });
  mats.push(lampA, lampB);
  const lampGeo = new SphereGeometry(0.14, 10, 8);
  geos.push(lampGeo);

  let litA = false;
  let litB = false;
  const stripeLen = ARM_LEN / 4;
  const stripe = box(stripeLen, 0.12, 0.06);
  const postGeo = box(0.2, 2.4, 0.2);
  const barGeo = box(0.8, 0.06, 0.06);
  const arms: { pivot: Group; dir: 1 | -1 }[] = [];
  for (const p of posts) {
    const post = new Mesh(postGeo, dark);
    const sx = p.x - p.dir * POST_SETBACK;
    post.position.set(sx, p.groundY + 1.2, p.z);
    post.castShadow = true;
    group.add(post);
    const bar = new Mesh(barGeo, dark);
    bar.position.set(sx, p.groundY + 2.0, p.z);
    group.add(bar);
    [lampA, lampB].forEach((m, k) => {
      const lamp = new Mesh(lampGeo, m);
      lamp.position.set(sx + (k === 0 ? -0.3 : 0.3), p.groundY + 2.0, p.z);
      group.add(lamp);
    });

    const pivot = new Group();
    pivot.position.set(p.x, p.groundY + PIVOT_Y, p.z);
    for (let k = 0; k < 4; k++) {
      const s = new Mesh(stripe, k % 2 === 0 ? red : white);
      s.position.x = p.dir * (stripeLen * (k + 0.5));
      pivot.add(s);
    }
    group.add(pivot);
    arms.push({ pivot, dir: p.dir });
  }

  return {
    group,
    update(a, aOn) {
      group.userData.barrier = a; // read by e2e to wait until the arms are down
      for (const arm of arms) arm.pivot.rotation.z = arm.dir * (1 - a) * UP;
      const wantA = a > 0 && aOn;
      const wantB = a > 0 && !aOn;
      if (wantA !== litA) lampA.color.copy((litA = wantA) ? LAMP_ON : LAMP_OFF);
      if (wantB !== litB) lampB.color.copy((litB = wantB) ? LAMP_ON : LAMP_OFF);
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      group.removeFromParent();
    },
  };
}
