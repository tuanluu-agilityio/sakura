import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Group, Object3D, Scene, Vector2, Vector3 } from 'three';
import { createColliders } from '../core/colliders';
import { LAYOUT, distanceToPolyline, type XZ } from '../core/layout';
import type { Collider, ColliderRegistry, WorldContext } from '../core/types';
import couple from '../features/couple';
import railway from '../features/railway';
import sakuraTrees from '../features/sakura-trees';
import { heightAt } from '../features/terrain/height';
import { surfaceAt } from '../features/terrain/surface';
import train from '../features/train';
import village from '../features/village';
import { HOUSE } from '../features/village/placement';

vi.mock('../shared/characters', () => ({
  loadCharacter: vi.fn(async () => {
    const root = new Group();
    root.add(Object.assign(new Object3D(), { name: 'head' }));
    return { root, play: vi.fn(), update: vi.fn(), dispose: vi.fn(), clipNames: [] };
  }),
}));

type Box = Extract<Collider, { kind: 'box' }>;
type Circle = Extract<Collider, { kind: 'circle' }>;

const PLAYER_RADIUS = 0.35;
const SIGHT_CLEARANCE = 0.4;
/** Elapsed time with no train near the crossing: the gates are open. */
const OPEN_TIME = 20;
const SEAT_SIDE = 0.4;

const items = new Map<string, { c: Collider; on: boolean }>();
let registry: ColliderRegistry;

function recordingRegistry(): ColliderRegistry {
  const real = createColliders();
  return {
    ...real,
    add(c) { const id = real.add(c); items.set(id, { c, on: true }); return id; },
    setEnabled(id, on) { real.setEnabled(id, on); const it = items.get(id); if (it) it.on = on; },
    remove(id) { real.remove(id); items.delete(id); },
  };
}

const active = (): Collider[] => [...items.values()].filter((i) => i.on).map((i) => i.c);
const circles = (): Circle[] => active().filter((c): c is Circle => c.kind === 'circle');
const boxes = (): Box[] => active().filter((c): c is Box => c.kind === 'box');

/** Grid of world points covering a box, boundary included (same local frame as core/colliders). */
function boxPoints(b: Box, step = 0.05): XZ[] {
  const cos = Math.cos(b.rot);
  const sin = Math.sin(b.rot);
  const nx = Math.ceil((2 * b.hw) / step);
  const nz = Math.ceil((2 * b.hd) / step);
  const out: XZ[] = [];
  for (let i = 0; i <= nx; i++) {
    for (let k = 0; k <= nz; k++) {
      const lx = -b.hw + (2 * b.hw * i) / nx;
      const lz = -b.hd + (2 * b.hd * k) / nz;
      out.push({ x: b.x + lx * cos + lz * sin, z: b.z - lx * sin + lz * cos });
    }
  }
  return out;
}

function insideBox(p: XZ, b: Box): boolean {
  const cos = Math.cos(b.rot);
  const sin = Math.sin(b.rot);
  const dx = p.x - b.x;
  const dz = p.z - b.z;
  return Math.abs(dx * cos - dz * sin) <= b.hw && Math.abs(dx * sin + dz * cos) <= b.hd;
}

function isBridgeRailing(b: Box): boolean {
  const { x, z, length, width } = LAYOUT.bridge;
  return b.z === z && b.hd === length / 2 && Math.abs(Math.abs(b.x - x) - (width / 2 + 0.05)) < 1e-9;
}

const hero = (): Circle => {
  const c = circles().find((t) => t.x === LAYOUT.mainTree.x && t.z === LAYOUT.mainTree.z);
  if (!c) throw new Error('hero tree collider missing');
  return c;
};

beforeAll(async () => {
  registry = recordingRegistry();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ctx = {
    scene: new Scene(),
    terrain: { heightAt, surfaceAt },
    colliders: registry,
    quality: { level: 'low' },
    wind: { direction: new Vector2(1, 0), strength: 0, gust: 0 },
    bus: { emit: vi.fn(), on: vi.fn() },
    time: { elapsed: OPEN_TIME },
  } as unknown as WorldContext;
  for (const f of [sakuraTrees, railway, train, village, couple]) await f.init(ctx);
});

