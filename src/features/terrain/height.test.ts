import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../core/layout';
import { heightAt } from './height';

describe('heightAt', () => {
  it('mound top is 1.8', () => {
    expect(Math.abs(heightAt(0, 0) - 1.8)).toBeLessThanOrEqual(0.05);
  });
  it('mound edge blends to ground', () => {
    expect(Math.abs(heightAt(9, 0))).toBeLessThanOrEqual(0.1);
  });
  it('embankment top and ramp', () => {
    expect(Math.abs(heightAt(30, -40) - 1.4)).toBeLessThanOrEqual(0.05);
    const ramp = heightAt(30, -35);
    expect(ramp).toBeGreaterThan(0);
    expect(ramp).toBeLessThan(1.4);
  });
  it('stream channel is carved at a stream vertex', () => {
    // LAYOUT puts the bridge at the stream centre (0,18); the bridge keeps bank level there,
    // so the channel depth is checked at the stream vertex (-40,8) instead.
    const p = LAYOUT.stream.points[1]!;
    expect(heightAt(p.x, p.z)).toBeLessThanOrEqual(-0.55);
  });
  it('bridge keeps bank level', () => {
    expect(heightAt(0, 18)).toBeGreaterThan(-0.1);
  });
  it('path is flattened', () => {
    expect(Math.abs(heightAt(0, 50) - heightAt(3, 50))).toBeLessThanOrEqual(0.15);
  });
  it('is continuous', () => {
    let s = 12345;
    const rnd = (): number => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const { xMin, xMax, zMin, zMax } = LAYOUT.bounds;
    for (let i = 0; i < 2000; i++) {
      const x = xMin + rnd() * (xMax - xMin - 0.2);
      const z = zMin + rnd() * (zMax - zMin - 0.2);
      const a = rnd() * Math.PI * 2;
      const d = Math.abs(heightAt(x, z) - heightAt(x + Math.cos(a) * 0.1, z + Math.sin(a) * 0.1));
      expect(d).toBeLessThan(0.12);
    }
  });
  it('is deterministic', () => {
    expect(heightAt(13.3, -7.7)).toBe(heightAt(13.3, -7.7));
  });
});
