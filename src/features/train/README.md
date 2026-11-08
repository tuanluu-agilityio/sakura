# train

Three-car train on the railway line. Schedule lives in `src/shared/train-schedule.ts` (pure, shared with railway, audio, intro).

- Timetable: `trainStateAt(t)`, `runEvents(run, crossingX)`, `crossingClosed(t, crossingX)`; evaluated at `t + startOffset`.
- Runs alternate direction every `period` (75 s); the first approach eta at load is 6 s.
- `events.ts`: `TrainEventTracker` emits `train:approach {direction, eta}`, `train:pass`, `train:clear` once each per run, robust to time jumps.
- `model.ts`: `buildTrain(cfg)`, 3 cars of 18 x 3.3 x 2.9 m, shared geometries/materials, 7 emissive windows per side.
- `index.ts`: places cars on the rail each frame with a tiny sway; no colliders (fences block).
- `RAIL_TOP = 0.42` m above terrain at the railway z is duplicated by value in the railway feature.
- Registered after railway.
