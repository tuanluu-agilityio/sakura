import { Euler, Quaternion, type Object3D } from 'three';

const SKIP = /(end|top|nub)/i;

/** First node, breadth-first, named like a head and not like a head-end/top helper. */
export function findHeadBone(root: Object3D): Object3D | null {
  const queue: Object3D[] = [root];
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i]!;
    if (/head/i.test(n.name) && !SKIP.test(n.name)) return n;
    queue.push(...n.children);
  }
  return null;
}

export const nextLookDelay = (rng: () => number): number => 6 + 6 * rng();

const smooth = (x: number): number => x * x * (3 - 2 * x);

/** 0 at 0 and dur, 1 at dur/2: smoothstep up over 0..0.3dur, hold, down over 0.7dur..dur. */
export function envelope(t: number, dur: number): number {
  const u = t / dur;
  if (u <= 0 || u >= 1) return 0;
  if (u < 0.3) return smooth(u / 0.3);
  if (u > 0.7) return smooth((1 - u) / 0.3);
  return 1;
}

const euler = new Euler();
export function headDelta(pitch: number, yaw: number, out: Quaternion = new Quaternion()): Quaternion {
  return out.setFromEuler(euler.set(pitch, yaw, 0, 'YXZ'));
}

export interface HeadAnimator { captureRest(): void; update(dt: number, partnerSide: 1 | -1): void }

interface LookEvent { pitch: number; yawPerSide: number; dur: number }

export function createHeadAnimator(bone: Object3D | null, rng: () => number, startDelay = 0): HeadAnimator {
  const rest = new Quaternion();
  const delta = new Quaternion();
  let warned = false;
  let wait = nextLookDelay(rng) + startDelay;
  let event: LookEvent | null = null;
  let t = 0;
  return {
    captureRest() { if (bone) rest.copy(bone.quaternion); },
    update(dt, partnerSide) {
      if (!bone) {
        if (!warned) { warned = true; console.debug('[couple] no head bone, skipping head animation'); }
        return;
      }
      if (event) {
        t += dt;
        if (t >= event.dur) { event = null; wait = nextLookDelay(rng); }
      } else {
        wait -= dt;
        if (wait <= 0) {
          event = rng() < 0.7 ? { pitch: -0.35, yawPerSide: 0, dur: 3 } : { pitch: 0, yawPerSide: 0.5, dur: 4 };
          t = 0;
        }
      }
      bone.quaternion.copy(rest);
      if (event) {
        const e = envelope(t, event.dur);
        bone.quaternion.multiply(headDelta(event.pitch * e, event.yawPerSide * partnerSide * e, delta));
      }
    },
  };
}
