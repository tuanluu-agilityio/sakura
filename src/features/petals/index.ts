import type { InstancedMesh, Material } from 'three';
import type { EventMap, Feature, QualityProfile, WorldContext } from '../../core/types';
import { createFallingPetals, createPetalUniforms, mulberry32, petalCount } from './falling';
import { createGroundPetals, groundCount } from './ground';
import { createWindController } from './wind';

const FALLING_SEED = 1504;
const GROUND_SEED = 2604;
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

let ctx: WorldContext | null = null;
let profile: QualityProfile | null = null;
let reduced = false;
let media: MediaQueryList | null = null;
let falling: InstancedMesh | null = null;
let ground: InstancedMesh | null = null;
const uniforms = createPetalUniforms();
let wind = createWindController(Math.random);
const emitGust = (e: EventMap['wind:gust']): void => ctx?.bus.emit('wind:gust', e);

function free(mesh: InstancedMesh | null): null {
  if (!mesh) return null;
  mesh.removeFromParent();
  mesh.geometry.dispose();
  (mesh.material as Material).dispose();
  mesh.dispose();
  return null;
}

function rebuild(): void {
  if (!ctx || !profile) return;
  falling = free(falling);
  ground = free(ground);
  const n = petalCount(profile, reduced);
  falling = createFallingPetals({ count: n, terrain: ctx.terrain, rand: mulberry32(FALLING_SEED), uniforms });
  ground = createGroundPetals({ count: groundCount(n), terrain: ctx.terrain, rand: mulberry32(GROUND_SEED) });
  ctx.scene.add(falling, ground);
}

function onReducedChange(e: MediaQueryListEvent): void {
  if (e.matches === reduced) return;
  reduced = e.matches;
  rebuild();
}

const feature: Feature = {
  name: 'petals',

  init(c) {
    ctx = c;
    profile = c.quality;
    wind = createWindController(Math.random);
    if (typeof matchMedia === 'function') {
      media = matchMedia(REDUCED_QUERY);
      reduced = media.matches;
      media.addEventListener('change', onReducedChange);
    }
    rebuild();
  },

  update(dt, elapsed) {
    if (!ctx) return;
    const w = ctx.wind;
    wind.update(dt, elapsed, w, emitGust);
    uniforms.uTime.value = elapsed;
    uniforms.uWindDir.value.copy(w.direction);
    uniforms.uWindStrength.value = w.strength;
    uniforms.uGust.value = w.gust;
    // uInfluence is written by its owner (M3-T4) via material.userData.influence.
  },

  setQuality(p) {
    profile = p;
    rebuild();
  },

  dispose() {
    media?.removeEventListener('change', onReducedChange);
    media = null;
    falling = free(falling);
    ground = free(ground);
    uniforms.uInfluence.value.set(0, 0, 0, 0);
    ctx = profile = null;
  },
};

export default feature;
