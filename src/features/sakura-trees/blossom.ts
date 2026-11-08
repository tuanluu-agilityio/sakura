import {
  BufferAttribute, BufferGeometry, Color, DataTexture, DoubleSide, Euler, InstancedMesh, LinearFilter,
  LinearMipmapLinearFilter, Matrix4, MeshBasicMaterial, MeshDepthMaterial, Quaternion, RGBADepthPacking,
  SRGBColorSpace, Vector2, Vector3, type Material, type Texture, type WebGLProgramParametersWithUniforms,
} from 'three';
import { PALETTE } from '../../core/palette';
import { mulberry32 } from './rng';
import swayVert from './sway.vert.glsl?raw';

export interface SwayUniforms { uTime: { value: number }; uGust: { value: number }; uWindDir: { value: Vector2 } }

export function createSwayUniforms(): SwayUniforms {
  return { uTime: { value: 0 }, uGust: { value: 0 }, uWindDir: { value: new Vector2(1, 0) } };
}

const ALPHA_TEST = 0.4;
const DEEP_SHARE = 0.4;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Soft five-lobed radial alpha mask (row-major, 0..255). */
export function radialAlpha(size: number): Uint8Array {
  const out = new Uint8Array(size * size);
  const h = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - h) / h;
      const dy = (y + 0.5 - h) / h;
      const r = Math.hypot(dx, dy);
      const edge = 0.85 + 0.12 * Math.cos(5 * Math.atan2(dy, dx));
      out[y * size + x] = Math.round(255 * (1 - smoothstep(edge - 0.3, edge, r)));
    }
  }
  return out;
}

/** Blossom card texture: white, slightly brighter centre, radial alpha. */
export function createBlossomTexture(size = 64): DataTexture {
  const alpha = radialAlpha(size);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i]!;
    const v = Math.round(255 * (0.86 + 0.14 * (a / 255)));
    data.set([v, v, v, a], i * 4);
  }
  const tex = new DataTexture(data, size, size);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Two crossed unit quads centred on the origin (4 triangles). */
export function createCardGeometry(): BufferGeometry {
  const s = 0.5;
  const pos = [-s, -s, 0, s, -s, 0, s, s, 0, -s, s, 0, 0, -s, -s, 0, -s, s, 0, s, s, 0, s, -s];
  const nor = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];
  const uv = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1];
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  return g;
}

/** Hooks the sway shader into a built-in material (colour pass shades by vShade). */
function injectSway(mat: Material, uniforms: Record<string, { value: unknown }>, shade: boolean): void {
  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${swayVert}`)
      .replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * sakuraSway(transformed);\ngl_Position = projectionMatrix * mvPosition;');
    if (shade) {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vShade;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vShade;');
    }
  };
}

export interface BlossomOptions {
  anchors: Float32Array; height: number; seed: number;
  geometry: BufferGeometry; map: Texture; sway: SwayUniforms;
}

/** One InstancedMesh of blossom cards per tree; materials are owned by the mesh. */
export function createBlossom(o: BlossomOptions): InstancedMesh {
  const uniforms = { ...o.sway, uTreeHeight: { value: o.height } };
  const material = new MeshBasicMaterial({ map: o.map, alphaTest: ALPHA_TEST, side: DoubleSide });
  injectSway(material, uniforms, true);
  const depth = new MeshDepthMaterial({ map: o.map, alphaTest: ALPHA_TEST, depthPacking: RGBADepthPacking, side: DoubleSide });
  injectSway(depth, uniforms, false);

  const count = o.anchors.length / 4;
  const mesh = new InstancedMesh(o.geometry, material, count);
  mesh.customDepthMaterial = depth;
  mesh.castShadow = true;

  const rng = mulberry32(o.seed + 0x5eed);
  const light = new Color(PALETTE.blossom);
  const deep = new Color(PALETTE.blossomDeep);
  const m = new Matrix4();
  const p = new Vector3();
  const q = new Quaternion();
  const e = new Euler();
  const s = new Vector3();
  for (let i = 0; i < count; i++) {
    const a = o.anchors;
    p.set(a[i * 4]!, a[i * 4 + 1]!, a[i * 4 + 2]!);
    e.set((rng() - 0.5) * 1.0, rng() * Math.PI * 2, (rng() - 0.5) * 1.0);
    const size = a[i * 4 + 3]!;
    m.compose(p, q.setFromEuler(e), s.set(size, size, size));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, rng() < DEEP_SHARE ? deep : light);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
