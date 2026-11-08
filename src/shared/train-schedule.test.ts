import { describe, expect, it } from 'vitest';
import { crossingClosed, runEvents, TRAIN_CFG, trainStateAt } from './train-schedule';

const cfg = { ...TRAIN_CFG, startOffset: 0 };

describe('trainStateAt', () => {
  it('starts at the west end heading east', () => {
    expect(trainStateAt(0, cfg)).toEqual({ active: true, direction: 1, frontX: -400, run: 0 });
  });
  it('reaches the crossing at 410/14 s', () => {
    expect(trainStateAt(410 / 14, cfg).frontX).toBeCloseTo(10, 6);
  });
  it('alternates direction per run', () => {
    expect(trainStateAt(75, cfg)).toMatchObject({ direction: -1, frontX: 400, run: 1 });
    expect(trainStateAt(150, cfg).direction).toBe(1);
  });
  it('deactivates once the tail has left the track', () => {
    expect(trainStateAt(61, cfg).active).toBe(true);
    expect(trainStateAt(61.5, cfg).active).toBe(false);
  });
  it('clamps negative time', () => {
    expect(trainStateAt(-5, cfg)).toEqual(trainStateAt(0, cfg));
  });
  it('applies startOffset', () => {
    expect(trainStateAt(0)).toEqual(trainStateAt(TRAIN_CFG.startOffset, cfg));
  });
});

describe('runEvents', () => {
  it('computes run 0 times', () => {
    const e = runEvents(0, 10, cfg);
    expect(e.tApproach).toBeCloseTo(19.2857, 3);
    expect(e.tClose).toBeCloseTo(21.2857, 3);
    expect(e.tPass).toBeCloseTo(29.2857, 3);
    expect(e.tClear).toBeCloseTo(33.4286, 3);
    expect(e.tOpen).toBeCloseTo(36.4286, 3);
  });
  it('computes run 1 (westbound)', () => {
    const e = runEvents(1, 10, cfg);
    expect(e.tPass).toBeCloseTo(102.857, 3);
    expect(e.tClear).toBeCloseTo(107, 3);
  });
  it('returns elapsed coordinates with the real offset', () => {
    expect(runEvents(0, 10).tPass).toBeCloseTo(6, 3);
  });
});

describe('crossingClosed', () => {
  it('follows tClose..tOpen', () => {
    expect(crossingClosed(21.2, 10, cfg)).toBe(false);
    expect(crossingClosed(21.3, 10, cfg)).toBe(true);
    expect(crossingClosed(36.4, 10, cfg)).toBe(true);
    expect(crossingClosed(36.5, 10, cfg)).toBe(false);
    expect(crossingClosed(100, 10, cfg)).toBe(true);
  });
});
