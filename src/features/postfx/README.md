# postfx

Post-processing and distance fog.

- `composer.ts`: EffectComposer chain RenderPass -> UnrealBloomPass (strength 0.35, radius 0.6, threshold 0.85; only when `profile.bloom`) -> vignette (darkness 0.28, offset 1.1) -> OutputPass.
- `fog.ts`: `scene.fog = new Fog(PALETTE.skyHorizon, near, far)` from `fogRange(viewDistance)` (`src/shared/toon.ts`). Other features read `scene.fog`, never create it.
- `index.ts`: wraps `ctx.renderer.render` once in `init`. A call with `ctx.scene` runs `composer.render()`; nested calls from the passes and calls with any other scene go to the stored original, so there is no recursion. `dispose()` restores the original.
- `setQuality` updates fog, adds/removes the bloom pass, and resyncs composer pixel ratio and size; `window` `resize` resyncs too.
- `activeComposer()` exposes the live composer for tests.
