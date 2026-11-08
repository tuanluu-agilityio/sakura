# fuji

Distant Mount Fuji: a 128x48 lathe-style cone with a concave profile, ridges and a flat crater.

- `geometry.ts`: pure `fujiRadiusAt(h01, angle)` and `buildFujiGeometry(seed)` (about 6.3k vertices, seeded jitter).
- `fuji.*.glsl`: own ShaderMaterial (not toon): fuji to snow above 0.62..0.72 height, lavender shade, base haze band.
- Aerial perspective is baked (`uHaze` 0.35 toward `skyHorizon`). `fog: false`, uniform `fogExempt` = 1, so scene fog never hides it.
- Sun direction is a local uniform copy of (-0.5, 0.45, -0.3) normalised; keep in sync with the sky feature.
- `ctx.camera.far` is 2500 (src/core/context.ts), above the required 2000; Fuji sits ~900 m away with ~540 m radius.
- No collider; no shadow casting or receiving.
