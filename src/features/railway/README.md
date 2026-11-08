# railway

Track, fences and the level crossing at `LAYOUT.crossing`.

- `track.ts`: ballast strip, 1143 instanced sleepers, two rails; rail head top = terrain + `RAIL_TOP` (0.42 m, duplicated by value in the train feature).
- `fences.ts`: instanced posts + two rails on `LAYOUT.fences.zs`, x +-90, open at the gap.
- `crossing.ts`: two striped barrier arms (down = horizontal, up = 80 deg), signal posts with alternating red lamps (flash only while the barrier is not fully up).
- `logic.ts`: pure `sleeperXs`, `fenceSegments`, `stepBarrier` (2 s travel), `lampOn` (1 Hz).
- `index.ts`: `closed = crossingClosed(elapsed, crossing.x)` every frame (no `train:*` events, so a missed event cannot wedge it); emits `crossing:state` only on change.
- Starts in the schedule's state (closed at load with the real timetable); the barrier starts fully down, not animating.
- Fence segments are box colliders (hd 0.1); two gate boxes in the gap are enabled only while closed.
- `createRailway(cfg)` is exported for tests (e.g. `startOffset: 0`).