describe('M2 collider audit', () => {
  it('has gates open at the audit time and registers the expected colliders', () => {
    expect(boxes().filter((b) => b.hw === HOUSE.hw && b.hd === HOUSE.hd)).toHaveLength(LAYOUT.village.houses);
    expect(boxes().filter(isBridgeRailing)).toHaveLength(2);
    expect([...items.values()].filter((i) => !i.on)).toHaveLength(2); // the two crossing gates
  });

  it('keeps every static collider off the path corridor, except the bridge railings', () => {
    const half = LAYOUT.pathWidth / 2;
    for (const c of circles()) expect(distanceToPolyline(c.x, c.z, LAYOUT.path) - c.r).toBeGreaterThanOrEqual(half);
    for (const b of boxes()) {
      if (isBridgeRailing(b)) continue;
      const min = Math.min(...boxPoints(b, 0.1).map((p) => distanceToPolyline(p.x, p.z, LAYOUT.path)));
      expect(min, `box at ${b.x},${b.z}`).toBeGreaterThanOrEqual(half);
    }
  });

  it('never overlaps two house boxes', () => {
    const houses = boxes().filter((b) => b.hw === HOUSE.hw && b.hd === HOUSE.hd);
    for (const a of houses) {
      for (const b of houses) {
        if (a !== b) expect(boxPoints(a, 0.2).some((p) => insideBox(p, b))).toBe(false);
      }
    }
  });

  it('keeps the bench and the couple clear of the hero trunk circle', () => {
    const t = hero();
    const { x, z } = LAYOUT.bench;
    const near = boxes().filter((b) => Math.hypot(b.x - x, b.z - z) < 0.01);
    const seats = circles().filter((c) => c !== t && Math.abs(c.z - z) < 0.01 && Math.abs(c.x - x) <= SEAT_SIDE + 0.01);
    expect(near).toHaveLength(1);
    expect(seats).toHaveLength(2);
    for (const b of near) for (const p of boxPoints(b)) expect(Math.hypot(p.x - t.x, p.z - t.z)).toBeGreaterThan(t.r);
    for (const c of seats) expect(Math.hypot(c.x - t.x, c.z - t.z)).toBeGreaterThan(c.r + t.r);
  });

  it('lets a walker follow the path from spawn to the crossing unblocked', () => {
    const path = [{ x: LAYOUT.spawn.x, z: LAYOUT.spawn.z }, ...LAYOUT.path.slice(1, 3), LAYOUT.crossing];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1);
      for (let k = 1; k <= steps; k++) {
        const x = a.x + ((b.x - a.x) * k) / steps;
        const z = a.z + ((b.z - a.z) * k) / steps;
        const pos = registry.resolve(new Vector3(x, 0, z), PLAYER_RADIUS);
        expect(Math.hypot(pos.x - x, pos.z - z), `blocked at ${x},${z}`).toBeLessThan(1e-6);
      }
    }
  });
});

describe('M2 bridge deck', () => {
  it('is wood and not below the banks', () => {
    const { x, z, length, width } = LAYOUT.bridge;
    const bank = Math.max(heightAt(x, z - length / 2 - 0.5), heightAt(x, z + length / 2 + 0.5));
    for (let i = 0; i <= 12; i++) {
      for (const dx of [-width / 2, 0, width / 2]) {
        const pz = z - length / 2 + (length * i) / 12;
        expect(heightAt(x + dx, pz)).toBeGreaterThanOrEqual(bank - 0.05);
        expect(surfaceAt(x + dx, pz)).toBe('wood');
      }
    }
  });
});

describe('M2 sightline', () => {
  it('from the intro end camera to both seats clears the trunk and the mound', () => {
    const { to } = LAYOUT.intro;
    const t = hero();
    const seatY = heightAt(LAYOUT.bench.x, LAYOUT.bench.z) + 0.45;
    for (const side of [-SEAT_SIDE, SEAT_SIDE]) {
      const seat = { x: LAYOUT.bench.x + side, z: LAYOUT.bench.z };
      expect(distanceToPolyline(t.x, t.z, [to, seat]) - t.r).toBeGreaterThanOrEqual(SIGHT_CLEARANCE);
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        const y = to.y + (seatY - to.y) * f;
        expect(heightAt(to.x + (seat.x - to.x) * f, to.z + (seat.z - to.z) * f)).toBeLessThanOrEqual(y);
      }
    }
  });
});
