import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../core/layout';
import { QUALITY_PROFILES } from '../../core/quality';
import type { QualityProfile } from '../../core/types';
import type { ShaderMaterial } from 'three';
import { createFallingPetals, createPetalUniforms, mulberry32, petalCount, petalVolumes } from './falling';

describe('petalCount', () => {
  it('halves the profile count under reduced motion', () => {
    expect(petalCount({ petals: 1500 } as QualityProfile, true)).toBe(750);
    expect(petalCount({ petals: 1501 } as QualityProfile, true)).toBe(750);
    expect(petalCount(QUALITY_PROFILES.high, false)).toBe(8000);
  });
});

describe('petalVolumes', () => {
  const { volumes, weights } = petalVolumes(LAYOUT.trees);

  it('returns hero + 12 secondary volumes', () => {
    expect(volumes).toHaveLength(13);
    expect(weights).toHaveLength(13);
  });

  it('hero volume is first, centred on the main tree, radius >= 9', () => {
    const hero = volumes[0]!;
    expect(hero.x).toBe(LAYOUT.mainTree.x);
    expect(hero.z).toBe(LAYOUT.mainTree.z);
    expect(hero.radius).toBeGreaterThanOrEqual(9);
  });

  it('weights sum to 1 and the hero weight is > 0.25', () => {
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(weights[0]!).toBeGreaterThan(0.25);
    for (const w of weights) expect(w).toBeGreaterThan(0);
  });

  it('crown bands sit above the ground and scale with the tree', () => {
    for (const v of volumes) {
      expect(v.yTop).toBeGreaterThan(v.yBottom);
      expect(v.yBottom).toBeGreaterThan(0);
    }
    expect(volumes[0]!.yTop).toBeCloseTo(11.2, 1);
  });
});

describe('createFallingPetals', () => {
  const flat = { heightAt: () => 0, surfaceAt: () => 'grass' as const };

  it('builds ONE unculled InstancedMesh with per-instance seeds and the influence hook', () => {
    const uniforms = createPetalUniforms();
    const mesh = createFallingPetals({ count: 750, terrain: flat, rand: mulberry32(1), uniforms });
    expect(mesh.count).toBe(750);
    expect(mesh.frustumCulled).toBe(false);
    expect(mesh.geometry.getAttribute('aSeed').count).toBe(750);
    expect(mesh.geometry.getAttribute('aBase').count).toBe(750);
    const mat = mesh.material as ShaderMaterial;
    expect(mat.userData.influence).toBe(uniforms.uInfluence.value);
    expect(mat.uniforms.uInfluence).toBe(uniforms.uInfluence);
    expect(uniforms.uInfluence.value.toArray()).toEqual([0, 0, 0, 0]);
    const lat = mesh.geometry.getAttribute('aLateral');
    for (let i = 0; i < lat.count; i++) expect(lat.getX(i)).toBeLessThanOrEqual(1);
  });
});
