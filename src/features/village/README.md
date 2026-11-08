# village

Five houses, rice paddies, torii, six stone lanterns, the stream and its bridge. All positions come from `LAYOUT`.

- `placement.ts`: `placeHouses` (mulberry32 rejection sampling, houses face west), `HOUSE` footprint half extents.
- `house.ts` / `roof.ts`: 3 shared-geometry InstancedMeshes (wood, plaster, roof), per-instance tint; concave gable roof.
- `paddies.ts` + `paddy.frag.glsl`: 8 x 6 m plots, instanced dikes, one merged water mesh (sky fresnel, ripple). Walkable.
- `torii.ts`, `lanterns.ts`: vermilion gate (2 pillar circles) and instanced lanterns (r 0.35 circles, emissive window, no PointLights).
- `stream.ts` + `stream.*.glsl`: flat ribbon at `WATER_Y` (-0.15), polygonOffset, scrolling noise, edge foam.
- `streamColliders`: 1 m box chunks along the stream, with a gap of bridge.width/2 + 1.1 m around the bridge.
- `bridge.ts`: instanced planks, rails and posts, deck top at bank height + 0.12, two railing boxes.
- Terrain contract: `heightAt` is bank height on the bridge span; `surfaceAt` is `water` over the stream.
- Draw calls added: 3 houses + 2 paddies + 1 torii + 2 lanterns + 1 stream + 2 bridge = 11.
- Ribbon is `stream.width + 1.4` wide: the terrain bank ramp only dips below the water ~2.2 m from the centreline.
