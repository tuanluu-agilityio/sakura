import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { createColliders } from './colliders';

describe('createColliders', () => {
  it('does not tunnel through a thin box when prev is given', () => {
    const reg = createColliders();
    reg.add({ kind: 'box', x: 0, z: 0, hw: 2, hd: 0.1, rot: 0 });
    const prev = new Vector3(0, 0, 2);
    const pos = new Vector3(0, 0, -2);
    reg.resolve(pos, 0.4, prev);
    expect(pos.z).toBeGreaterThanOrEqual(0.1 + 0.4 - 1e-9);
  });

  it('pushes out of a circle', () => {
    const reg = createColliders();
    reg.add({ kind: 'circle', x: 0, z: 0, r: 1 });
    const pos = new Vector3(0.5, 0, 0);
    reg.resolve(pos, 0.5);
    expect(pos.x).toBeCloseTo(1.5);
    expect(pos.z).toBeCloseTo(0);
  });

  it('pushes out of a 45 degree rotated box along its local normal', () => {
    const reg = createColliders();
    reg.add({ kind: 'box', x: 0, z: 0, hw: 1, hd: 1, rot: Math.PI / 4 });
    // World point on the +x axis lies off the diamond's corner... use a point near a face normal.
    // Local +x axis in world: local->world uses (ox*cos + oz*sin, -ox*sin + oz*cos) => (0.707, -0.707).
    const n = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
    const pos = new Vector3(n.x * 1.1, 0, n.z * 1.1); // 0.1 outside the +x face, radius 0.3 overlaps
    reg.resolve(pos, 0.3);
    expect(pos.x).toBeCloseTo(n.x * 1.3);
    expect(pos.z).toBeCloseTo(n.z * 1.3);
  });

  it('setEnabled(false) lets the player through; remove works', () => {
    const reg = createColliders();
    const id = reg.add({ kind: 'circle', x: 0, z: 0, r: 1 });
    reg.setEnabled(id, false);
    const pos = new Vector3(0.2, 0, 0);
    reg.resolve(pos, 0.3);
    expect(pos.x).toBeCloseTo(0.2);
    reg.setEnabled(id, true);
    reg.remove(id);
    reg.resolve(pos, 0.3);
    expect(pos.x).toBeCloseTo(0.2);
  });
});
