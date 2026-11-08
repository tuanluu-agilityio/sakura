import { describe, it, expect } from 'vitest';
import { Mesh, Scene, Vector2 } from 'three';
import type { Collider, ColliderRegistry, WorldContext } from '../../core/types';
import feature from './index';

function mockColliders(): ColliderRegistry & { items: Map<string, Collider> } {
  const items = new Map<string, Collider>();
  let n = 0;
  return {
    items,
    add(c) { const id = `t${n++}`; items.set(id, c); return id; },
    remove(id) { items.delete(id); },
    setEnabled() {},
    resolve(p) { return p; },
  };
}

describe('sakura-trees feature', () => {
  it('adds 13 tree colliders and 26 meshes, and removes everything on dispose', async () => {
    const scene = new Scene();
    const colliders = mockColliders();
    const ctx = {
      scene,
      colliders,
      terrain: { heightAt: () => 1.8, surfaceAt: () => 'grass' },
      wind: { direction: new Vector2(1, 0), strength: 0, gust: 0.5 },
    } as unknown as WorldContext;

    await feature.init(ctx);
    expect(colliders.items.size).toBe(13);
    const hero = [...colliders.items.values()].find((c) => c.kind === 'circle' && c.x === 0 && c.z === 0);
    expect(hero && hero.kind === 'circle' ? hero.r : 0).toBeCloseTo(0.99);

    let meshes = 0;
    let minY = Infinity;
    scene.traverse((o) => { if (o instanceof Mesh) { meshes++; minY = Math.min(minY, o.getWorldPosition(o.position.clone()).y); } });
    expect(meshes).toBe(26);
    expect(minY).toBeCloseTo(1.8);

    feature.update!(0.016, 3);
    feature.setQuality!({ level: 'low', petals: 1500, shadowMapSize: 1024, bloom: false, maxPixelRatio: 1, viewDistance: 220, grassDensity: 0.35 });

    feature.dispose!();
    expect(colliders.items.size).toBe(0);
    expect(scene.children.length).toBe(0);
  });
});
