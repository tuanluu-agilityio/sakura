import { BoxGeometry, BufferAttribute, BufferGeometry, Color, InstancedMesh, Matrix4, Mesh, ShaderMaterial, UniformsLib, UniformsUtils, type Material } from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import { createToonMaterial } from '../../shared/toon';
import vertexShader from './stream.vert.glsl?raw';
import fragmentShader from './paddy.frag.glsl?raw';

const PLOT_W = 8;
const PLOT_D = 6;
const DIKE_W = 0.4;
const DIKE_H = 0.25;
const WATER_LIFT = 0.05;

export interface Paddies { dikes: InstancedMesh; water: Mesh; material: ShaderMaterial; disposables: { dispose(): void }[] }

/** 8 x 6 m plots on a grid: one InstancedMesh of dikes and one merged mesh of flat water cells. */
export function buildPaddies(heightAt: (x: number, z: number) => number): Paddies {
  const { xMin, xMax, zMin, zMax } = LAYOUT.paddies;
  const cols = Math.floor((xMax - xMin) / PLOT_W);
  const rows = Math.floor((zMax - zMin) / PLOT_D);

  // Dikes: every plot edge segment once (vertical lines, then horizontal lines).
  const dikeGeo = new BoxGeometry(1, DIKE_H, 1);
  const dikeMat = createToonMaterial({ color: new Color(PALETTE.grassDark).lerp(new Color(PALETTE.trunk), 0.45) });
  const edges: [number, number, number, number][] = []; // cx, cz, sx, sz
  for (let i = 0; i <= cols; i++)
    for (let j = 0; j < rows; j++) edges.push([xMin + i * PLOT_W, zMin + (j + 0.5) * PLOT_D, DIKE_W, PLOT_D + DIKE_W]);
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i < cols; i++) edges.push([xMin + (i + 0.5) * PLOT_W, zMin + j * PLOT_D, PLOT_W + DIKE_W, DIKE_W]);
  const dikes = new InstancedMesh(dikeGeo, dikeMat, edges.length);
  const m = new Matrix4();
  edges.forEach(([cx, cz, sx, sz], k) => {
    m.makeScale(sx, 1, sz).setPosition(cx, heightAt(cx, cz) + DIKE_H / 2 - 0.05, cz);
    dikes.setMatrixAt(k, m);
  });
  dikes.receiveShadow = true;
  dikes.castShadow = true;
  dikes.name = 'paddy-dikes';

  // Water: one flat quad per plot (inside the dikes) at the highest sampled ground + lift, merged into a single draw call.
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const inner = DIKE_W / 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = xMin + i * PLOT_W + inner;
      const x1 = xMin + (i + 1) * PLOT_W - inner;
      const z0 = zMin + j * PLOT_D + inner;
      const z1 = zMin + (j + 1) * PLOT_D - inner;
      let y = -Infinity;
      for (const [sx, sz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]] as const) y = Math.max(y, heightAt(sx, sz));
      y += WATER_LIFT;
      const b = pos.length / 3;
      pos.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
    }
  }
  const waterGeo = new BufferGeometry();
  waterGeo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  waterGeo.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  waterGeo.setIndex(idx);
  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uTime: { value: 0 },
        uSkyTop: { value: new Color(PALETTE.skyTop) },
        uSkyHorizon: { value: new Color(PALETTE.skyHorizon) },
        uColor: { value: new Color(PALETTE.water).lerp(new Color(PALETTE.grassDark), 0.3) },
      },
    ]),
    vertexShader,
    fragmentShader,
    fog: true,
  });
  const water = new Mesh(waterGeo, material);
  water.name = 'paddy-water';
  return { dikes, water, material, disposables: [dikeGeo, dikeMat as Material, waterGeo, material] };
}
