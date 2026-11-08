import type { Material, Mesh } from 'three';
import type { Feature, QualityProfile, WorldContext } from '../../core/types';
import { createHedgeColliders } from './boundary';
import { createGrass } from './grass';
import { heightAt } from './height';
import { createTerrainMesh } from './mesh';
import { surfaceAt } from './surface';

let ctx: WorldContext | null = null;
let mesh: Mesh | null = null;
let grass: ReturnType<typeof createGrass> | null = null;
let removeHedge: (() => void) | null = null;

const feature: Feature = {
  name: 'terrain',
  init(c) {
    ctx = c;
    c.provideTerrain({ heightAt, surfaceAt });
    mesh = createTerrainMesh();
    c.scene.add(mesh);
    removeHedge = createHedgeColliders(c.colliders);
    grass = createGrass({ scene: c.scene, wind: c.wind });
    grass.setQuality(c.quality.grassDensity);
  },
  update(_dt, elapsed) {
    grass?.update(elapsed);
  },
  setQuality(p: QualityProfile) {
    grass?.setQuality(p.grassDensity);
  },
  dispose() {
    grass?.dispose();
    grass = null;
    removeHedge?.();
    removeHedge = null;
    if (mesh) {
      ctx?.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as Material).dispose();
      mesh = null;
    }
  },
};

export default feature;
