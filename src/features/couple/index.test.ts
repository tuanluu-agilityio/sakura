import { describe, expect, it, vi } from 'vitest';
import { Group, Object3D, Scene } from 'three';
import type { WorldContext } from '../../core/types';

vi.mock('../../shared/characters', () => ({
  loadCharacter: vi.fn(async (_c: unknown, id: string) => {
    if (id === 'girl') throw new Error('load failed');
    const root = new Group();
    root.add(Object.assign(new Object3D(), { name: 'head' }));
    return { root, play: vi.fn(), update: vi.fn(), dispose: vi.fn(), clipNames: [] };
  }),
}));

import couple from './index';

describe('couple feature', () => {
  it('keeps the bench and the partner when one character fails to load', async () => {
    const scene = new Scene();
    const ids: string[] = [];
    const ctx = {
      scene,
      terrain: { heightAt: () => 0 },
      colliders: { add: () => { const id = `c${ids.length}`; ids.push(id); return id; }, remove: vi.fn() },
    } as unknown as WorldContext;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(Promise.resolve(couple.init(ctx))).resolves.toBeUndefined();
    expect(scene.children.length).toBe(2); // bench + boy
    expect(ids.length).toBe(2); // bench box + boy seat
    expect(() => couple.update?.(0.016, 1)).not.toThrow();
    couple.dispose?.();
  });
});
