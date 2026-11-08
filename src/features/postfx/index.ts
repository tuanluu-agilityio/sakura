import type { Camera, Fog, Object3D, WebGLRenderer } from 'three';
import type { Feature, QualityProfile, WorldContext } from '../../core/types';
import { createPostfx, type Postfx } from './composer';
import { applyFog, removeFog } from './fog';

let ctx: WorldContext | null = null;
let fx: Postfx | null = null;
let fog: Fog | null = null;
let original: WebGLRenderer['render'] | null = null;
let rendering = false;

const onResize = (): void => fx?.syncSize();

/** Test/debug accessor for the live composer (null when not initialised). */
export function activeComposer(): Postfx['composer'] | null {
  return fx?.composer ?? null;
}

const postfx: Feature = {
  name: 'postfx',

  init(c) {
    ctx = c;
    const { renderer, scene, camera } = c;
    fog = applyFog(scene, null, c.quality.viewDistance);
    fx = createPostfx(renderer, scene, camera, c.quality.bloom);

    // Wrap render once. Nested calls (RenderPass, fullscreen quads) and foreign scenes go straight to the original.
    const base = renderer.render;
    original = base;
    renderer.render = (s: Object3D, cam: Camera): void => {
      if (rendering || !fx || s !== scene) return base.call(renderer, s, cam);
      rendering = true;
      try {
        fx.render(cam);
      } finally {
        rendering = false;
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
  },

  setQuality(p: QualityProfile) {
    if (!ctx || !fx) return;
    fog = applyFog(ctx.scene, fog, p.viewDistance);
    fx.setBloom(p.bloom);
    fx.syncSize();
  },

  dispose() {
    if (!ctx) return;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (original) ctx.renderer.render = original;
    removeFog(ctx.scene, fog);
    fx?.dispose();
    ctx = null;
    fx = null;
    fog = null;
    original = null;
    rendering = false;
  },
};

export default postfx;
