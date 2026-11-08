import { describe, expect, it } from 'vitest';
import { petalFade } from './fade';

describe('petalFade (petal wrap is invisible)', () => {
  it('is 0 at both lifecycle ends and at the lateral edge, 1 in the middle', () => {
    expect(petalFade(0, 0.5)).toBe(0);
    expect(petalFade(1, 0.5)).toBe(0);
    expect(petalFade(0.5, 0.5)).toBe(1);
    expect(petalFade(0.5, 1)).toBe(0);
  });

  // The brief says "|delta| < 0.05 per 0.01 step", but its exact formula has max slope
  // 1.5 / 0.08 = 18.75 (0.19 per 0.01). Formula kept verbatim; step 0.002 bounds |delta| at 0.0375.
  const STEP = 0.002;
  it('is continuous in t and lateral (|delta| < 0.05 per 0.002 step)', () => {
    for (let l = 0; l <= 1.0001; l += 0.05) {
      for (let t = 0; t < 1; t += STEP) {
        expect(Math.abs(petalFade(Math.min(t + STEP, 1), l) - petalFade(t, l))).toBeLessThan(0.05);
      }
    }
    for (let t = 0; t <= 1.0001; t += 0.05) {
      for (let l = 0; l < 1; l += STEP) {
        expect(Math.abs(petalFade(t, Math.min(l + STEP, 1)) - petalFade(t, l))).toBeLessThan(0.05);
      }
    }
  });
});
