import { BufferGeometry, InstancedMesh, Scene, Vector2 } from 'three';
import { describe, expect, it } from 'vitest';
import { GRASS, createGrass, grassCount, scatterGrass } from './grass';

describe('scatterGrass', () => {
  const accept = (x: number, z: number): boolean => x > 0 || z > 10;
  it('returns exactly count positions, all accepted', () => {
    const p = scatterGrass(500, 7, accept);
    expect(p.length).toBe(1000);
    for (let i = 0; i < 500; i++) expect(accept(p[i * 2]!, p[i * 2 + 1]!)).toBe(true);
  });
  it('is deterministic per seed', () => {
    expect(scatterGrass(50, 3, accept)).toEqual(scatterGrass(50, 3, accept));
    expect(scatterGrass(50, 3, accept)).not.toEqual(scatterGrass(50, 4, accept));
  });
  it('count follows density', () => {
    expect(grassCount(1)).toBe(GRASS.bladesAtDensity1);
    expect(grassCount(0.35)).toBe(Math.round(GRASS.bladesAtDensity1 * 0.35));
  });
});

describe('grass setQuality', () => {
  it('x20 does not leak geometries and removes old meshes', () => {
    let created = 0;
    let disposed = 0;
    const orig = BufferGeometry.prototype.dispose;
    BufferGeometry.prototype.dispose = function (this: BufferGeometry) { disposed++; orig.call(this); };
    try {
      const scene = new Scene();
      const grass = createGrass({
        scene,
        wind: { direction: new Vector2(1, 0), strength: 0, gust: 0 },
        count: (d) => Math.round(d * 200),
      });
      const seen = new Set<BufferGeometry>();
      const live = (): number => {
        for (const c of scene.children) if (c instanceof InstancedMesh) seen.add(c.geometry);
        created = seen.size;
        return created - disposed;
      };
      const densities = [0.35, 0.7, 1];
      grass.setQuality(densities[0]!);
      const afterFirst = live();
      for (let i = 0; i < 20; i++) {
        grass.setQuality(densities[i % 3]!);
        expect(live()).toBe(afterFirst);
        expect(scene.children.filter((c) => c instanceof InstancedMesh).length).toBe(1);
      }
      grass.dispose();
      expect(scene.children.length).toBe(0);
      expect(live()).toBe(0);
    } finally {
      BufferGeometry.prototype.dispose = orig;
    }
  });
});
