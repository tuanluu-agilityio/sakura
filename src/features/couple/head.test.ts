import { describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { createHeadAnimator, envelope, findHeadBone, nextLookDelay } from './head';

function chain(...names: string[]): Object3D {
  const nodes = names.map((n) => Object.assign(new Object3D(), { name: n }));
  nodes.forEach((n, i) => { if (i > 0) nodes[i - 1]!.add(n); });
  return nodes[0]!;
}

describe('findHeadBone', () => {
  it('finds Head, skipping Head_end', () => {
    const root = chain('Hips', 'Spine', 'Neck', 'Head', 'Head_end');
    expect(findHeadBone(root)?.name).toBe('Head');
  });
  it('finds mixamorigHead', () => {
    expect(findHeadBone(chain('mixamorigHips', 'mixamorigHead'))?.name).toBe('mixamorigHead');
  });
  it('finds the chibi lowercase head', () => {
    expect(findHeadBone(chain('root', 'hips', 'torso', 'head'))?.name).toBe('head');
  });
  it('returns null without a match', () => {
    expect(findHeadBone(chain('Hips', 'Spine', 'Head_end'))).toBeNull();
  });
});

describe('nextLookDelay', () => {
  it('spans 6..12 s', () => {
    expect(nextLookDelay(() => 0)).toBe(6);
    expect(nextLookDelay(() => 0.999)).toBeLessThan(12);
  });
});

describe('envelope', () => {
  it('is 0 at the ends and 1 in the middle', () => {
    expect(envelope(0, 4)).toBe(0);
    expect(envelope(2, 4)).toBe(1);
    expect(envelope(4, 4)).toBe(0);
  });
  it('rises monotonically on [0, 1.2]', () => {
    let prev = -1;
    for (let t = 0; t <= 1.2; t += 0.05) {
      const v = envelope(t, 4);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('createHeadAnimator', () => {
  it('is a safe no-op with a null bone', () => {
    const a = createHeadAnimator(null, () => 0.5);
    expect(() => { a.captureRest(); a.update(1, 1); }).not.toThrow();
  });
  it('rotates the bone during a look and returns to rest', () => {
    const bone = new Object3D();
    const a = createHeadAnimator(bone, () => 0.1);
    a.captureRest();
    for (let i = 0; i < 80; i++) a.update(0.1, 1); // 8 s: delay 6.6 s, look underway
    const mid = bone.quaternion.clone();
    for (let i = 0; i < 30; i++) a.update(0.1, 1); // past the end of the 3 s event
    expect(mid.angleTo(new Object3D().quaternion)).toBeGreaterThan(0);
    expect(bone.quaternion.angleTo(new Object3D().quaternion)).toBeLessThan(1e-6);
  });
});
