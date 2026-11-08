import type { EventMap, WindState } from '../../core/types';

const TAU = Math.PI * 2;
/** Base direction oscillates around +x with this period (s) and amplitude (rad). */
export const WIND = {
  turnPeriod: 300,
  turnAmplitude: 0.6,
  strengthMin: 0.25,
  strengthMax: 0.5,
  gapMin: 12,
  gapMax: 30,
  durationMin: 3,
  durationMax: 6,
};

export type GustEmit = (e: EventMap['wind:gust']) => void;

/**
 * Global wind: slowly turning base direction, slow-noise strength in [0.25, 0.5] and gusts
 * every uniform(12,30) s lasting uniform(3,6) s with a sin^2 envelope. Writes `wind` in place.
 */
export function createWindController(rand: () => number): {
  update(dt: number, elapsed: number, wind: WindState, emit: GustEmit): void;
} {
  const uniform = (a: number, b: number): number => a + (b - a) * rand();
  // Random phases decorrelate the slow noise between sessions.
  const p1 = rand() * TAU, p2 = rand() * TAU, p3 = rand() * TAU, p4 = rand() * TAU;
  let untilGust = uniform(WIND.gapMin, WIND.gapMax);
  let gustAge = -1; // < 0 = no active gust
  let gustDuration = 0;
  let gustAmp = 0;

  return {
    update(dt, elapsed, wind, emit) {
      const turn =
        WIND.turnAmplitude *
        (0.75 * Math.sin((TAU * elapsed) / WIND.turnPeriod + p1) + 0.25 * Math.sin((TAU * elapsed) / 97 + p2));
      wind.direction.set(Math.cos(turn), Math.sin(turn));

      // Sum of incommensurate sines in [-1, 1] -> strength range.
      const n = 0.6 * Math.sin(elapsed * 0.071 + p3) + 0.4 * Math.sin(elapsed * 0.173 + p4);
      const mid = (WIND.strengthMin + WIND.strengthMax) / 2;
      wind.strength = mid + n * (WIND.strengthMax - WIND.strengthMin) / 2;

      untilGust -= dt;
      if (untilGust <= 0) {
        untilGust = uniform(WIND.gapMin, WIND.gapMax); // reset, not +=: gaps never drop below gapMin
        gustAge = 0;
        gustDuration = uniform(WIND.durationMin, WIND.durationMax);
        gustAmp = uniform(0.6, 1);
        emit({ strength: gustAmp, direction: { x: wind.direction.x, z: wind.direction.y }, duration: gustDuration });
      } else if (gustAge >= 0) {
        gustAge += dt;
      }

      if (gustAge >= 0 && gustAge < gustDuration) {
        const s = Math.sin((Math.PI * gustAge) / gustDuration);
        wind.gust = gustAmp * s * s;
      } else {
        gustAge = -1;
        wind.gust = 0;
      }
    },
  };
}
