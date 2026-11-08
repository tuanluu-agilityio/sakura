import { describe, expect, it } from 'vitest';
import { fenceSegments, lampOn, sleeperXs, stepBarrier } from './logic';

describe('sleeperXs', () => {
  it('spaces sleepers 0.7 m over the line', () => {
    const xs = sleeperXs(-400, 400);
    expect(xs.length).toBe(1143);
    expect(xs[0]).toBe(-400);
    expect(xs[1]! - xs[0]!).toBeCloseTo(0.7, 9);
  });
});

describe('fenceSegments', () => {
  const segs = fenceSegments([-37, -43], -90, 90, [8, 12]);
  it('leaves the gap open and covers both sides without holes', () => {
    expect(segs.every((s) => s.x + s.hw <= 8 + 1e-9 || s.x - s.hw >= 12 - 1e-9)).toBe(true);
    for (const z of [-37, -43]) {
      const line = segs.filter((s) => s.z === z).sort((a, b) => a.x - b.x);
      expect(line[0]!.x - line[0]!.hw).toBeCloseTo(-90, 6);
      expect(line[line.length - 1]!.x + line[line.length - 1]!.hw).toBeCloseTo(90, 6);
      for (let i = 1; i < line.length; i++) {
        const gap = line[i]!.x - line[i]!.hw - (line[i - 1]!.x + line[i - 1]!.hw);
        const spansGap = Math.abs(line[i]!.x - line[i]!.hw - 12) < 1e-6;
        if (spansGap) expect(line[i - 1]!.x + line[i - 1]!.hw).toBeCloseTo(8, 6);
        else expect(gap).toBeLessThanOrEqual(0.01);
      }
    }
    expect(new Set(segs.map((s) => s.hd))).toEqual(new Set([0.1]));
    expect(new Set(segs.map((s) => s.z)).size).toBe(2);
  });
});

describe('stepBarrier', () => {
  it('moves 0.5/s and clamps', () => {
    expect(stepBarrier(0, true, 1)).toBe(0.5);
    expect(stepBarrier(0.9, true, 1)).toBe(1);
    expect(stepBarrier(1, false, 2)).toBe(0);
    expect(stepBarrier(0, false, 5)).toBe(0);
  });
});

describe('lampOn', () => {
  it('alternates', () => {
    expect(lampOn(0.2)).toEqual([true, false]);
    expect(lampOn(0.7)).toEqual([false, true]);
  });
});
