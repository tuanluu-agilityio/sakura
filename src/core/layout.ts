// World layout constants (README "World layout"). Units: metres, +x east, -z north toward Fuji.
export interface XZ { x: number; z: number }
export interface TreeSpot extends XZ { scale: number }

const TRAIN_SPEED = 14;
const CROSSING_X = 10;
const TRACK_HALF = 400;
const FIRST_APPROACH_ETA = 6;

export const LAYOUT = {
  bounds: { xMin: -80, xMax: 80, zMin: -80, zMax: 80 },
  spawn: { x: 0, y: 0, z: 30, heading: 0 }, // heading 0 = facing -z (north)
  mainTree: { x: 0, z: 0 },
  mound: { x: 0, z: 0, radius: 9, height: 1.8 },
  bench: { x: 0, z: 3.2, facing: 'south' as const, length: 2 },
  // 12 secondary trees: path rows (first six) + scattered. >= 6 m apart, >= 3 m from path.
  trees: [
    { x: -7, z: 65, scale: 1.0 },
    { x: 7, z: 65, scale: 1.1 },
    { x: -7, z: 45, scale: 0.95 },
    { x: 7, z: 45, scale: 1.05 },
    { x: -12, z: 30, scale: 1.15 },
    { x: 8, z: 32, scale: 0.9 },
    { x: -30, z: 40, scale: 1.2 },
    { x: 35, z: 45, scale: 1.0 },
    { x: -50, z: -55, scale: 1.1 },
    { x: 30, z: -60, scale: 0.95 },
    { x: -25, z: -60, scale: 1.0 },
    { x: -60, z: 60, scale: 1.15 },
  ] as TreeSpot[],
  path: [
    { x: 0, z: 80 },
    { x: 0, z: 12 },
    { x: 10, z: -20 },
    { x: 10, z: -48 },
  ] as XZ[],
  pathWidth: 2.4,
  railway: { z: -40, embankmentHeight: 1.4, width: 6, xMin: -TRACK_HALF, xMax: TRACK_HALF },
  // Fences on both sides of the railway, except the crossing gap. Extent is x +-90 (just past the bounds).
  fences: { zs: [-37, -43], xMin: -90, xMax: 90, gap: { xMin: 8, xMax: 12 } },
  crossing: { x: CROSSING_X, z: -40 },
  stream: {
    points: [
      { x: -80, z: 15 },
      { x: -40, z: 8 },
      { x: 0, z: 18 },
      { x: 40, z: 10 },
      { x: 80, z: 20 },
    ] as XZ[],
    width: 3,
    depth: 0.6,
  },
  bridge: { x: 0, z: 18, length: 6, width: 2.4 }, // spans z (length along the path)
  village: { xMin: 25, xMax: 70, zMin: -25, zMax: 5, houses: 5 },
  paddies: { xMin: -70, xMax: -30, zMin: -30, zMax: -5 },
  torii: { x: -20, z: -15 },
  // 6 stone lanterns along the path, 1.8 m off its centreline (alternating sides).
  lanterns: [
    { x: 1.8, z: 70 },
    { x: -1.8, z: 56 },
    { x: 1.8, z: 42 },
    { x: -1.8, z: 30 },
    { x: 10.718, z: -16.263 },
    { x: 8.2, z: -32 },
  ] as XZ[],
  fuji: { x: 0, z: -900, baseRadius: 520, height: 330 },
  train: {
    cars: 3,
    carLength: 18,
    speed: TRAIN_SPEED,
    period: 75,
    firstDirection: 1 as 1 | -1,
    trackHalf: TRACK_HALF,
    // Front starts at x = -400 at train time 0 and reaches the crossing (x = 10) after (10 + 400) / 14 = 29.2857 s.
    // For the first approach eta at page load to be 6 s, shift train time by 29.2857 - 6 = 23.2857 s.
    startOffset: (CROSSING_X + TRACK_HALF) / TRAIN_SPEED - FIRST_APPROACH_ETA,
    closeBefore: 8, // crossing closes this many seconds before arrival
    openAfter: 3, // and opens this many seconds after the tail clears
  },
  intro: {
    from: { x: 18, y: 6, z: 22 },
    to: { x: 6, y: 2.5, z: 9 },
    lookAt: { x: 0, y: 2.3, z: 3.2 }, // bench
    duration: 14,
  },
};

/** Shortest distance from (x, z) to a polyline (open chain of segments). */
export function distanceToPolyline(x: number, z: number, pts: XZ[]): number {
  const first = pts[0];
  if (first && pts.length === 1) return Math.hypot(x - first.x, z - first.z);
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    best = Math.min(best, Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz)));
  }
  return best;
}
