import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../core/layout';
import { clampDt } from '../core/loop';
import { BARRIER_SPEED, lampAOn, lampOn, stepBarrier } from '../features/railway/logic';
import { TRAIN_CFG, crossingClosed, runEvents, trainStateAt } from '../shared/train-schedule';

const X = LAYOUT.crossing.x;
const TRAVEL = 1 / BARRIER_SPEED; // seconds for a full arm sweep
/** Brief: arms down <= 2 s after close. A frame-stepped sweep can land up to one frame later. */
const ARMS_DOWN_SPEC = 2;
const MAX_DT = clampDt(Infinity); // slowest frame the loop can deliver
const FRAMES = [1 / 60, 1 / 30, MAX_DT];
const PHASES = [0, 0.25, 0.5, 0.999]; // where the first frame lands inside a dt
const RUNS = [1, 2]; // run 1 heads -x, run 2 heads +x
const EPS = 1e-6;

/** The railway update loop, without three: returns the barrier value after every frame. */
function simulate(from: number, to: number, dt: number, start: number): { t: number; a: number }[] {
  const out: { t: number; a: number }[] = [];
  let a = start;
  const n = Math.ceil((to - from) / dt);
  for (let i = 0; i <= n; i++) {
    const t = from + i * dt;
    a = stepBarrier(a, crossingClosed(t, X), dt);
    out.push({ t, a });
  }
  return out;
}

describe('M2 crossing timing', () => {
  for (const run of RUNS) {
    const e = runEvents(run, X);

    for (const dt of FRAMES) {
      for (const phase of PHASES) {
        const label = `run ${run}, dt ${dt.toFixed(3)}, phase ${phase}`;

        it(`has the arms fully down within the 2 s spec + one frame of closing (${label})`, () => {
          const frames = simulate(e.tClose - 1 + phase * dt, e.tClose + TRAVEL + 1, dt, 0);
          for (const f of frames) if (f.t < e.tClose) expect(f.a).toBe(0);
          const down = frames.find((f) => f.a === 1);
          expect(down).toBeDefined();
          expect(down!.t - e.tClose).toBeLessThanOrEqual(ARMS_DOWN_SPEC + dt + EPS);
        });

        it(`holds the arms down until open, then starts rising (${label})`, () => {
          const frames = simulate(e.tOpen - 1 + phase * dt, e.tOpen + TRAVEL + 1, dt, 1);
          for (const f of frames) if (f.t < e.tOpen) expect(f.a).toBe(1);
          const first = frames.find((f) => f.t >= e.tOpen)!;
          expect(first.a).toBeLessThan(1);
          expect(frames.at(-1)!.a).toBe(0);
        });
      }
    }

    it(`puts the train front at the crossing at pass time (run ${run})`, () => {
      const s = trainStateAt(e.tPass, TRAIN_CFG);
      expect(s.active).toBe(true);
      expect(s.run).toBe(run);
      expect(s.frontX).toBeCloseTo(X, 6);
    });

    it(`closes before the pass and opens after the clear by the LAYOUT margins (run ${run})`, () => {
      expect(e.tPass - e.tClose).toBeCloseTo(LAYOUT.train.closeBefore, 6);
      expect(e.tOpen - e.tClear).toBeCloseTo(LAYOUT.train.openAfter, 6);
    });
  }

  it('alternates the lamps every half second, never both lit', () => {
    for (let i = 0; i < 40; i++) {
      const t = i * 0.5 + 0.25;
      const [a, b] = lampOn(t);
      expect(a).toBe(i % 2 === 0);
      expect(b).toBe(!a);
      expect(lampAOn(t)).toBe(a);
    }
  });
});
