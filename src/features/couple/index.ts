import type { Vector3 } from 'three';
import { LAYOUT } from '../../core/layout';
import type { Feature, WorldContext } from '../../core/types';
import { LOOKS } from '../../shared/chibi';
import { loadCharacter, type CharacterRig } from '../../shared/characters';
import { createBench, SEAT_HEIGHT } from './bench';
import { createHeadAnimator, findHeadBone, type HeadAnimator } from './head';

/** Sit clip puts hips 0.2H above the root; sink the root so the thighs rest on the seat (fraction of height). */
const SIT_Y_OFFSET = -0.15;
const SEAT_DX = 0.4;

interface Sitter { rig: CharacterRig; head: HeadAnimator; base: Vector3; phase: number; side: 1 | -1 }

let bench: ReturnType<typeof createBench> | null = null;
let sitters: Sitter[] = [];
let colliderIds: string[] = [];
let ctxRef: WorldContext | null = null;

async function seat(ctx: WorldContext, id: 'boy' | 'girl', x: number, seatTop: number, side: 1 | -1, phase: number, delay: number): Promise<void> {
  try {
    const rig = await loadCharacter(ctx, id);
    rig.play('sit', 0);
    rig.update(0);
    rig.root.rotation.y = 0;
    rig.root.position.set(x, seatTop + SIT_Y_OFFSET * LOOKS[id].height, LAYOUT.bench.z);
    const head = createHeadAnimator(findHeadBone(rig.root), Math.random, delay);
    head.captureRest();
    ctx.scene.add(rig.root);
    sitters.push({ rig, head, base: rig.root.scale.clone(), phase, side });
    colliderIds.push(ctx.colliders.add({ kind: 'circle', x, z: LAYOUT.bench.z, r: 0.5 }));
  } catch (e) {
    console.warn(`[couple] ${id} skipped`, e);
  }
}

const feature: Feature = {
  name: 'couple',
  async init(ctx) {
    ctxRef = ctx;
    const { x, z } = LAYOUT.bench;
    const groundY = ctx.terrain.heightAt(x, z);
    bench = createBench(x, z, groundY);
    ctx.scene.add(bench.group);
    colliderIds.push(ctx.colliders.add(bench.collider));
    const seatTop = groundY + SEAT_HEIGHT;
    await Promise.all([
      seat(ctx, 'boy', x - SEAT_DX, seatTop, 1, 0, 0),
      seat(ctx, 'girl', x + SEAT_DX, seatTop, -1, 1.3, 3),
    ]);
  },
  update(dt, elapsed) {
    for (const s of sitters) {
      s.rig.update(dt);
      s.head.update(dt, s.side);
      s.rig.root.scale.y = s.base.y * (1 + 0.008 * Math.sin((2 * Math.PI * elapsed) / 4 + s.phase));
    }
  },
  dispose() {
    for (const s of sitters) { s.rig.root.removeFromParent(); s.rig.dispose(); }
    for (const id of colliderIds) ctxRef?.colliders.remove(id);
    bench?.dispose();
    sitters = []; colliderIds = []; bench = null; ctxRef = null;
  },
};

export default feature;
