# terrain

Ground, path, mound, stream bed, railway embankment, boundary hills and instanced grass.

- `height.ts` / `surface.ts`: pure `heightAt` / `surfaceAt` (no THREE), provided via `ctx.provideTerrain`.
- `mesh.ts`: vertex-coloured toon plane (2 m grid inside bounds, 4 m outside). Hills are mesh-only.
- `boundary.ts`: hill ring (82 m outward) and closed hedge ring of circle colliders (r 1.6, every 3 m).
- `grass.ts` + `grass.*.glsl`: one InstancedMesh of crossed quads; wind sway in the vertex shader.
- `GRASS.viewRadius` = 60 m around origin; blades on `grass` surface only. `setQuality` rebuilds.
- The bridge rect keeps bank height (no channel carve) and reports `wood`.
