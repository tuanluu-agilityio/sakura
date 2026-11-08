import { describe, expect, it } from 'vitest';
import { TRAIN_CFG } from '../../shared/train-schedule';
import { TrainEventTracker, type TrainEvent } from './events';

const cfg = { ...TRAIN_CFG, startOffset: 0 };

function run(dt: number): TrainEvent[] {
  const tr = new TrainEventTracker(10, cfg);
  const out: TrainEvent[] = [];
  for (let t = 0; t <= 200; t += dt) out.push(...tr.advance(t));
  return out;
}

describe('TrainEventTracker', () => {
  it('emits 9 ordered events at 60 fps', () => {
    const ev = run(1 / 60);
    expect(ev.map((e) => e.type)).toEqual(['approach', 'pass', 'clear', 'approach', 'pass', 'clear', 'approach', 'pass', 'clear']);
    for (const e of ev.filter((x) => x.type === 'approach')) {
      expect(e.eta).toBeGreaterThan(9.9);
      expect(e.eta).toBeLessThanOrEqual(10);
    }
  });
  it('gives the same sequence at dt 0.1', () => {
    expect(run(0.1).map((e) => [e.type, e.direction])).toEqual(run(1 / 60).map((e) => [e.type, e.direction]));
  });
  it('does not duplicate across the period boundary', () => {
    const tr = new TrainEventTracker(10, cfg);
    tr.advance(0);
    tr.advance(40);
    expect(tr.advance(74.999)).toEqual([]);
    expect(tr.advance(75.001)).toEqual([]);
  });
  it('handles a jump', () => {
    const tr = new TrainEventTracker(10, cfg);
    expect(tr.advance(0)).toEqual([]);
    const ev = tr.advance(100);
    expect(ev.map((e) => e.type)).toEqual(['approach', 'pass', 'clear', 'approach']);
    expect(ev[3]?.direction).toBe(-1);
  });
  it('emits nothing for a repeated time', () => {
    const tr = new TrainEventTracker(10, cfg);
    tr.advance(50);
    expect(tr.advance(50)).toEqual([]);
  });
});
