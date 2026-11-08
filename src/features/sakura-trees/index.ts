import { Group, Mesh, type BufferGeometry, type InstancedMesh, type Material, type Texture } from 'three';
import { LAYOUT } from '../../core/layout';
import { PALETTE } from '../../core/palette';
import type { Feature, WorldContext } from '../../core/types';
import { createToonMaterial } from '../../shared/toon';
import { createBlossom, createBlossomTexture, createCardGeometry, createSwayUniforms } from './blossom';
import { buildTree } from './trunk';

const HERO = { seed: 7, scale: 2.2 };
const SECONDARY_SEED = 100;
const COLLIDER_RADIUS = 0.45; // x scale

let ctx: WorldContext | null = null;
const sway = createSwayUniforms();
const groups: Group[] = [];
const geometries: BufferGeometry[] = [];
const blossoms: InstancedMesh[] = [];
const colliderIds: string[] = [];
let trunkMaterial: Material | null = null;
let blossomTexture: Texture | null = null;

const feature: Feature = {
  name: 'sakura-trees',

  init(c) {
    ctx = c;
    trunkMaterial = createToonMaterial({ color: PALETTE.trunk });
    blossomTexture = createBlossomTexture();
    const card = createCardGeometry();
    geometries.push(card);

    const spots = [
      { x: LAYOUT.mainTree.x, z: LAYOUT.mainTree.z, scale: HERO.scale, seed: HERO.seed },
      ...LAYOUT.trees.map((t, i) => ({ ...t, seed: SECONDARY_SEED + i })),
    ];
    for (const s of spots) {
      const tree = buildTree(s.seed, s.scale);
      geometries.push(tree.trunk);

      const group = new Group();
      group.name = `sakura-tree-${s.seed}`;
      // Read lazily: terrain registers first and provides heightAt (hero sits on the mound).
      group.position.set(s.x, c.terrain.heightAt(s.x, s.z), s.z);

      const trunk = new Mesh(tree.trunk, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      const blossom = createBlossom({
        anchors: tree.blossomAnchors, height: tree.height, seed: s.seed,
        geometry: card, map: blossomTexture, sway,
      });
      blossom.castShadow = c.quality?.level !== 'low';
      group.add(trunk, blossom);
      c.scene.add(group);
      groups.push(group);
      blossoms.push(blossom);
      colliderIds.push(c.colliders.add({ kind: 'circle', x: s.x, z: s.z, r: COLLIDER_RADIUS * s.scale }));
    }
  },

  update(_dt, elapsed) {
    if (!ctx) return;
    sway.uTime.value = elapsed;
    sway.uGust.value = ctx.wind.gust;
    sway.uWindDir.value.copy(ctx.wind.direction);
  },

  setQuality(p) {
    // Blossom shadow casting is the only costly part; skip it on low.
    for (const b of blossoms) b.castShadow = p.level !== 'low';
  },

  dispose() {
    for (const g of groups) g.removeFromParent();
    for (const b of blossoms) {
      (b.material as Material).dispose();
      b.customDepthMaterial?.dispose();
      b.dispose();
    }
    for (const g of geometries) g.dispose();
    for (const id of colliderIds) ctx?.colliders.remove(id);
    trunkMaterial?.dispose();
    blossomTexture?.dispose();
    groups.length = geometries.length = blossoms.length = colliderIds.length = 0;
    trunkMaterial = blossomTexture = null;
    ctx = null;
  },
};

export default feature;
