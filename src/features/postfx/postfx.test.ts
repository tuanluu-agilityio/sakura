import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Fog, PerspectiveCamera, Scene, Vector2, type WebGLRenderer } from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { QUALITY_PROFILES } from '../../core/quality';
import type { WorldContext } from '../../core/types';
import postfx, { activeComposer } from './index';

function mockRenderer(): WebGLRenderer {
  return {
    render: vi.fn(),
    getPixelRatio: () => 1,
    getSize: (v: Vector2) => v.set(800, 600),
    getClearColor: vi.fn(),
    getClearAlpha: () => 1,
    setClearColor: vi.fn(),
    setRenderTarget: vi.fn(),
    getRenderTarget: () => null,
  } as unknown as WebGLRenderer;
}

function mockCtx(): WorldContext {
  return {
    renderer: mockRenderer(),
    scene: new Scene(),
    camera: new PerspectiveCamera(),
    quality: QUALITY_PROFILES.medium,
  } as unknown as WorldContext;
}

const bloomCount = (): number => activeComposer()!.passes.filter((p) => p instanceof UnrealBloomPass).length;

describe('postfx feature', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  });
  afterEach(() => {
    postfx.dispose?.();
    vi.unstubAllGlobals();
  });

  it('setQuality(low) leaves 0 bloom passes, medium 1', async () => {
    await postfx.init(mockCtx());
    postfx.setQuality!(QUALITY_PROFILES.low);
    expect(bloomCount()).toBe(0);
    postfx.setQuality!(QUALITY_PROFILES.medium);
    expect(bloomCount()).toBe(1);
    postfx.setQuality!(QUALITY_PROFILES.medium);
    expect(bloomCount()).toBe(1);
  });

  it('dispose() restores the original render', async () => {
    const ctx = mockCtx();
    const original = ctx.renderer.render;
    await postfx.init(ctx);
    expect(ctx.renderer.render).not.toBe(original);
    postfx.dispose!();
    expect(ctx.renderer.render).toBe(original);
    expect(activeComposer()).toBeNull();
  });

  it('wrapped render reaches the original only through the passes (no recursion)', async () => {
    const ctx = mockCtx();
    const original = ctx.renderer.render as ReturnType<typeof vi.fn>;
    await postfx.init(ctx);
    const composer = activeComposer()!;
    const spy = vi.spyOn(composer, 'render').mockImplementation(() => {
      ctx.renderer.render(ctx.scene, ctx.camera); // what RenderPass does internally
    });
    ctx.renderer.render(ctx.scene, ctx.camera);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledTimes(1);
  });

  it('sets linear fog from the quality view distance', async () => {
    const ctx = mockCtx();
    await postfx.init(ctx);
    postfx.setQuality!(QUALITY_PROFILES.low);
    const fog = ctx.scene.fog as Fog;
    expect(fog.near).toBeCloseTo(77, 6);
    expect(fog.far).toBe(220);
  });
});
