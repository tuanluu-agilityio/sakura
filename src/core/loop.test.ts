import { describe, it, expect } from 'vitest';
import { clampDt } from './loop';

describe('clampDt', () => {
  it('clamps large gaps to 0.1 s', () => {
    expect(clampDt(5)).toBe(0.1);
  });
  it('clamps negative values to 0', () => {
    expect(clampDt(-1)).toBe(0);
  });
  it('passes normal frame times through', () => {
    expect(clampDt(1 / 60)).toBeCloseTo(1 / 60);
  });
});
