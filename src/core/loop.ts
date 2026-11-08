export function clampDt(raw: number): number {
  return Math.min(Math.max(raw, 0), 0.1);
}

/** requestAnimationFrame loop; dt in seconds (clamped), elapsed = sum of clamped dts. */
export function createLoop(onFrame: (dt: number, elapsed: number) => void): { start(): void; stop(): void } {
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let running = false;

  const tick = (now: number): void => {
    if (!running) return;
    const dt = clampDt((now - last) / 1000);
    last = now;
    elapsed += dt;
    onFrame(dt, elapsed);
    raf = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
