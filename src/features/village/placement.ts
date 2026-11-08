/** Pure house placement and footprint constants (no THREE). */

/** House footprint half extents (m): hw along the local x axis, hd along local z. */
export const HOUSE = { hw: 3.6, hd: 2.8 } as const;

export interface HousePlacement { x: number; z: number; rot: number }
export interface PlacementRect { x0: number; x1: number; z0: number; z1: number }

const FACE_WEST = Math.PI / 2; // local +z maps to world +x; houses are built with their front at local -z
const ROT_JITTER = 0.25;
const MAX_ATTEMPTS = 5000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rejection-sampled house spots inside `rect` shrunk by `margin`, pairwise >= `minGap` apart. */
export function placeHouses(seed: number, rect: PlacementRect, count: number, minGap: number, margin: number): HousePlacement[] {
  const rand = mulberry32(seed);
  const out: HousePlacement[] = [];
  const w = rect.x1 - rect.x0 - 2 * margin;
  const d = rect.z1 - rect.z0 - 2 * margin;
  for (let i = 0; i < MAX_ATTEMPTS && out.length < count; i++) {
    const x = rect.x0 + margin + rand() * w;
    const z = rect.z0 + margin + rand() * d;
    const rot = FACE_WEST + (rand() * 2 - 1) * ROT_JITTER;
    if (out.every((h) => Math.hypot(h.x - x, h.z - z) >= minGap)) out.push({ x, z, rot });
  }
  return out;
}
