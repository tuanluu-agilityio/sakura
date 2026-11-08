import type { Collider, ColliderRegistry } from './types';
import type { Vector3 } from 'three';

/** Push a circle (px, pz, radius) out of one collider. Returns true if it moved. */
function pushOut(c: Collider, pos: Vector3, radius: number): boolean {
  if (c.kind === 'circle') {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const min = c.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) return false;
    const d = Math.sqrt(d2);
    if (d < 1e-6) {
      pos.x = c.x + min;
      return true;
    }
    pos.x = c.x + (dx / d) * min;
    pos.z = c.z + (dz / d) * min;
    return true;
  }
  // Rotated box: work in the box's local frame.
  const cos = Math.cos(c.rot);
  const sin = Math.sin(c.rot);
  const dx = pos.x - c.x;
  const dz = pos.z - c.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  const cx = Math.max(-c.hw, Math.min(c.hw, lx));
  const cz = Math.max(-c.hd, Math.min(c.hd, lz));
  let nx = lx - cx;
  let nz = lz - cz;
  const d2 = nx * nx + nz * nz;
  let ox: number;
  let oz: number;
  if (d2 > 1e-12) {
    if (d2 >= radius * radius) return false;
    const d = Math.sqrt(d2);
    nx /= d;
    nz /= d;
    ox = cx + nx * radius;
    oz = cz + nz * radius;
  } else {
    // Centre inside the box: exit through the nearest face.
    const px = c.hw - Math.abs(lx);
    const pz = c.hd - Math.abs(lz);
    if (px < pz) {
      ox = Math.sign(lx || 1) * (c.hw + radius);
      oz = lz;
    } else {
      ox = lx;
      oz = Math.sign(lz || 1) * (c.hd + radius);
    }
  }
  pos.x = c.x + ox * cos + oz * sin;
  pos.z = c.z - ox * sin + oz * cos;
  return true;
}

const MAX_STEPS = 64; // beyond this (teleport) skip the sweep and resolve at the destination

export function createColliders(): ColliderRegistry {
  const items = new Map<string, { c: Collider; on: boolean }>();
  let next = 0;

  const pushAll = (pos: Vector3, radius: number): void => {
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const { c, on } of items.values()) if (on && pushOut(c, pos, radius)) moved = true;
      if (!moved) return;
    }
  };

  return {
    add(c) {
      const id = `c${next++}`;
      items.set(id, { c, on: true });
      return id;
    },
    remove(id) {
      items.delete(id);
    },
    setEnabled(id, on) {
      const it = items.get(id);
      if (it) it.on = on;
    },
    resolve(pos, radius, prev) {
      const dist = prev ? Math.hypot(pos.x - prev.x, pos.z - prev.z) : 0;
      const steps = Math.max(1, Math.ceil(dist / (Math.max(radius, 0.01) / 2)));
      if (prev && steps <= MAX_STEPS) {
        const endX = pos.x;
        const endZ = pos.z;
        const endY = pos.y;
        pos.set(prev.x, endY, prev.z);
        for (let i = 1; i <= steps; i++) {
          // Advance from the (already resolved) current position by one sub-step of the total displacement.
          pos.x += (endX - prev.x) / steps;
          pos.z += (endZ - prev.z) / steps;
          pushAll(pos, radius);
        }
        return pos;
      }
      pushAll(pos, radius);
      return pos;
    },
  };
}
