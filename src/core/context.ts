import { PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { createAssets } from './assets';
import { createBus } from './bus';
import { createColliders } from './colliders';
import { createInput } from './input';
import { QUALITY_PROFILES, pickInitialQuality, resolveQuality } from './quality';
import { createRenderer } from './renderer';
import { createSettings } from './settings';
import type { GameMode, QualityLevel, Settings, Terrain, WorldContext } from './types';

export const FLAT_TERRAIN: Terrain = { heightAt: () => 0, surfaceAt: () => 'grass' };

export function isTouchDevice(): boolean {
  return navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
}

/** README quality resolution using the live URL and device environment. */
export function currentQuality(settings: Settings): { level: QualityLevel; auto: boolean } {
  const auto = pickInitialQuality({ touch: isTouchDevice(), cores: navigator.hardwareConcurrency || 4 });
  return resolveQuality({ url: location.search, setting: settings.quality, auto });
}

/** endFrame resets per-frame input (look/zoom); the main loop calls it after feature updates. */
export function createContext(canvas: HTMLCanvasElement): WorldContext & { endFrame(): void } {
  const bus = createBus();
  const settings = createSettings(localStorage, bus);
  const quality = QUALITY_PROFILES[currentQuality(settings.get()).level];
  const camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2500);

  const input = createInput(canvas);
  const ctx: WorldContext & { endFrame(): void } = {
    scene: new Scene(),
    camera,
    renderer: createRenderer(canvas),
    bus,
    terrain: FLAT_TERRAIN,
    colliders: createColliders(),
    input,
    endFrame: () => input.endFrame(),
    assets: createAssets(),
    settings,
    quality,
    wind: { direction: new Vector2(1, 0), strength: 0, gust: 0 },
    player: { position: new Vector3(), heading: 0, speed: 0 },
    mode: 'loading',
    setMode(m: GameMode) {
      const prev = ctx.mode;
      if (prev === m) return;
      ctx.mode = m;
      bus.emit('game:mode', { mode: m, prev });
    },
    provideTerrain(t: Terrain) {
      ctx.terrain = t;
    },
    time: { elapsed: 0 },
  };
  return ctx;
}
