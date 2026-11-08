/** GLSL-compatible smoothstep. */
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Petal scale factor; TS mirror of `petalFade` in `petal.vert.glsl` (keep in sync).
 * `t` in [0,1] = lifecycle phase (spawn -> ground), `lateral` in [0,1] = normalised distance
 * from the spawn-volume axis. 0 at both lifecycle ends and at the lateral edge, so the
 * `fract` wrap never pops.
 */
export function petalFade(t: number, lateral: number): number {
  return smoothstep(0, 0.08, t) * (1 - smoothstep(0.88, 1, t)) * (1 - smoothstep(0.85, 1, lateral));
}
