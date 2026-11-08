import { BoxGeometry, Color, Group, InstancedMesh, Matrix4, type Material } from 'three';
import type { Terrain } from '../../core/types';
import { createToonMaterial } from '../../shared/toon';
import type { FenceSeg } from './logic';

const POST = { w: 0.12, h: 1.1 };
const RAIL_Y = [0.55, 0.95];
const RAIL_H = 0.07;

export interface Fences { group: Group; dispose(): void }

/** Instanced posts (at segment ends) and two horizontal rails following the collider segments. */
export function buildFences(segs: FenceSeg[], terrain: Terrain): Fences {
  const group = new Group();
  const wood = createToonMaterial({ color: new Color('#a58763') }) as Material;
  const m4 = new Matrix4();

  const posts = new Map<string, [number, number]>();
  for (const s of segs) {
    for (const x of [s.x - s.hw, s.x + s.hw]) posts.set(`${x.toFixed(2)}|${s.z}`, [x, s.z]);
  }
  const postGeo = new BoxGeometry(POST.w, POST.h, POST.w);
  const postMesh = new InstancedMesh(postGeo, wood, posts.size);
  let i = 0;
  for (const [x, z] of posts.values()) postMesh.setMatrixAt(i++, m4.makeTranslation(x, terrain.heightAt(x, z) + POST.h / 2, z));
  postMesh.castShadow = true;
  group.add(postMesh);

  const railGeo = new BoxGeometry(1, RAIL_H, 0.05);
  const rails = RAIL_Y.map((y) => {
    const mesh = new InstancedMesh(railGeo, wood, segs.length);
    segs.forEach((s, k) => {
      m4.makeScale(s.hw * 2, 1, 1).setPosition(s.x, terrain.heightAt(s.x, s.z) + y, s.z);
      mesh.setMatrixAt(k, m4);
    });
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  });

  return {
    group,
    dispose() {
      postMesh.dispose();
      rails.forEach((r) => r.dispose());
      postGeo.dispose();
      railGeo.dispose();
      wood.dispose();
      group.removeFromParent();
    },
  };
}
