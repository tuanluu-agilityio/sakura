import type { Group, Mesh, Material } from 'three';
import { LAYOUT } from '../../core/layout';
import type { Feature, WorldContext } from '../../core/types';
import { TRAIN_CFG, trainStateAt } from '../../shared/train-schedule';
import { TrainEventTracker } from './events';
import { buildTrain } from './model';

/** Rail head height above terrain; duplicated by value in the railway feature. */
const RAIL_TOP = 0.42;

let ctx: WorldContext | null = null;
let train: { group: Group; cars: Group[] } | null = null;
let tracker: TrainEventTracker | null = null;

const feature: Feature = {
  name: 'train',

  init(c) {
    ctx = c;
    train = buildTrain(TRAIN_CFG);
    train.group.visible = false;
    tracker = new TrainEventTracker(LAYOUT.crossing.x, TRAIN_CFG);
    c.scene.add(train.group);
  },

  update(_dt, elapsed) {
    if (!ctx || !train || !tracker) return;
    const s = trainStateAt(elapsed, TRAIN_CFG);
    train.group.visible = s.active;
    if (s.active) {
      const z = LAYOUT.railway.z;
      train.cars.forEach((car, i) => {
        const x = s.frontX - s.direction * TRAIN_CFG.carLength * (i + 0.5);
        car.position.set(x, ctx!.terrain.heightAt(x, z) + RAIL_TOP + 0.01 * Math.sin(elapsed * 3.1 + i), z);
        car.rotation.y = s.direction === 1 ? 0 : Math.PI;
        car.rotation.z = 0.004 * Math.sin(elapsed * 1.7 + i);
      });
    }
    for (const e of tracker.advance(elapsed)) {
      if (e.type === 'approach') ctx.bus.emit('train:approach', { direction: e.direction, eta: e.eta });
      else if (e.type === 'pass') ctx.bus.emit('train:pass', { direction: e.direction });
      else ctx.bus.emit('train:clear', { direction: e.direction });
    }
  },

  dispose() {
    if (!train) return;
    const geos = new Set<unknown>();
    const mats = new Set<Material>();
    train.group.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      geos.add(m.geometry);
      mats.add(m.material as Material);
    });
    geos.forEach((g) => (g as { dispose(): void }).dispose());
    mats.forEach((m) => m.dispose());
    train.group.removeFromParent();
    train = null;
    tracker = null;
    ctx = null;
  },
};

export default feature;
