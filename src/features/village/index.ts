import { BufferAttribute, BufferGeometry, Mesh, type Material, type Object3D } from 'three';
import { LAYOUT } from '../../core/layout';
import type { Feature, WorldContext } from '../../core/types';
import { buildBridge, bridgeColliders } from './bridge';
import { buildHouses } from './house';
import { buildLanterns, LANTERN_RADIUS } from './lanterns';
import { buildPaddies } from './paddies';
import { HOUSE, placeHouses } from './placement';
import { WATER_Y, buildRibbon, createStreamMaterial, streamColliders } from './stream';
import { buildTorii, pillarSpots } from './torii';

const HOUSE_SEED = 7;
const HOUSE_GAP = 12;
const HOUSE_MARGIN = 4;
const RIBBON_SEG = 2;
const RIBBON_EXTRA = 1.4; // visual width beyond LAYOUT.stream.width: the bank ramp hides the water until ~2.2 m from the centreline

let ctx: WorldContext | null = null;
let objects: Object3D[] = [];
let disposables: { dispose(): void }[] = [];
let colliderIds: string[] = [];
let timeUniforms: { value: number }[] = [];

const feature: Feature = {
  name: 'village',

  init(c) {
    ctx = c;
    const h = (x: number, z: number): number => c.terrain.heightAt(x, z);
    const add = (...o: Object3D[]): void => { for (const x of o) { c.scene.add(x); objects.push(x); } };
    const own = (...d: { dispose(): void }[]): void => { disposables.push(...d); };
    const collide = (...cs: Parameters<WorldContext['colliders']['add']>[0][]): void => { for (const x of cs) colliderIds.push(c.colliders.add(x)); };

    // Houses
    const v = LAYOUT.village;
    const spots = placeHouses(HOUSE_SEED, { x0: v.xMin, x1: v.xMax, z0: v.zMin, z1: v.zMax }, v.houses, HOUSE_GAP, HOUSE_MARGIN);
    const houses = buildHouses(spots, h);
    add(...houses.meshes);
    own(...houses.geometries, ...houses.materials);
    for (const s of spots) collide({ kind: 'box', x: s.x, z: s.z, hw: HOUSE.hw, hd: HOUSE.hd, rot: s.rot });

    // Paddies (walkable: no colliders)
    const paddies = buildPaddies(h);
    add(paddies.dikes, paddies.water);
    own(...paddies.disposables);
    timeUniforms.push(paddies.material.uniforms.uTime as { value: number });

    // Torii
    const t = LAYOUT.torii;
    const torii = buildTorii(h(t.x, t.z), t.x, t.z);
    add(torii.mesh);
    own(torii.geometry, torii.material);
    for (const p of pillarSpots(t.x, t.z)) collide({ kind: 'circle', x: p.x, z: p.z, r: LANTERN_RADIUS });

    // Lanterns
    const lanterns = buildLanterns(LAYOUT.lanterns, h);
    add(...lanterns.meshes);
    own(...lanterns.geometries, ...lanterns.materials);
    for (const l of LAYOUT.lanterns) collide({ kind: 'circle', x: l.x, z: l.z, r: LANTERN_RADIUS });

    // Stream
    const ribbon = buildRibbon(LAYOUT.stream.points, LAYOUT.stream.width + RIBBON_EXTRA, WATER_Y, RIBBON_SEG);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(ribbon.positions, 3));
    geo.setAttribute('uv', new BufferAttribute(ribbon.uvs, 2));
    geo.setIndex(new BufferAttribute(ribbon.indices, 1));
    const mat = createStreamMaterial();
    const water = new Mesh(geo, mat);
    water.renderOrder = 1;
    water.name = 'stream';
    add(water);
    own(geo, mat);
    timeUniforms.push(mat.uniforms.uTime as { value: number });
    collide(...streamColliders(LAYOUT.stream.points, LAYOUT.stream.width, LAYOUT.bridge));

    // Bridge
    const bridge = buildBridge(h(LAYOUT.bridge.x, LAYOUT.bridge.z));
    add(...bridge.objects);
    own(...bridge.geometries, ...(bridge.materials as Material[]));
    collide(...bridgeColliders());
  },

  update(_dt, elapsed) {
    for (const u of timeUniforms) u.value = elapsed;
  },

  dispose() {
    for (const o of objects) o.removeFromParent();
    for (const d of disposables) d.dispose();
    for (const id of colliderIds) ctx?.colliders.remove(id);
    objects = [];
    disposables = [];
    colliderIds = [];
    timeUniforms = [];
    ctx = null;
  },
};

export default feature;
