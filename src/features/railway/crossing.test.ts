import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { createColliders } from '../../core/colliders';
import { createBus } from '../../core/bus';
import { LAYOUT } from '../../core/layout';
import { TRAIN_CFG } from '../../shared/train-schedule';
import type { WorldContext } from '../../core/types';
import { createRailway } from './index';

const CFG = { ...TRAIN_CFG, startOffset: 0 };

function setup(cfg = CFG) {
  const colliders = createColliders();
  const bus = createBus();
  const emits: boolean[] = [];
  bus.on('crossing:state', (p) => emits.push(p.closed));
  const ctx = {
    scene: new Scene(),
    bus,
    colliders,
    terrain: { heightAt: () => 1.4 },
    time: { elapsed: 0 },
  } as unknown as WorldContext;
  const f = createRailway(cfg);
  f.init(ctx);
  const step = (t: number): void => { ctx.time.elapsed = t; f.update?.(0.016, t); };
  return { f, ctx, emits, step };
}

/** Walk a circle r 0.35 from z=-30 to -50 at x; return the min z reached. */
function walk(colliders: WorldContext['colliders'], x: number): number {
  const pos = new Vector3(x, 0, -30);
  for (let i = 0; i < 400; i++) {
    const prev = pos.clone();
    pos.z -= 0.05;
    colliders.resolve(pos, 0.35, prev);
  }
  return pos.z;
}

describe('railway crossing', () => {
  it('fences block the player away from the gap', () => {
    const { ctx, step } = setup();
    step(0);
    expect(walk(ctx.colliders, 0)).toBeGreaterThan(-37);
  });

  it('open crossing lets the player through, closed one stops them', () => {
    const { ctx, step } = setup();
    step(0);
    expect(walk(ctx.colliders, LAYOUT.crossing.x)).toBeLessThan(-49);
    step(25); // run 0 window closed
    const z = walk(ctx.colliders, LAYOUT.crossing.x);
    expect(Math.abs(z + 40)).toBeCloseTo(3.2, 1);
  });

  it('derives state from the schedule across time jumps without events', () => {
    const { emits, step } = setup();
    step(0);
    step(100);
    expect(emits).toEqual([true]);
    step(200);
    expect(emits).toEqual([true, false]);
    step(180);
    expect(emits).toEqual([true, false, true]);
  });

  it('emits crossing:state once per transition', () => {
    const { emits, step } = setup();
    for (let i = 0; i <= 2000; i++) { step(i * 0.1); }
    expect(emits).toEqual([true, false, true, false, true, false]);
  });

  it('starts closed immediately with the real timetable', () => {
    const { emits, step } = setup(TRAIN_CFG);
    step(0);
    expect(emits).toEqual([true]);
  });
});
