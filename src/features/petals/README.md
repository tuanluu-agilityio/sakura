# petals

Global wind controller plus falling and ground sakura petals. Registered last (after sakura-trees).

- `wind.ts`: `createWindController(rand)` writes `ctx.wind` each frame: base direction swings around +x (period 300 s), strength 0.25-0.5 slow noise, gusts every uniform(12,30) s for uniform(3,6) s with a `sin^2` envelope; emits `wind:gust` once at gust start.
- `falling.ts`: `petalVolumes(trees)` = hero crown (radius 9, weight 0.35) + one per `LAYOUT.trees` (radius `4.5*scale`, height `5.09*scale`, crown band from half height to top). ONE `InstancedMesh` (bent 2-tri petal 0.09 x 0.06 m), `frustumCulled = false`; seeds `aSeed` (volume, phase, flutter freq, size), `aBase` (spawn xyz, ground y), `aLateral`.
- `petal.vert.glsl`: all motion from `uTime` + seeds (life 14-22 s, `fract` wrap, flutter, tumble, wind drift, gust swirl). `fade.ts` `petalFade(t, lateral)` mirrors the shader fade (0 at both ends and the lateral edge: wrap is invisible).
- `ground.ts`: ONE static toon `InstancedMesh` (`0.35 * count`) scattered around tree bases (radius `crown*1.1`), never on water.
- Count: `petalCount(profile, reduced)`; `prefers-reduced-motion: reduce` halves it (re-read on `change`). `setQuality` rebuilds both meshes.
- Colours: `PALETTE.petal` / `PALETTE.blossomDeep`.

## Influence hook (M3-T4)
The falling material exposes `material.userData.influence`: a `THREE.Vector4` (xyz centre, w radius; default `(0,0,0,0)` = off) bound to `uInfluence`. Write it in place (`.set(x, y, z, r)`) each frame; petals within the radius are pushed outward. The same Vector4 survives `setQuality` rebuilds. Find the mesh by name `petals-falling`.
