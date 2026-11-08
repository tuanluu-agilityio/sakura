import { LAYOUT } from '../../core/layout';
import type { ColliderRegistry } from '../../core/types';
import { smoothstep, valueNoise } from './height';

export const HEDGE = { half: 82, spacing: 3, radius: 1.6 };

/** Square (Chebyshev) distance from the origin. */
export function ringDistance(x: number, z: number): number {
  return Math.max(Math.abs(x), Math.abs(z));
}

/** Hills 6-12 m high from 82 m outward; open along the railway so the line stays visible. */
export function hillHeight(x: number, z: number): number {
  const env = smoothstep(HEDGE.half, 100, ringDistance(x, z));
  if (env === 0) return 0;
  const rail = smoothstep(5, 14, Math.abs(z - LAYOUT.railway.z));
  return env * rail * (6 + 6 * valueNoise(x / 30 + 11.3, z / 30 - 4.7));
}

/** Closed ring of circle colliders every 3 m. Returns a disposer that removes them. */
export function createHedgeColliders(colliders: ColliderRegistry): () => void {
  const ids: string[] = [];
  const h = HEDGE.half;
  const n = Math.ceil((2 * h) / HEDGE.spacing);
  for (let i = 0; i < n; i++) {
    const t = -h + (i * 2 * h) / n;
    ids.push(
      colliders.add({ kind: 'circle', x: t, z: -h, r: HEDGE.radius }),
      colliders.add({ kind: 'circle', x: h, z: t, r: HEDGE.radius }),
      colliders.add({ kind: 'circle', x: -t, z: h, r: HEDGE.radius }),
      colliders.add({ kind: 'circle', x: -h, z: -t, r: HEDGE.radius }),
    );
  }
  return () => { for (const id of ids) colliders.remove(id); ids.length = 0; };
}
