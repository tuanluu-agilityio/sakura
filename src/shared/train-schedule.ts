import { LAYOUT } from '../core/layout';

/** Pure train timetable (no three). Consumed by train, railway, audio and intro. */
export interface TrainCfg {
  cars: number;
  carLength: number;
  speed: number;
  period: number;
  xMin: number;
  xMax: number;
  /** Timetable is evaluated at `t + startOffset`; run events are returned in elapsed coordinates. */
  startOffset: number;
}

export const TRAIN_CFG: TrainCfg = {
  cars: LAYOUT.train.cars,
  carLength: LAYOUT.train.carLength,
  speed: LAYOUT.train.speed,
  period: LAYOUT.train.period,
  xMin: -LAYOUT.train.trackHalf,
  xMax: LAYOUT.train.trackHalf,
  startOffset: LAYOUT.train.startOffset,
};

export interface TrainState { active: boolean; direction: 1 | -1; frontX: number; run: number }
export interface RunEvents { tApproach: number; tClose: number; tPass: number; tClear: number; tOpen: number }

const APPROACH_BEFORE = 10;
const CLOSE_BEFORE = 8;
const CLEAR_ZONE = 4;
const OPEN_AFTER = 3;

export function trainStateAt(t: number, cfg: TrainCfg = TRAIN_CFG): TrainState {
  const tt = Math.max(t + cfg.startOffset, 0);
  const run = Math.floor(tt / cfg.period);
  const direction: 1 | -1 = run % 2 === 0 ? 1 : -1;
  const travelled = cfg.speed * (tt - run * cfg.period);
  const frontX = direction === 1 ? cfg.xMin + travelled : cfg.xMax - travelled;
  const active = travelled <= cfg.xMax - cfg.xMin + cfg.cars * cfg.carLength;
  return { active, direction, frontX, run };
}

export function runEvents(run: number, crossingX: number, cfg: TrainCfg = TRAIN_CFG): RunEvents {
  const dir = run % 2 === 0 ? 1 : -1;
  const len = cfg.cars * cfg.carLength;
  const base = run * cfg.period - cfg.startOffset;
  const tPass = base + (dir === 1 ? crossingX - cfg.xMin : cfg.xMax - crossingX) / cfg.speed;
  const clearDist = dir === 1 ? crossingX + CLEAR_ZONE + len - cfg.xMin : cfg.xMax - (crossingX - CLEAR_ZONE - len);
  const tClear = base + clearDist / cfg.speed;
  return { tApproach: tPass - APPROACH_BEFORE, tClose: tPass - CLOSE_BEFORE, tPass, tClear, tOpen: tClear + OPEN_AFTER };
}

export function crossingClosed(t: number, crossingX: number, cfg: TrainCfg = TRAIN_CFG): boolean {
  const run = Math.floor(Math.max(t + cfg.startOffset, 0) / cfg.period);
  const e = runEvents(run, crossingX, cfg);
  return t >= e.tClose && t < e.tOpen;
}
