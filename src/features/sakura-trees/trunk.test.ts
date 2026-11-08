import { describe, it, expect } from 'vitest';
import type { BufferGeometry } from 'three';
import { buildTree } from './trunk';

function hash(arr: ArrayLike<number>): number {
  let h = 2166136261;
  for (let i = 0; i < arr.length; i++) h = Math.imul(h ^ Math.round((arr[i] ?? 0) * 1e4), 16777619);
  return h >>> 0;
}

function triangles(g: BufferGeometry): number {
  return (g.index ? g.index.count : g.getAttribute('position').count) / 3;
}

describe('buildTree', () => {
  it('is deterministic for the same seed', () => {
    const a = buildTree(7, 2.2);
    const b = buildTree(7, 2.2);
    expect(hash(a.trunk.getAttribute('position').array)).toBe(hash(b.trunk.getAttribute('position').array));
    expect(hash(a.blossomAnchors)).toBe(hash(b.blossomAnchors));
    expect(hash(buildTree(8, 2.2).trunk.getAttribute('position').array)).not.toBe(hash(a.trunk.getAttribute('position').array));
  });

  it('hero tree has the target size and cluster count', () => {
    const t = buildTree(7, 2.2);
    expect(t.height).toBeGreaterThanOrEqual(9);
    expect(t.height).toBeLessThanOrEqual(13);
    expect(t.crownRadius).toBeGreaterThanOrEqual(7.5);
    expect(t.crownRadius).toBeLessThanOrEqual(10.5);
    const clusters = t.blossomAnchors.length / 4;
    expect(clusters).toBeGreaterThanOrEqual(700);
    expect(clusters).toBeLessThanOrEqual(1100);
  });

  it('places every anchor in the crown', () => {
    for (const [seed, scale] of [[7, 2.2], [100, 1], [111, 1.15]] as const) {
      const t = buildTree(seed, scale);
      const a = t.blossomAnchors;
      for (let i = 0; i < a.length; i += 4) {
        expect(Math.hypot(a[i]!, a[i + 2]!)).toBeLessThanOrEqual(t.crownRadius * 1.15);
        expect(a[i + 1]!).toBeGreaterThan(t.height * 0.45);
        expect(a[i + 3]!).toBeGreaterThan(0);
      }
    }
  });

  it('crown radius matches the 4.5 * scale petal volume within 15%', () => {
    const spots = [[7, 2.2], ...[1.0, 1.1, 0.95, 1.05, 1.15, 0.9, 1.2, 1.0, 1.1, 0.95, 1.0, 1.15].map((s, i) => [100 + i, s])];
    for (const [seed, scale] of spots) {
      const ratio = buildTree(seed!, scale!).crownRadius / (4.5 * scale!);
      expect(ratio, `seed ${seed}`).toBeGreaterThanOrEqual(0.85);
      expect(ratio, `seed ${seed}`).toBeLessThanOrEqual(1.15);
    }
  });

  it('spreads lifted anchors instead of stacking them at one height', () => {
    const t = buildTree(7, 2.2);
    const floor = t.height * 0.5;
    let atFloor = 0;
    for (let i = 1; i < t.blossomAnchors.length; i += 4) if (Math.abs(t.blossomAnchors[i]! - floor) < 1e-4) atFloor++;
    expect(atFloor).toBeLessThanOrEqual(1);
  });

  it('secondary trees have ~260 clusters', () => {
    const n = buildTree(100, 1).blossomAnchors.length / 4;
    expect(n).toBeGreaterThanOrEqual(200);
    expect(n).toBeLessThanOrEqual(320);
  });

  it('stays within the triangle budget', () => {
    for (let i = 0; i < 12; i++) expect(triangles(buildTree(100 + i, 1.2).trunk)).toBeLessThanOrEqual(3000);
    expect(triangles(buildTree(7, 2.2).trunk)).toBeLessThanOrEqual(12000);
  });
});
