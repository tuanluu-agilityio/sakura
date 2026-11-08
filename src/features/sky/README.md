# sky
Gradient sky dome, drifting billboard clouds, sun + hemisphere lighting.
- `dome.ts`: inverted sphere (r 1500) following the camera; gradient `skyHorizon` -> `skyTop` plus a faint sun glow.
- `clouds.ts`: 14 instanced camera-facing quads, drift +x 1.2 m/s, wrap at +-900 m.
- `light.ts`: `SUN_DIR`, `SUN_COLOR`, `SUN_INTENSITY`, `HEMI`, `SHADOW` constants; `shadowFrustum` snaps the shadow centre to 1 m.
- Shadow-casting directional light follows `ctx.player.position`; `setQuality` reallocates the shadow map.
- Does not touch `scene.fog` (postfx owns it).
