import { runEvents, TRAIN_CFG, type TrainCfg } from '../../shared/train-schedule';

export interface TrainEvent { type: 'approach' | 'pass' | 'clear'; direction: 1 | -1; eta: number }


/** Emits each run's approach/pass/clear exactly once, in order, even across time jumps. */
export class TrainEventTracker {
  private readonly emitted = new Map<number, number>();

  constructor(private readonly crossingX: number, private readonly cfg: TrainCfg = TRAIN_CFG) {}

  advance(t: number): TrainEvent[] {
    const { cfg } = this;
    const cur = Math.floor(Math.max(t + cfg.startOffset, 0) / cfg.period);
    const out: { time: number; ev: TrainEvent }[] = [];
    for (let run = Math.max(0, cur - 1); run <= cur; run++) {
      const e = runEvents(run, this.crossingX, cfg);
      const steps = [
        { type: 'approach', time: e.tApproach },
        { type: 'pass', time: e.tPass },
        { type: 'clear', time: e.tClear },
      ] as const;
      const direction: 1 | -1 = run % 2 === 0 ? 1 : -1;
      let n = this.emitted.get(run) ?? 0;
      for (let step = steps[n]; step && step.time <= t; step = steps[++n]) {
        out.push({ time: step.time, ev: { type: step.type, direction, eta: step.type === 'approach' ? Math.max(0, e.tPass - t) : 0 } });
      }
      this.emitted.set(run, n);
    }
    return out.sort((a, b) => a.time - b.time).map((o) => o.ev);
  }
}
