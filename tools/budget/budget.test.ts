import { describe, it, expect } from 'vitest';
import { sumBudget, BUDGET_BYTES } from './budget.ts';

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
});
