import { describe, it, expect } from 'vitest';
import { FpsMonitor, QUALITY_PROFILES, pickInitialQuality, resolveQuality } from './quality';

describe('QUALITY_PROFILES', () => {
  it('matches the README table', () => {
    expect(QUALITY_PROFILES.low).toEqual({ level: 'low', petals: 1500, shadowMapSize: 1024, bloom: false, maxPixelRatio: 1, viewDistance: 220, grassDensity: 0.35 });
    expect(QUALITY_PROFILES.medium).toEqual({ level: 'medium', petals: 4000, shadowMapSize: 2048, bloom: true, maxPixelRatio: 1.5, viewDistance: 320, grassDensity: 0.7 });
    expect(QUALITY_PROFILES.high).toEqual({ level: 'high', petals: 8000, shadowMapSize: 4096, bloom: true, maxPixelRatio: 2, viewDistance: 450, grassDensity: 1.0 });
  });
});

describe('pickInitialQuality', () => {
  it('starts low on touch devices', () => {
    expect(pickInitialQuality({ touch: true, cores: 8 })).toBe('low');
  });
  it('starts low with <= 4 cores', () => {
    expect(pickInitialQuality({ touch: false, cores: 4 })).toBe('low');
  });
  it('starts medium on capable desktops', () => {
    expect(pickInitialQuality({ touch: false, cores: 8 })).toBe('medium');
  });
});

describe('resolveQuality', () => {
  it('URL param wins and disables auto', () => {
    expect(resolveQuality({ url: '?quality=high', setting: 'auto', auto: 'low' })).toEqual({ level: 'high', auto: false });
  });
  it('manual setting beats auto', () => {
    expect(resolveQuality({ url: '', setting: 'medium', auto: 'low' })).toEqual({ level: 'medium', auto: false });
  });
  it('falls back to auto', () => {
    expect(resolveQuality({ url: '', setting: 'auto', auto: 'low' })).toEqual({ level: 'low', auto: true });
  });
  it('treats a non-level setting as auto', () => {
    const setting = 'ultra' as unknown as 'auto';
    expect(resolveQuality({ url: '', setting, auto: 'low' })).toEqual({ level: 'low', auto: true });
  });
  it('ignores invalid URL values', () => {
    expect(resolveQuality({ url: '?quality=ultra', setting: 'auto', auto: 'medium' })).toEqual({ level: 'medium', auto: true });
  });
});

function run(m: FpsMonitor, dt: number, seconds: number): ('downgrade' | null)[] {
  const out: ('downgrade' | null)[] = [];
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i++) out.push(m.sample(dt));
  return out;
}

describe('FpsMonitor', () => {
  it('downgrades once after 5 s at 40 fps on desktop, then waits a full window', () => {
    const first = run(new FpsMonitor(false), 1 / 40, 6);
    expect(first.filter((r) => r === 'downgrade')).toHaveLength(1);
    // Window resets on downgrade: the following 4.9 s must stay quiet.
    const m = new FpsMonitor(false);
    let guard = 0;
    while (m.sample(1 / 40) !== 'downgrade') if (++guard > 1000) throw new Error('no downgrade');
    expect(run(m, 1 / 40, 4.9).every((r) => r === null)).toBe(true);
  });
  it('never downgrades at 60 fps', () => {
    const m = new FpsMonitor(false);
    expect(run(m, 1 / 60, 6).every((r) => r === null)).toBe(true);
  });
  it('uses the 28 fps threshold on touch devices', () => {
    expect(run(new FpsMonitor(true), 1 / 40, 6).every((r) => r === null)).toBe(true);
    expect(run(new FpsMonitor(true), 1 / 20, 6).filter((r) => r === 'downgrade')).toHaveLength(1);
  });
});
