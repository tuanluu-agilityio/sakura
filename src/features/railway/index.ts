import { LAYOUT } from '../../core/layout';
import type { Feature, WorldContext } from '../../core/types';
import { TRAIN_CFG, crossingClosed, type TrainCfg } from '../../shared/train-schedule';
import { buildCrossing, type CrossingGear } from './crossing';
import { buildFences, type Fences } from './fences';
import { fenceSegments, lampOn, stepBarrier } from './logic';
import { buildTrack, type Track } from './track';

const COLLIDER_OFFSET = 0.3; // gate collider sits this far inside the gap, toward the track

/** Railway: track, fences, level crossing. `cfg` is injectable for tests. */
export function createRailway(cfg: TrainCfg = TRAIN_CFG): Feature {
  let ctx: WorldContext | null = null;
  let track: Track | null = null;
  let fences: Fences | null = null;
  let gear: CrossingGear | null = null;
  let ids: string[] = [];
  let gateIds: string[] = [];
  let closed = false; // last broadcast state (default open)
  let a = 0;

  return {
    name: 'railway',

    init(c) {
      ctx = c;
      const { railway, fences: fl, crossing } = LAYOUT;
      track = buildTrack(railway.z, railway.xMin, railway.xMax, c.terrain.heightAt(0, railway.z));

      const gap: [number, number] = [fl.gap.xMin, fl.gap.xMax];
      const segs = fenceSegments(fl.zs, fl.xMin, fl.xMax, gap);
      ids = segs.map((s) => c.colliders.add({ kind: 'box', x: s.x, z: s.z, hw: s.hw, hd: s.hd, rot: 0 }));
      fences = buildFences(segs, c.terrain);

      const [zA, zB] = fl.zs as [number, number];
      gear = buildCrossing([
        { x: gap[0], z: zA, groundY: c.terrain.heightAt(gap[0], zA), dir: 1 },
        { x: gap[1], z: zB, groundY: c.terrain.heightAt(gap[1], zB), dir: -1 },
      ]);
      const cx = (gap[0] + gap[1]) / 2;
      const hw = (gap[1] - gap[0]) / 2;
      gateIds = [zA, zB].map((z) =>
        c.colliders.add({ kind: 'box', x: cx, z: z + Math.sign(railway.z - z) * COLLIDER_OFFSET, hw, hd: 0.15, rot: 0 }),
      );

      // Start in the schedule's state so a late start never animates from open.
      const start = crossingClosed(c.time.elapsed, crossing.x, cfg);
      a = start ? 1 : 0;
      gateIds.forEach((id) => c.colliders.setEnabled(id, start));
      gear.update(a, lampOn(c.time.elapsed));
      c.scene.add(track.group, fences.group, gear.group);
      if (start) {
        closed = true;
        c.bus.emit('crossing:state', { closed });
      }
    },

    update(dt, elapsed) {
      if (!ctx || !gear) return;
      const now = crossingClosed(elapsed, LAYOUT.crossing.x, cfg);
      if (now !== closed) {
        closed = now;
        gateIds.forEach((id) => ctx!.colliders.setEnabled(id, closed));
        ctx.bus.emit('crossing:state', { closed });
      }
      a = stepBarrier(a, closed, dt);
      gear.update(a, lampOn(elapsed));
    },

    dispose() {
      if (ctx) [...ids, ...gateIds].forEach((id) => ctx!.colliders.remove(id));
      track?.dispose();
      fences?.dispose();
      gear?.dispose();
      track = null;
      fences = null;
      gear = null;
      ids = [];
      gateIds = [];
      closed = false;
      a = 0;
      ctx = null;
    },
  };
}

export default createRailway();
