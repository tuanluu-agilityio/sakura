import { describe, it, expect } from 'vitest';
import { sumBudget, normalizePath, BUDGET_BYTES } from './budget.ts';

describe('sumBudget', () => {
  it('uses a 12 MiB threshold', () => {
    expect(BUDGET_BYTES).toBe(12 * 1024 * 1024);
  });
  it('excludes audio except music-01', () => {
    const files = [
      { path: 'assets/a.js', gzip: 100 },
      { path: 'assets/audio/music-01.mp3', gzip: 50 },
      { path: 'assets/audio/music-02.mp3', gzip: 1000 },
      { path: 'assets/audio/rain.ogg', gzip: 1000 },
    ];
    expect(sumBudget(files)).toBe(150);
  });
  it('keeps only the first music-01.* match', () => {
    const files = [
      { path: 'assets/audio/music-01.ogg', gzip: 70 },
      { path: 'assets/audio/music-01.mp3', gzip: 50 },
    ];
    expect(sumBudget(files)).toBe(50);
  });
  it('exceeds the threshold when non-audio files are too large', () => {
    const files = [{ path: 'assets/big.bin', gzip: BUDGET_BYTES + 1 }];
    expect(sumBudget(files)).toBeGreaterThan(BUDGET_BYTES);
  });
  it('handles Windows paths', () => {
    expect(normalizePath('assets\\audio\\music-01.mp3')).toBe('assets/audio/music-01.mp3');
    const files = [
      { path: 'assets\\audio\\music-01.mp3', gzip: 5 },
      { path: 'assets\\audio\\music-02.mp3', gzip: 500 },
    ];
    expect(sumBudget(files)).toBe(5);
  });
});
