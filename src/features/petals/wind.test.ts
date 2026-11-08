import { Vector2 } from 'three';
import { describe, expect, it } from 'vitest';
import type { EventMap, WindState } from '../../core/types';
import { createWindController } from './wind';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(seed: number) {
  const ctrl = createWindController(mulberry32(seed));
  const wind: WindState = { direction: new Vector2(1, 0), strength: 0, gust: 0 };
  const gusts: { at: number; e: EventMap['wind:gust'] }[] = [];
  const dt = 1 / 60;
  let elapsed = 0;
  let minGust = Infinity, maxGust = -Infinity, minS = Infinity, maxS = -Infinity, maxLenErr = 0;
  for (let i = 0; i < 600 * 60; i++) {
    elapsed += dt;
    ctrl.update(dt, elapsed, wind, (e) => gusts.push({ at: elapsed, e }));
    minGust = Math.min(minGust, wind.gust);
    maxGust = Math.max(maxGust, wind.gust);
    minS = Math.min(minS, wind.strength);
    maxS = Math.max(maxS, wind.strength);
    maxLenErr = Math.max(maxLenErr, Math.abs(wind.direction.length() - 1));
  }
  return { gusts, minGust, maxGust, minS, maxS, maxLenErr };
}

describe('createWindController', () => {
  for (const seed of [1, 42, 2026]) {
    it(`600 s at 60 fps behaves (seed ${seed})`, () => {
      const r = simulate(seed);
      expect(r.gusts.length).toBeGreaterThanOrEqual(20);
      expect(r.gusts.length).toBeLessThanOrEqual(50);
      for (let i = 1; i < r.gusts.length; i++) {
        const gap = r.gusts[i]!.at - r.gusts[i - 1]!.at;
        expect(gap).toBeGreaterThanOrEqual(12 - 1e-6);
        expect(gap).toBeLessThanOrEqual(30 + 1 / 60 + 1e-6);
      }
      expect(r.minGust).toBeGreaterThanOrEqual(0);
      expect(r.maxGust).toBeLessThanOrEqual(1);
      expect(r.maxGust).toBeGreaterThan(0.3);
      expect(r.maxLenErr).toBeLessThan(1e-6);
      expect(r.minS).toBeGreaterThanOrEqual(0.2);
      expect(r.maxS).toBeLessThanOrEqual(0.55);
    });
  }

  it('gust events carry a unit direction, strength in 0..1 and duration in [3, 6]', () => {
    for (const { e } of simulate(7).gusts) {
      expect(Math.hypot(e.direction.x, e.direction.z)).toBeCloseTo(1, 6);
      expect(e.strength).toBeGreaterThan(0);
      expect(e.strength).toBeLessThanOrEqual(1);
      expect(e.duration).toBeGreaterThanOrEqual(3);
      expect(e.duration).toBeLessThanOrEqual(6);
    }
  });
});
