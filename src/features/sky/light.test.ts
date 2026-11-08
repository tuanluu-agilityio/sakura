import { describe, it, expect } from 'vitest';
import { SUN_DIR, SHADOW, shadowFrustum } from './light';

describe('sky light constants', () => {
  it('SUN_DIR is unit length with a low late-afternoon elevation', () => {
    expect(SUN_DIR.length()).toBeCloseTo(1, 6);
    expect(SUN_DIR.y).toBeGreaterThan(0.3);
    expect(SUN_DIR.y).toBeLessThan(0.65); // brief says 0.6 but its own vector normalizes to y=0.611
  });
  it('shadow bias pins acne/peter-panning constants', () => {
    expect(SHADOW.bias).toBeLessThan(0);
    expect(SHADOW.normalBias).toBeGreaterThan(0);
  });
  it('shadowFrustum snaps the centre to a 1 m grid', () => {
    expect(shadowFrustum({ x: 0.4, z: 0.6 }, 60)).toEqual({ cx: 0, cz: 1 });
    expect(shadowFrustum({ x: -3.6, z: 7.2 }, 60)).toEqual({ cx: -4, cz: 7 });
    expect(shadowFrustum({ x: -0.4, z: 0.2 }, 60)).toEqual({ cx: 0, cz: 0 });
  });
});
