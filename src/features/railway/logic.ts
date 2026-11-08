// Pure railway helpers (no three). Units: metres, seconds.

/** Sleeper x positions from xMin to xMax inclusive-ish, every `spacing`. */
export function sleeperXs(xMin: number, xMax: number, spacing = 0.7): number[] {
  const n = Math.floor((xMax - xMin) / spacing + 1e-9);
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(xMin + i * spacing);
  return out;
}

export interface FenceSeg { x: number; z: number; hw: number; hd: number }

/** Box segments (<= `seg` long) along each fence line over [xFrom, xTo], leaving the `gap` open. */
export function fenceSegments(lines: number[], xFrom: number, xTo: number, gap: [number, number], seg = 4): FenceSeg[] {
  const out: FenceSeg[] = [];
  const spans: [number, number][] = [[xFrom, Math.min(gap[0], xTo)], [Math.max(gap[1], xFrom), xTo]];
  for (const z of lines) {
    for (const [a, b] of spans) {
      if (b - a <= 1e-9) continue;
      const n = Math.ceil((b - a) / seg - 1e-9);
      const len = (b - a) / n;
      for (let i = 0; i < n; i++) out.push({ x: a + (i + 0.5) * len, z, hw: len / 2, hd: 0.1 });
    }
  }
  return out;
}

export const BARRIER_SPEED = 0.5; // fraction per second (2 s full travel)

/** Barrier angle factor a in [0,1]; 1 = fully down. */
export function stepBarrier(a: number, closed: boolean, dt: number): number {
  const next = a + (closed ? 1 : -1) * BARRIER_SPEED * dt;
  return Math.min(1, Math.max(0, next));
}

/** Alternating warning lamps, 1 Hz. */
export function lampOn(elapsed: number): [boolean, boolean] {
  const on = lampAOn(elapsed);
  return [on, !on];
}

/** Allocation-free form of `lampOn` for per-frame use: true = lamp A on (lamp B is the opposite). */
export function lampAOn(elapsed: number): boolean {
  return elapsed % 1 < 0.5;
}
