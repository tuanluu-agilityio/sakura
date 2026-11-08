import { describe, expect, it, vi } from 'vitest';
import { AnimationClip, Box3, type AnimationMixer } from 'three';
import { createRig, loadCharacter, resolveClip } from './characters';
import { buildChibi, buildClips } from './chibi';
import type { WorldContext } from '../core/types';

describe('clip-name mapping', () => {
  it('finds sit by alias', () => {
    expect(resolveClip(['Idle_Loop', 'Walk_Loop', 'Run', 'Sitting_Idle'], 'sit')).toBe('Sitting_Idle');
  });
  it('falls back to idle when sit is missing', () => {
    expect(resolveClip(['Idle', 'Walk', 'Run'], 'sit')).toBe('Idle');
  });
  it('falls back to first clip, never throws on non-empty', () => {
    expect(resolveClip(['Wave'], 'run')).toBe('Wave');
  });
  it('throws on empty list', () => {
    expect(() => resolveClip([], 'idle')).toThrow();
  });
});

function mockRig() {
  const crossFadeTo = vi.fn();
  const actions = new Map<string, { name: string; timeScale: number; crossFadeTo: typeof crossFadeTo; reset: () => unknown; play: () => unknown; setEffectiveWeight: () => unknown; fadeIn: () => unknown }>();
  const mixer = {
    clipAction: (c: AnimationClip) => {
      if (!actions.has(c.name)) {
        const a = { name: c.name, timeScale: 1, crossFadeTo, reset: () => a, play: () => a, setEffectiveWeight: () => a, fadeIn: () => a };
        actions.set(c.name, a);
      }
      return actions.get(c.name);
    },
    update: vi.fn(),
  } as unknown as AnimationMixer;
  const clips = ['idle', 'walk', 'run', 'sit'].map((n) => new AnimationClip(n, 1, []));
  return { rig: createRig(buildChibi('boy').root, mixer, clips), crossFadeTo, actions };
}

describe('rig playback', () => {
  it('crossfades between clips', () => {
    const { rig, crossFadeTo } = mockRig();
    rig.play('run');
    rig.play('walk', 0.3);
    expect(crossFadeTo).toHaveBeenCalledTimes(1);
    expect(crossFadeTo.mock.calls[0]![1]).toBe(0.3);
  });
  it('setSpeedScale scales the active action', () => {
    const { rig, actions } = mockRig();
    rig.play('walk');
    rig.setSpeedScale(1.5);
    expect(actions.get('walk')!.timeScale).toBe(1.5);
  });
});

describe('procedural characters', () => {
  it.each([['player', 1.7], ['boy', 1.6], ['girl', 1.6]] as const)('%s stands on y=0 with height %f', async (id, h) => {
    const rig = await loadCharacter({} as WorldContext, id);
    rig.play('idle');
    rig.update(0.5);
    const box = new Box3().setFromObject(rig.root);
    expect(box.min.y).toBeGreaterThan(-0.08);
    expect(box.min.y).toBeLessThan(0.08);
    expect(box.max.y).toBeGreaterThan(h * 0.9);
    expect(box.max.y).toBeLessThan(h * 1.1);
  });
  it('provides all four clips', () => {
    expect(buildClips('girl').map((c) => c.name).sort()).toEqual(['idle', 'run', 'sit', 'walk']);
  });
});

describe('real mixer drives the nodes', () => {
  it('sit lowers hips to 0.2H and rotates thighs', async () => {
    const rig = await loadCharacter({} as WorldContext, 'player');
    rig.play('sit', 0);
    rig.update(1);
    const hips = rig.root.getObjectByName('hips')!;
    expect(hips.position.y).toBeCloseTo(0.2 * 1.7, 2);
    expect(rig.root.getObjectByName('thighL')!.quaternion.x).toBeLessThan(-0.5);
  });
  it('walk moves hips and legs over time', async () => {
    const rig = await loadCharacter({} as WorldContext, 'boy');
    rig.play('walk', 0);
    rig.update(0.25);
    const thigh = rig.root.getObjectByName('thighL')!;
    const hips = rig.root.getObjectByName('hips')!;
    const a = { q: thigh.quaternion.x, y: hips.position.y };
    rig.update(0.25);
    expect(Math.abs(thigh.quaternion.x - a.q)).toBeGreaterThan(0.1);
    expect(Math.abs(hips.position.y - a.y)).toBeGreaterThan(0.001);
  });
  it('hips are lowest when legs are spread (feet planted)', async () => {
    const rig = await loadCharacter({} as WorldContext, 'boy');
    rig.play('walk', 0);
    rig.update(0.25);
    const low = rig.root.getObjectByName('hips')!.position.y;
    rig.update(0.25);
    expect(rig.root.getObjectByName('hips')!.position.y).toBeGreaterThan(low);
  });
  it('idle resolution prefers a clip without sit', () => {
    expect(resolveClip(['Sitting_Idle', 'Idle'], 'idle')).toBe('Idle');
  });
  it('setSpeedScale is sticky across play()', () => {
    const { rig, actions } = mockRig();
    rig.setSpeedScale(2);
    rig.play('run');
    expect(actions.get('run')!.timeScale).toBe(2);
  });
});
