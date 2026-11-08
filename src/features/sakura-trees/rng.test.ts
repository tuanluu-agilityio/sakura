import { describe, it, expect } from 'vitest';
import { mulberry32 } from './rng';

describe('mulberry32', () => {
  it('produces fixed golden values for seed 1', () => {
    const r = mulberry32(1);
    expect(r()).toBeCloseTo(0.6270739405881613, 12);
    expect(r()).toBeCloseTo(0.002735721180215478, 12);
    expect(r()).toBeCloseTo(0.5274470399599522, 12);
  });

  it('stays within [0, 1) and differs per seed', () => {
    const a = mulberry32(7);
    const b = mulberry32(8);
    let same = 0;
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      if (x === b()) same++;
    }
    expect(same).toBe(0);
  });
});
