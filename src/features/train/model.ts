import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, type BufferGeometry, type Material } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE } from '../../core/palette';
import { createToonMaterial } from '../../shared/toon';
import type { TrainCfg } from '../../shared/train-schedule';

const W = 2.9;
const H = 3.3;
const BODY_Y = 0.5 + H / 2; // body bottom clears the bogies
const WINDOWS = 7;

/** Builds the train; long axis = x, car centred on the origin of its own group. Geometries/materials are shared. */
export function buildTrain(cfg: TrainCfg): { group: Group; cars: Group[] } {
  const L = cfg.carLength;
  const body = new RoundedBoxGeometry(L, H, W, 3, 0.35);
  const stripe = new BoxGeometry(L - 0.2, 0.45, W + 0.04);
  const roof = new BoxGeometry(L - 1.2, 0.18, W - 0.5);
  const winW = (L - 3) / WINDOWS - 0.5;
  const win = new BoxGeometry(winW, 0.9, 0.04);
  const bogie = new BoxGeometry(3.4, 0.4, 1.9);
  const wheel = new CylinderGeometry(0.4, 0.4, 0.12, 14);
  wheel.rotateX(Math.PI / 2);
  const bodyMat = createToonMaterial({ color: PALETTE.trainBody });
  const stripeMat = createToonMaterial({ color: PALETTE.trainStripe });
  const roofMat = createToonMaterial({ color: '#8a8f96' });
  const darkMat = createToonMaterial({ color: '#2a2d33' });
  const winMat = new MeshBasicMaterial({ color: '#ffe9b0' });

  const group = new Group();
  group.name = 'train';
  const cars: Group[] = [];
  const add = (parent: Group, g: BufferGeometry, m: Material, x: number, y: number, z: number): void => {
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
  };
  for (let i = 0; i < cfg.cars; i++) {
    const car = new Group();
    car.name = `train-car-${i}`;
    add(car, body, bodyMat, 0, BODY_Y, 0);
    add(car, stripe, stripeMat, 0, BODY_Y - 0.6, 0);
    add(car, roof, roofMat, 0, BODY_Y + H / 2 + 0.05, 0);
    for (let w = 0; w < WINDOWS; w++) {
      const x = ((w + 0.5) / WINDOWS - 0.5) * (L - 3);
      for (const side of [-1, 1]) add(car, win, winMat, x, BODY_Y + 0.55, side * (W / 2 + 0.03));
    }
    for (const bx of [-L * 0.3, L * 0.3]) {
      add(car, bogie, darkMat, bx, 0.3, 0);
      for (const wx of [-1.2, 1.2]) for (const side of [-1, 1]) add(car, wheel, darkMat, bx + wx, 0.4, side * 0.85);
    }
    cars.push(car);
    group.add(car);
  }
  return { group, cars };
}
