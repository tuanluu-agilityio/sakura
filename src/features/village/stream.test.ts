import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../core/layout';
import type { Collider } from '../../core/types';
import { WATER_Y, buildRibbon, createStreamMaterial, streamColliders } from './stream';

const { points, width } = LAYOUT.stream;
const bridge = LAYOUT.bridge;

function inside(c: Collider, x: number, z: number): boolean {
  if (c.kind === 'circle') return Math.hypot(x - c.x, z - c.z) <= c.r;
  const dx = x - c.x;
  const dz = z - c.z;
  const lx = dx * Math.cos(c.rot) - dz * Math.sin(c.rot);
  const lz = dx * Math.sin(c.rot) + dz * Math.cos(c.rot);
  return Math.abs(lx) <= c.hw && Math.abs(lz) <= c.hd;
}
const covered = (cs: Collider[], x: number, z: number): boolean => cs.some((c) => inside(c, x, z));

function centreZ(x: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (x >= a.x && x <= b.x) return a.z + ((b.z - a.z) * (x - a.x)) / (b.x - a.x);
  }
  throw new Error('x outside stream');
}

describe('buildRibbon', () => {
  const r = buildRibbon(points, width, WATER_Y, 2);
  it('is flat at WATER_Y', () => {
    for (let i = 1; i < r.positions.length; i += 3) expect(r.positions[i]).toBe(Math.fround(WATER_Y));
  });
  it('has uv.y non-decreasing, uv.x in 0..1', () => {
    let prev = -1;
    for (let i = 0; i < r.uvs.length; i += 4) {
      expect(r.uvs[i + 1]).toBeGreaterThanOrEqual(prev);
      prev = r.uvs[i + 1]!;
      expect(r.uvs[i]).toBe(0);
      expect(r.uvs[i + 2]).toBe(1);
    }
  });
  it('uses 6 indices per quad', () => {
    const quads = r.positions.length / 3 / 2 - 1;
    expect(r.indices.length).toBe(quads * 6);
  });
});

describe('water material and level', () => {
  it('avoids z-fighting and blends after opaque geometry', () => {
    const m = createStreamMaterial();
    expect(m.polygonOffset).toBe(true);
    expect(m.transparent).toBe(true);
    expect(m.depthWrite).toBe(false);
  });
  it('sits between bed and bank', () => {
    expect(WATER_Y).toBeGreaterThan(-0.6 + 0.3);
    expect(WATER_Y).toBeLessThan(0 - 0.1);
  });
});

describe('streamColliders', () => {
  const cs = streamColliders(points, width, bridge);
  it('blocks the stream and opens the bridge gap', () => {
    expect(covered(cs, 10, centreZ(10))).toBe(true);
    expect(covered(cs, bridge.x, bridge.z)).toBe(false);
    expect(covered(cs, bridge.x - 1.1, bridge.z)).toBe(false);
    expect(covered(cs, bridge.x + 1.1, bridge.z)).toBe(false);
  });
  it('uses chunk-sized boxes', () => {
    for (const c of cs) {
      if (c.kind !== 'box') throw new Error('box expected');
      expect(c.hd).toBeCloseTo(0.5);
      expect(c.hw).toBeCloseTo(width / 2 - 0.1);
    }
  });
  it('leaves no gap outside the bridge', () => {
    for (let x = points[0]!.x + 1; x < points[points.length - 1]!.x; x += 2) {
      if (Math.abs(x - bridge.x) < 2.3) continue;
      expect(covered(cs, x, centreZ(x))).toBe(true);
    }
  });
});
