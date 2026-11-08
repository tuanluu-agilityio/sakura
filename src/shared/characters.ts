import { AnimationMixer, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import type { WorldContext } from '../core/types';
import { buildChibi, buildClips, type CharacterId } from './chibi';

export type ClipName = 'idle' | 'walk' | 'run' | 'sit';

export interface CharacterRig {
  root: Object3D;
  clipNames: string[];
  mixer: AnimationMixer;
  play(clip: ClipName, fade?: number): void;
  setSpeedScale(s: number): void;
  update(dt: number): void;
  dispose(): void;
}

const ALIASES: Record<ClipName, RegExp[]> = {
  idle: [/idle|stand|breath/i],
  walk: [/walk/i],
  run: [/run|sprint|jog/i],
  sit: [/sit.*idle/i, /sit/i],
};

function find(names: string[], want: ClipName): string | undefined {
  for (const re of ALIASES[want]) {
    const hit = (want === 'idle' ? names.find((n) => re.test(n) && !/sit/i.test(n)) : undefined) ?? names.find((n) => re.test(n));
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/** Maps a wanted clip to a real clip name: want -> idle -> first. Throws only for an empty list. */
export function resolveClip(names: string[], want: ClipName): string {
  if (names.length === 0) throw new Error('character has no animation clips');
  return find(names, want) ?? find(names, 'idle') ?? names[0]!;
}

/** Wraps a root + mixer + clips into a rig. Exported for tests (mock mixer). */
export function createRig(root: Object3D, mixer: AnimationMixer, clips: AnimationClip[], onDispose: () => void = () => {}): CharacterRig {
  const names = clips.map((c) => c.name);
  const actions = new Map<string, AnimationAction>();
  const warned = new Set<ClipName>();
  let active: AnimationAction | null = null;
  let scale = 1;
  const actionFor = (name: string): AnimationAction => {
    let a = actions.get(name);
    if (!a) {
      a = mixer.clipAction(clips[names.indexOf(name)]!);
      actions.set(name, a);
    }
    return a;
  };
  return {
    root, mixer, clipNames: names,
    play(clip, fade = 0.25) {
      if (find(names, clip) === undefined && !warned.has(clip)) {
        warned.add(clip);
        console.warn(`[characters] clip "${clip}" missing, using fallback`);
      }
      const next = actionFor(resolveClip(names, clip));
      if (next === active) return;
      next.timeScale = scale;
      next.reset().play();
      if (active) active.crossFadeTo(next, fade, false);
      else next.setEffectiveWeight(1);
      active = next;
    },
    /** Sticky: the scale also applies to clips played later, so callers may set it every frame. */
    setSpeedScale(s) {
      scale = s;
      if (active) active.timeScale = s;
    },
    update(dt) { mixer.update(dt); },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(root); onDispose(); },
  };
}

/** Tier (c) of the asset chain: procedural chibi with code-driven clips (no .glb is loaded). */
export async function loadCharacter(_ctx: WorldContext, id: CharacterId): Promise<CharacterRig> {
  const { root, geometries } = buildChibi(id);
  const mixer = new AnimationMixer(root);
  const rig = createRig(root, mixer, buildClips(id), () => {
    for (const g of geometries) g.dispose();
    root.traverse((o) => { const m = (o as { material?: { dispose(): void } }).material; m?.dispose(); });
  });
  rig.play('idle', 0);
  return rig;
}

export type { CharacterId };
