import { describe, expect, it } from 'vitest';
import { ShaderLib, type WebGLProgramParametersWithUniforms, type WebGLRenderer } from 'three';
import { createToonMaterial, fogRange, injectAt, toonBand } from './toon';

const samples = (n: number): number[] => Array.from({ length: n }, (_, i) => -1 + (2 * i) / (n - 1));

describe('toonBand', () => {
  it('is monotonic non-decreasing over [-1, 1]', () => {
    const values = samples(1000).map(toonBand);
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
  });

  it('has a floor-lit minimum of 0.3 (never black)', () => {
    expect(toonBand(-1)).toBe(0.3);
  });

  it('has exactly 3 plateaus when sampled at 200 points', () => {
    // A plateau = a group of >= 5 samples whose values agree within 0.001.
    const plateaus: { value: number; count: number }[] = [];
    for (const v of samples(200).map(toonBand)) {
      const hit = plateaus.find((p) => Math.abs(p.value - v) <= 0.001);
      if (hit) hit.count++;
      else plateaus.push({ value: v, count: 1 });
    }
    expect(plateaus.filter((p) => p.count >= 5)).toHaveLength(3);
  });
});

describe('fogRange', () => {
  it('maps viewDistance 220 to near 77, far 220', () => {
    const r = fogRange(220);
    expect(r.near).toBeCloseTo(77, 6);
    expect(r.far).toBe(220);
  });
});

describe('createToonMaterial', () => {
  it('tags the material as toon', () => {
    expect(createToonMaterial({ color: '#fff' }).userData.toon).toBe(true);
  });
});

describe('toon shader patch', () => {
  it('throws when an anchor is missing', () => {
    expect(() => injectAt('void main() {}', '#include <lights_fragment_end>', 'x')).toThrow(/anchor missing/);
  });

  it('patches the physical fragment shader at both anchors', () => {
    const mat = createToonMaterial({ color: '#fff' });
    const shader = { uniforms: {}, fragmentShader: ShaderLib.physical.fragmentShader } as unknown as WebGLProgramParametersWithUniforms;
    mat.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.fragmentShader).toContain('#define RE_Direct RE_Direct_SakuraToon');
    expect(shader.fragmentShader).toContain('sakuraRef');
    expect(shader.uniforms).toHaveProperty('uToonShadowTint');
  });
});
