import { describe, it, expect } from 'vitest';
import { LAYOUT, distanceToPolyline } from './layout';

const { trees, path, bounds, stream, bridge, lanterns } = LAYOUT;

describe('distanceToPolyline', () => {
  it('measures to segment interior and clamps at ends', () => {
    const pts = [{ x: 0, z: 0 }, { x: 10, z: 0 }];
    expect(distanceToPolyline(5, 3, pts)).toBeCloseTo(3);
    expect(distanceToPolyline(-4, 3, pts)).toBeCloseTo(5);
  });
});

describe('LAYOUT', () => {
  it('has 12 trees and 6 lanterns', () => {
    expect(trees).toHaveLength(12);
    expect(lanterns).toHaveLength(6);
  });

  it('trees are >= 6 m apart', () => {
    for (const [i, a] of trees.entries())
      for (const b of trees.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(6);
  });

  it('trees are >= 3 m from the path and inside bounds', () => {
    for (const t of trees) {
      expect(distanceToPolyline(t.x, t.z, path)).toBeGreaterThanOrEqual(3);
      expect(t.x).toBeGreaterThanOrEqual(bounds.xMin);
      expect(t.x).toBeLessThanOrEqual(bounds.xMax);
      expect(t.z).toBeGreaterThanOrEqual(bounds.zMin);
      expect(t.z).toBeLessThanOrEqual(bounds.zMax);
    }
  });

  it('trees avoid mound, stream, railway, village, paddies', () => {
    const { mound, railway, village, paddies } = LAYOUT;
    for (const t of trees) {
      expect(Math.hypot(t.x - mound.x, t.z - mound.z)).toBeGreaterThan(mound.radius);
      expect(distanceToPolyline(t.x, t.z, stream.points)).toBeGreaterThan(stream.width / 2 + 2);
      expect(Math.abs(t.z - railway.z)).toBeGreaterThan(railway.width / 2 + 2);
      const inRect = (r: { xMin: number; xMax: number; zMin: number; zMax: number }): boolean =>
        t.x >= r.xMin && t.x <= r.xMax && t.z >= r.zMin && t.z <= r.zMax;
      expect(inRect(village)).toBe(false);
      expect(inRect(paddies)).toBe(false);
    }
  });

  it('bridge lies on path and stream', () => {
    expect(distanceToPolyline(bridge.x, bridge.z, path)).toBeLessThan(1);
    expect(distanceToPolyline(bridge.x, bridge.z, stream.points)).toBeLessThan(1);
  });

  it('lanterns sit 1.8 m off the path centreline', () => {
    for (const l of lanterns) expect(distanceToPolyline(l.x, l.z, path)).toBeCloseTo(1.8, 1);
  });

  it('train startOffset gives first approach eta of 6 s', () => {
    const { speed, trackHalf, startOffset } = LAYOUT.train;
    const eta = (LAYOUT.crossing.x + trackHalf) / speed - startOffset;
    expect(eta).toBeCloseTo(6, 6);
  });
});
