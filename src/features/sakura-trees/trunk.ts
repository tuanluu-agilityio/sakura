import { BufferAttribute, BufferGeometry, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three';
import { mulberry32 } from './rng';

export interface TreeData {
  trunk: BufferGeometry;
  /** x, y, z, size per blossom cluster, in tree-local metres. */
  blossomAnchors: Float32Array;
  height: number;
  crownRadius: number;
}

interface Branch { curve: QuadraticBezierCurve3; r0: number; r1: number; level: number }

const DEPTH = 4; // levels 0..3
const LEN_RATIO = 0.7;
const RAD_RATIO = 0.62;
const SPLIT_MIN = (25 * Math.PI) / 180;
const SPLIT_MAX = (40 * Math.PI) / 180;
const BASE_LEN = 2.0; // unscaled trunk length (m)
const BASE_RADIUS = 0.26; // unscaled trunk radius (m)
const TUBULAR = [8, 6, 4, 3];
const RADIAL = [8, 6, 5, 4];
const CLUSTERS_PER_TIP = 33;
const OUTWARD = 0.8; // pulls children away from the trunk axis for a wide sakura crown
const BLOB = 1.6; // unscaled horizontal radius of a cluster blob around a tip

const UP = new Vector3(0, 1, 0);

/** Rotate `dir` by `angle` towards the perpendicular at azimuth `az`, biased outward from the axis. */
function splitDir(dir: Vector3, start: Vector3, az: number, angle: number): Vector3 {
  const ref = Math.abs(dir.y) > 0.99 ? new Vector3(1, 0, 0) : UP;
  const u = new Vector3().crossVectors(dir, ref).normalize();
  const v = new Vector3().crossVectors(dir, u).normalize();
  const p = u.multiplyScalar(Math.cos(az)).addScaledVector(v, Math.sin(az));
  const out = dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(p, Math.sin(angle));
  const radial = new Vector3(start.x, 0, start.z);
  if (radial.lengthSq() > 1e-6) out.addScaledVector(radial.normalize(), OUTWARD);
  if (out.y < 0.15) out.y = 0.15; // no drooping below horizontal
  return out.normalize();
}

function grow(rng: () => number, start: Vector3, dir: Vector3, len: number, radius: number, level: number, kids: number, out: Branch[]): void {
  const end = start.clone().addScaledVector(dir, len);
  const bend = splitDir(dir, start, rng() * Math.PI * 2, Math.PI / 2);
  const mid = start.clone().lerp(end, 0.5).addScaledVector(bend, len * 0.08 * rng());
  out.push({ curve: new QuadraticBezierCurve3(start, mid, end), r0: radius, r1: radius * RAD_RATIO, level });
  if (level === DEPTH - 1) return;
  const az0 = rng() * Math.PI * 2;
  for (let k = 0; k < kids; k++) {
    const az = az0 + (k * Math.PI * 2) / kids + (rng() - 0.5) * 0.6;
    const angle = SPLIT_MIN + (SPLIT_MAX - SPLIT_MIN) * rng();
    const at = level === 0 ? 0.93 : 0.8 + 0.2 * rng(); // start inside the parent to hide the joint
    const s = start.clone().lerp(end, at);
    grow(rng, s, splitDir(dir, s, az, angle), len * LEN_RATIO, radius * RAD_RATIO, level + 1, kids, out);
  }
}

/** One tapered tube per branch, merged by hand into a single indexed geometry. */
function mergeTubes(branches: Branch[]): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const centre = new Vector3();
  for (const b of branches) {
    const tub = TUBULAR[b.level] ?? 3;
    const rad = RADIAL[b.level] ?? 4;
    const tube = new TubeGeometry(b.curve, tub, b.r0, rad, false);
    const p = tube.getAttribute('position');
    const n = tube.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i <= tub; i++) {
      b.curve.getPointAt(i / tub, centre);
      const k = 1 + ((b.r1 / b.r0) - 1) * (i / tub); // taper r0 -> r1
      for (let j = 0; j <= rad; j++) {
        const v = i * (rad + 1) + j;
        pos.push(centre.x + (p.getX(v) - centre.x) * k, centre.y + (p.getY(v) - centre.y) * k, centre.z + (p.getZ(v) - centre.z) * k);
        nor.push(n.getX(v), n.getY(v), n.getZ(v));
      }
    }
    const ti = tube.index!;
    for (let i = 0; i < ti.count; i++) idx.push(base + ti.getX(i));
    tube.dispose();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Blossom clusters in blobs around each terminal branch, biased towards its tip. Branch curves are already scaled. */
function anchorsFor(rng: () => number, tips: Branch[], scale: number): Float32Array {
  const a = new Float32Array(tips.length * CLUSTERS_PER_TIP * 4);
  const p = new Vector3();
  let o = 0;
  for (const b of tips) {
    for (let c = 0; c < CLUSTERS_PER_TIP; c++) {
      b.curve.getPointAt(0.35 + 0.65 * Math.sqrt(rng()), p);
      const th = rng() * Math.PI * 2;
      const ph = Math.acos(2 * rng() - 1);
      const r = BLOB * Math.cbrt(rng());
      a[o++] = p.x + r * Math.sin(ph) * Math.cos(th) * scale;
      a[o++] = p.y + (0.25 + 0.45 * r * Math.cos(ph)) * scale;
      a[o++] = p.z + r * Math.sin(ph) * Math.sin(th) * scale;
      a[o++] = (0.5 + 0.4 * rng()) * scale;
    }
  }
  return a;
}

/** Deterministic sakura tree. `scale` >= 1.5 grows the hero variant (3 children per split, else 2). */
export function buildTree(seed: number, scale: number): TreeData {
  const rng = mulberry32(seed);
  const branches: Branch[] = [];
  const lean = new Vector3((rng() - 0.5) * 0.12, 1, (rng() - 0.5) * 0.12).normalize();
  grow(rng, new Vector3(0, 0, 0), lean, BASE_LEN * scale, BASE_RADIUS * scale, 0, scale >= 1.5 ? 3 : 2, branches);
  const tips = branches.filter((b) => b.level === DEPTH - 1);
  const blossomAnchors = anchorsFor(rng, tips, scale);
  let height = 0;
  let crownRadius = 0;
  for (let i = 0; i < blossomAnchors.length; i += 4) {
    height = Math.max(height, blossomAnchors[i + 1]! + blossomAnchors[i + 3]! * 0.5);
    crownRadius = Math.max(crownRadius, Math.hypot(blossomAnchors[i]!, blossomAnchors[i + 2]!));
  }
  // Keep the canopy off the lower trunk; lifted anchors are spread so the underside is not flat.
  const floor = height * 0.5;
  for (let i = 1; i < blossomAnchors.length; i += 4) {
    if (blossomAnchors[i]! < floor) blossomAnchors[i] = floor + rng() * 0.1 * height;
  }
  return { trunk: mergeTubes(branches), blossomAnchors, height, crownRadius };
}
