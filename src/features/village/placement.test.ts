import { describe, expect, it } from 'vitest';
import { Scene } from 'three';
import { LAYOUT, distanceToPolyline } from '../../core/layout';
import type { Collider, WorldContext } from '../../core/types';
import { HOUSE, placeHouses } from './placement';
import village from './index';

const v = LAYOUT.village;
const rect = { x0: v.xMin, x1: v.xMax, z0: v.zMin, z1: v.zMax };
const HALF_DIAG = 4.6;

describe('placeHouses', () => {
  const houses = placeHouses(7, rect, v.houses, 12, 4);

  it('returns the requested count, deterministically', () => {
    expect(houses).toHaveLength(5);
    expect(placeHouses(7, rect, 5, 12, 4)).toEqual(houses);
  });

  it('stays inside the margin-shrunk rect, apart, facing west', () => {
    for (const h of houses) {
      expect(h.x).toBeGreaterThanOrEqual(rect.x0 + 4);
      expect(h.x).toBeLessThanOrEqual(rect.x1 - 4);
      expect(h.z).toBeGreaterThanOrEqual(rect.z0 + 4);
      expect(h.z).toBeLessThanOrEqual(rect.z1 - 4);
      expect(Math.abs(h.rot - Math.PI / 2)).toBeLessThanOrEqual(0.25);
    }
    for (let i = 0; i < houses.length; i++)
      for (let j = i + 1; j < houses.length; j++)
        expect(Math.hypot(houses[i]!.x - houses[j]!.x, houses[i]!.z - houses[j]!.z)).toBeGreaterThanOrEqual(12);
  });

  it('keeps houses clear of the path and the stream', () => {
    for (const h of houses) {
      expect(distanceToPolyline(h.x, h.z, LAYOUT.path) - HALF_DIAG).toBeGreaterThanOrEqual(LAYOUT.pathWidth / 2 + 1);
      expect(distanceToPolyline(h.x, h.z, LAYOUT.stream.points)).toBeGreaterThanOrEqual(1.5 + HALF_DIAG + 0.5);
    }
  });
});

describe('village colliders', () => {
  const added: Collider[] = [];
  const ctx = {
    scene: new Scene(),
    terrain: { heightAt: () => 0, surfaceAt: () => 'grass' },
    colliders: { add: (c: Collider) => (added.push(c), String(added.length)), remove: () => {} },
    quality: { level: 'low' },
    time: { elapsed: 0 },
  } as unknown as WorldContext;
  village.init(ctx);

  it('registers 5 house boxes and 8 circles (6 lanterns + 2 torii pillars)', () => {
    expect(added.filter((c) => c.kind === 'box' && c.hw === HOUSE.hw && c.hd === HOUSE.hd)).toHaveLength(5);
    expect(added.filter((c) => c.kind === 'circle')).toHaveLength(8);
  });

  it('keeps lanterns beside the path and pillars off it', () => {
    const circles = added.filter((c): c is Extract<Collider, { kind: 'circle' }> => c.kind === 'circle');
    for (const c of circles) {
      expect(c.r).toBe(0.35);
      const d = distanceToPolyline(c.x, c.z, LAYOUT.path);
      const isLantern = LAYOUT.lanterns.some((l) => l.x === c.x && l.z === c.z);
      if (isLantern) {
        expect(d).toBeGreaterThanOrEqual(1.6);
        expect(d).toBeLessThanOrEqual(3.0);
      } else expect(d).toBeGreaterThanOrEqual(LAYOUT.pathWidth / 2 + 0.5);
    }
  });
});
