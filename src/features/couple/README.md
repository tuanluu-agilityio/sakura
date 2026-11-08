# couple

A boy and a girl sit on a stone bench at `LAYOUT.bench`, facing south (+z) toward the path and spawn.

- `bench.ts`: toon stone bench (seat 0.45 m), box collider.
- `head.ts`: `findHeadBone`, `createHeadAnimator`; every 6-12 s one head event (70 % look up, 30 % turn to the partner), applied on top of the sit pose. A missing head bone is a no-op.
- `index.ts`: loads both characters (a failed load skips only that one), breathing scale, circle colliders at the seats.
- `SIT_Y_OFFSET` (fraction of height) sinks the root because the `sit` clip keeps the hips 0.2H above the root.
