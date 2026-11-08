import { Box3 } from 'three';
import { describe, expect, it } from 'vitest';
import { buildFujiGeometry, fujiRadiusAt } from './geometry';

const hash = (a: ArrayLike<number>) => {
  let h = 0;
  for (let i = 0; i < a.length; i++) h = (Math.imul(h, 31) + Math.round(a[i]! * 1000)) | 0;
  return h;
};

describe('fuji geometry', () => {
  it('base radius is ~520', () => {
    expect(Math.abs(fujiRadiusAt(0, 0) - 520)).toBeLessThanOrEqual(8);
  });
  it('radius strictly decreases with height', () => {
    for (const a of [0, 1, 2.5, 4, 5.5]) {
      let prev = Infinity;
      for (let i = 0; i < 20; i++) {
        const r = fujiRadiusAt(i / 20, a);
        expect(r).toBeLessThan(prev);
        prev = r;
      }
    }
  });
  const g = buildFujiGeometry(1);
  it('has height 330 and bounded extent', () => {
    const b = new Box3().setFromBufferAttribute(g.getAttribute('position') as never);
    expect(Math.abs(b.max.y - b.min.y - 330)).toBeLessThanOrEqual(1);
    expect(Math.max(b.max.x, b.max.z, -b.min.x, -b.min.z)).toBeLessThanOrEqual(560);
  });
  it('is deterministic per seed', () => {
    expect(hash(buildFujiGeometry(1).getAttribute('position').array)).toBe(hash(g.getAttribute('position').array));
  });
  it('stays under 7000 vertices', () => {
    expect(g.getAttribute('position').count).toBeLessThanOrEqual(7000);
  });
});
