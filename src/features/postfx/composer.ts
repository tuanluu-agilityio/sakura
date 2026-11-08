import { Color, Vector2, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import vignetteFrag from './vignette.frag.glsl?raw';

export const POSTFX_CONSTANTS = {
  bloom: { strength: 0.35, radius: 0.6, threshold: 0.85 },
  vignette: { darkness: 0.28, offset: 1.1 },
} as const;

export interface Postfx {
  composer: EffectComposer;
  /** Composite one frame to the screen. */
  render(): void;
  setBloom(on: boolean): void;
  /** Sync composer buffers to the renderer's current size and pixel ratio. */
  syncSize(): void;
  dispose(): void;
}

/** RenderPass -> UnrealBloomPass (optional) -> vignette -> OutputPass. */
export function createPostfx(renderer: WebGLRenderer, scene: Scene, camera: Camera, bloomOn: boolean): Postfx {
  const size = renderer.getSize(new Vector2());
  const clear = new Color();
  const composer = new EffectComposer(renderer);
  const { strength, radius, threshold } = POSTFX_CONSTANTS.bloom;
  const bloom = new UnrealBloomPass(size.clone(), strength, radius, threshold);
  const vignette = new ShaderPass({
    name: 'SakuraVignette',
    uniforms: {
      tDiffuse: { value: null },
      darkness: { value: POSTFX_CONSTANTS.vignette.darkness },
      offset: { value: POSTFX_CONSTANTS.vignette.offset },
    },
    vertexShader: CopyShader.vertexShader,
    fragmentShader: vignetteFrag,
  });
  const output = new OutputPass();

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(vignette);
  composer.addPass(output);

  const setBloom = (on: boolean): void => {
    const has = composer.passes.includes(bloom);
    if (on && !has) composer.insertPass(bloom, 1);
    else if (!on && has) composer.removePass(bloom);
  };
  setBloom(bloomOn);

  return {
    composer,
    render() {
      // RenderPass clears with the GL clear state left by the last on-screen frame (sRGB-encoded).
      // Re-apply the clear colour while the linear read buffer is bound so the sky clear stays PALETTE-exact.
      const prev = renderer.getRenderTarget();
      renderer.getClearColor(clear);
      renderer.setRenderTarget(composer.readBuffer);
      renderer.setClearColor(clear, renderer.getClearAlpha());
      renderer.setRenderTarget(prev);
      composer.render();
    },
    setBloom,
    syncSize() {
      renderer.getSize(size);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(size.x, size.y);
    },
    dispose() {
      for (const p of composer.passes) p.dispose();
      if (!composer.passes.includes(bloom)) bloom.dispose();
      composer.dispose();
    },
  };
}
