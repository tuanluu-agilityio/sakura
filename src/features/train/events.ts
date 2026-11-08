import { runEvents, TRAIN_CFG, type TrainCfg } from '../../shared/train-schedule';

export interface TrainEvent { type: 'approach' | 'pass' | 'clear'; direction: 1 | -1; eta: number }

const TYPES = ['approach', 'pass', 'clear'] as const;
const NONE: TrainEvent[] = [];

/**
 * Emits each run's approach/pass/clear exactly once, in order, even across time jumps.
 * Runs skipped by a jump of more than one run, and jumps backward (debug setTime), emit nothing and flags never reset;
 * that is acceptable because crossing state is derived from the schedule every frame, not from these events.
 */
export class TrainEventTracker {
  private readonly emitted = new Map<number, number>();
  /** Earliest time at which any event can next be due; frames before it return without allocating. */
  private nextDue = -Infinity;

  constructor(private readonly crossingX: number, private readonly cfg: TrainCfg = TRAIN_CFG) {}

  advance(t: number): TrainEvent[] {
    if (t < this.nextDue) return NONE;
    const { cfg } = this;
    const cur = Math.floor(Math.max(t + cfg.startOffset, 0) / cfg.period);
    this.emitted.delete(cur - 2);
    const due: { time: number; ev: TrainEvent }[] = [];
    let next = Infinity;
    for (let run = Math.max(0, cur - 1); run <= cur + 1; run++) {
      const e = runEvents(run, this.crossingX, cfg);
      const times = [e.tApproach, e.tPass, e.tClear];
      const direction: 1 | -1 = run % 2 === 0 ? 1 : -1;
      let n = this.emitted.get(run) ?? 0;
      while (n < 3) {
        const time = times[n] ?? Infinity;
        if (time > t) {
          next = Math.min(next, time);
          break;
        }
        due.push({ time, ev: { type: TYPES[n] ?? 'clear', direction, eta: n === 0 ? Math.max(0, e.tPass - t) : 0 } });
        n++;
      }
      this.emitted.set(run, n);
    }
    this.nextDue = next;
    if (due.length === 0) return NONE;
    return due.sort((a, b) => a.time - b.time).map((o) => o.ev);
  }
}
