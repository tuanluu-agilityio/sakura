import {
  AnimationClip, CapsuleGeometry, ConeGeometry, Euler, Group, Mesh, Object3D, Quaternion,
  QuaternionKeyframeTrack, SphereGeometry, VectorKeyframeTrack, BoxGeometry, type BufferGeometry,
} from 'three';
import { PALETTE } from '../core/palette';
import { createToonMaterial } from './toon';

export type CharacterId = 'player' | 'boy' | 'girl';

interface Look { height: number; skin: string; hair: string; top: string; bottom: string; skirt: boolean; fringe: number; }

/** Palette-only looks: three visually distinct silhouettes/colours. */
export const LOOKS: Record<CharacterId, Look> = {
  player: { height: 1.7, skin: PALETTE.blossom, hair: PALETTE.trunk, top: PALETTE.trainStripe, bottom: PALETTE.fuji, skirt: false, fringe: 0.5 },
  boy: { height: 1.6, skin: PALETTE.blossom, hair: PALETTE.path, top: PALETTE.grassDark, bottom: PALETTE.trunk, skirt: false, fringe: 0.2 },
  girl: { height: 1.6, skin: PALETTE.blossom, hair: PALETTE.shadowTint, top: PALETTE.petal, bottom: PALETTE.blossomDeep, skirt: true, fringe: 0.8 },
};

const q = (x: number, y = 0, z = 0): Quaternion => new Quaternion().setFromEuler(new Euler(x, y, z));

/** Builds a chibi (big head) rig of nodes facing +Z, feet at y=0, scaled to look.height. Returns root + owned geometries. */
export function buildChibi(id: CharacterId): { root: Group; geometries: BufferGeometry[] } {
  const look = LOOKS[id];
  const H = look.height;
  const geometries: BufferGeometry[] = [];
  const mat = (color: string) => createToonMaterial({ color });
  const part = (geo: BufferGeometry, color: string, parent: Object3D, x: number, y: number, z: number): Mesh => {
    geometries.push(geo);
    const m = new Mesh(geo, mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const node = (name: string, parent: Object3D, x: number, y: number, z: number): Object3D => {
    const n = new Object3D();
    n.name = name;
    n.position.set(x, y, z);
    parent.add(n);
    return n;
  };
  const root = new Group();
  root.name = id;
  const legLen = 0.2 * H;
  const hips = node('hips', root, 0, 2 * legLen, 0);
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const thigh = node(`thigh${side}`, hips, s * 0.06 * H, 0, 0);
    part(new CapsuleGeometry(0.05 * H, legLen * 0.7, 4, 8), look.bottom, thigh, 0, -legLen / 2, 0);
    const knee = node(`knee${side}`, thigh, 0, -legLen, 0);
    part(new CapsuleGeometry(0.045 * H, legLen * 0.6, 4, 8), look.skin, knee, 0, -legLen * 0.45, 0);
    part(new BoxGeometry(0.1 * H, 0.04 * H, 0.16 * H), look.hair, knee, 0, -legLen + 0.02 * H, 0.03 * H);
  }
  const torso = node('torso', hips, 0, 0, 0);
  part(new CapsuleGeometry(0.1 * H, 0.14 * H, 4, 10), look.top, torso, 0, 0.13 * H, 0);
  if (look.skirt) part(new ConeGeometry(0.17 * H, 0.2 * H, 12), look.bottom, torso, 0, 0.0, 0);
  for (const s of [-1, 1]) {
    const arm = node(`arm${s < 0 ? 'L' : 'R'}`, torso, s * 0.15 * H, 0.23 * H, 0);
    part(new CapsuleGeometry(0.035 * H, 0.15 * H, 4, 8), look.top, arm, 0, -0.1 * H, 0);
    part(new SphereGeometry(0.04 * H, 8, 6), look.skin, arm, 0, -0.2 * H, 0);
  }
  const head = node('head', torso, 0, 0.42 * H, 0);
  part(new SphereGeometry(0.17 * H, 16, 12), look.skin, head, 0, 0, 0);
  const hair = part(new SphereGeometry(0.182 * H, 16, 12, 0, Math.PI * 2, 0, Math.PI * (0.45 + look.fringe * 0.1)), look.hair, head, 0, 0.01 * H, -0.01 * H);
  hair.rotation.x = -0.25;
  if (look.skirt) part(new CapsuleGeometry(0.06 * H, 0.1 * H, 4, 8), look.hair, head, 0, -0.1 * H, -0.12 * H);
  return { root, geometries };
}

const times = [0, 0.25, 0.5, 0.75, 1];

function swing(name: string, period: number, leg: number, arm: number, knee: number, bob: number, H: number): AnimationClip {
  const t = times.map((x) => x * period);
  const sin = (ph: number) => times.map((x) => Math.sin((x + ph) * Math.PI * 2));
  const rot = (name: string, amp: number, ph: number, bias = 0) =>
    new QuaternionKeyframeTrack(`${name}.quaternion`, t, sin(ph).flatMap((v) => q(bias + v * amp).toArray()));
  const kneeAng = (ph: number) => rot(ph ? 'kneeR' : 'kneeL', knee, ph + 0.25, knee);
  const hipY = times.map((x) => 2 * 0.2 * H + Math.abs(Math.cos(x * Math.PI * 2)) * bob * H);
  return new AnimationClip(name, period, [
    rot('thighL', leg, 0), rot('thighR', leg, 0.5), rot('armL', arm, 0.5), rot('armR', arm, 0),
    kneeAng(0), kneeAng(0.5),
    new VectorKeyframeTrack('hips.position', t, hipY.flatMap((y) => [0, y, 0])),
  ]);
}

/** Code-driven loopable clips: idle (breathing sway), walk, run, sit. */
export function buildClips(id: CharacterId): AnimationClip[] {
  const H = LOOKS[id].height;
  const hipsY = 0.4 * H;
  const flat = (name: string, v: number[]) => new QuaternionKeyframeTrack(`${name}.quaternion`, [0, 1], [...v, ...v]);
  const idleT = [0, 1, 2];
  const idle = new AnimationClip('idle', 2, [
    new VectorKeyframeTrack('hips.position', idleT, [0, hipsY, 0, 0, hipsY - 0.006 * H, 0, 0, hipsY, 0]),
    new QuaternionKeyframeTrack('armL.quaternion', idleT, [...q(0.04, 0, 0.05).toArray(), ...q(-0.04, 0, 0.08).toArray(), ...q(0.04, 0, 0.05).toArray()]),
    new QuaternionKeyframeTrack('armR.quaternion', idleT, [...q(-0.04, 0, -0.05).toArray(), ...q(0.04, 0, -0.08).toArray(), ...q(-0.04, 0, -0.05).toArray()]),
  ]);
  const sitT = [0, 1];
  const sit = new AnimationClip('sit', 1, [
    new VectorKeyframeTrack('hips.position', sitT, [0, 0.2 * H, 0, 0, 0.2 * H, 0]),
    flat('thighL', q(-Math.PI / 2).toArray()), flat('thighR', q(-Math.PI / 2).toArray()),
    flat('kneeL', q(Math.PI / 2).toArray()), flat('kneeR', q(Math.PI / 2).toArray()),
    flat('armL', q(-0.35, 0, 0.1).toArray()), flat('armR', q(-0.35, 0, -0.1).toArray()),
  ]);
  return [idle, swing('walk', 1, 0.6, 0.5, 0.3, 0.012, H), swing('run', 0.6, 0.95, 0.9, 0.9, 0.03, H), sit];
}
