import { describe, it, expect } from 'vitest';
import { Color, DoubleSide, InstancedMesh, MeshDepthMaterial, type MeshBasicMaterial } from 'three';
import { PALETTE } from '../../core/palette';
import { createBlossom, createBlossomTexture, createCardGeometry, createSwayUniforms, radialAlpha } from './blossom';
import { buildTree } from './trunk';

describe('radialAlpha', () => {
  it('is opaque in the centre and transparent in the corners', () => {
    const size = 32;
    const a = radialAlpha(size);
    expect(a.length).toBe(size * size);
    expect(a[(size / 2) * size + size / 2]).toBe(255);
    expect(a[0]).toBe(0);
    expect(a[size * size - 1]).toBe(0);
  });
});

// instanceColor is a Float32 buffer, so compare with a tolerance.
const near = (a: Color, b: Color): boolean => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 1e-5;

describe('createBlossom', () => {
  const tree = buildTree(7, 2.2);
  const tex = createBlossomTexture();
  const geo = createCardGeometry();
  const mesh = createBlossom({ anchors: tree.blossomAnchors, height: tree.height, seed: 7, geometry: geo, map: tex, sway: createSwayUniforms() });

  it('is one InstancedMesh with one instance per anchor', () => {
    expect(mesh).toBeInstanceOf(InstancedMesh);
    expect(mesh.count).toBe(tree.blossomAnchors.length / 4);
    expect(geo.index!.count / 3).toBe(4); // two crossed quads
  });

  it('mixes blossom and blossomDeep about 60/40', () => {
    const light = new Color(PALETTE.blossom);
    const deep = new Color(PALETTE.blossomDeep);
    const c = new Color();
    let nLight = 0;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getColorAt(i, c);
      if (near(c, light)) nLight++;
      else expect(near(c, deep)).toBe(true);
    }
    const share = nLight / mesh.count;
    expect(share).toBeGreaterThan(0.53);
    expect(share).toBeLessThan(0.67);
  });

  it('uses alpha-tested double-sided cards that cast matching shadows', () => {
    const m = mesh.material as MeshBasicMaterial;
    expect(m.alphaTest).toBe(0.4);
    expect(m.side).toBe(DoubleSide);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.customDepthMaterial).toBeInstanceOf(MeshDepthMaterial);
    expect(mesh.customDepthMaterial!.alphaTest).toBe(0.4);
    expect(m.onBeforeCompile).toBeTypeOf('function');
  });
});
