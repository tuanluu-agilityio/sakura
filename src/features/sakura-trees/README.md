# sakura-trees

Hero tree (`LAYOUT.mainTree`, seed 7, scale 2.2) plus 12 secondary trees (`LAYOUT.trees`, seeds `100+i`).

- `rng.ts`: `mulberry32(seed)` seeded PRNG.
- `trunk.ts`: `buildTree(seed, scale)` recursive branching (depth 4, split 25-40 deg, length x0.7, radius x0.62), tapered `TubeGeometry` segments merged by hand, plus blossom anchors `x,y,z,size`.
- `blossom.ts`: one `InstancedMesh` per tree of crossed card quads, procedural radial alpha texture, instance colour `blossom`/`blossomDeep` 60/40, `alphaTest 0.4`, custom depth material for shadows.
- `sway.vert.glsl`: wind sway injected via `onBeforeCompile`; per frame only uniform writes (`ctx.wind`).
- Trunks use `createToonMaterial({ color: PALETTE.trunk })`; blossoms are unlit with a fake height shade.
- Trees sit at `ctx.terrain.heightAt` (read at init). Circle collider `r = 0.45 * scale` per tree.
- Draw calls: 13 trees x (trunk + blossom) = 26, shadow passes excluded. `setQuality('low')` stops blossom shadow casting.
