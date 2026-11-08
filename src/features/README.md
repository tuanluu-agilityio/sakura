# Features

Each feature is a folder `src/features/<name>/` whose `index.ts` default-exports a `Feature` (see `src/core/types.ts`).

```ts
import type { Feature, WorldContext } from '../../core/types';
let ctx: WorldContext;
const feature: Feature = {
  name: 'my-feature',
  async init(c) { ctx = c; /* build meshes, add to ctx.scene, subscribe via ctx.bus.on */ },
  update(dt, elapsed) { /* per frame; no allocations in hot paths */ },
  setQuality(p) { /* adapt to p.petals, p.shadowMapSize, ... */ },
  dispose() { /* remove meshes, dispose geometry/materials, unsubscribe */ },
};
export default feature;
```

- **Never import another feature.** Talk through `ctx.bus` events or `ctx` state. Allowed imports: `three`, `src/core/*`, `src/shared/*`, your own folder.
- Register by importing the default export in `src/features/index.ts` and appending it to `features` (order = init/update order; keep all lines on merge conflicts).
- Folder `README.md` ≤ 20 lines; files ≤ 200 lines; shaders in `.glsl` imported with `?raw`.
