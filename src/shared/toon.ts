import { Color, MeshStandardMaterial, type ColorRepresentation, type Material, type Texture } from 'three';
import { PALETTE } from '../core/palette';
import toonSource from './toon.frag.glsl?raw';

/** Single source of truth for the toon ramp; injected into GLSL as #defines. */
export const TOON_CONSTANTS = {
  /** Band edges on the half-lambert axis (ndl * 0.5 + 0.5). */
  bands: [0.35, 0.7],
  /** Full smoothstep width of each band edge. */
  width: 0.06,
  /** Plateau values: floor-lit, mid, fully lit. Floor > 0 so nothing goes black. */
  levels: [0.3, 0.65, 1.0],
  rimPower: 3,
  rimStrength: 0.6,
  rimMix: 0.35,
  shadowMix: 0.45,
} as const;

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Pure TS mirror of `sakuraToonBand` in toon.frag.glsl. `ndl` in [-1, 1], result in [0.3, 1]. */
export function toonBand(ndl: number): number {
  const { bands, width, levels } = TOON_CONSTANTS;
  const h = ndl * 0.5 + 0.5;
  const hw = width / 2;
  const a = smoothstep(bands[0] - hw, bands[0] + hw, h);
  const b = smoothstep(bands[1] - hw, bands[1] + hw, h);
  return levels[0] + (levels[1] - levels[0]) * a + (levels[2] - levels[1]) * b;
}

/** Linear fog range for a quality profile's view distance. */
export function fogRange(viewDistance: number): { near: number; far: number } {
  return { near: viewDistance * 0.35, far: viewDistance };
}

const f = (n: number): string => n.toFixed(4);
const [PARS, MAIN] = toonSource.split('//#split') as [string, string];
const DEFINES = [
  `#define TOON_B0 ${f(TOON_CONSTANTS.bands[0])}`,
  `#define TOON_B1 ${f(TOON_CONSTANTS.bands[1])}`,
  `#define TOON_HW ${f(TOON_CONSTANTS.width / 2)}`,
  `#define TOON_L0 ${f(TOON_CONSTANTS.levels[0])}`,
  `#define TOON_L1 ${f(TOON_CONSTANTS.levels[1])}`,
  `#define TOON_L2 ${f(TOON_CONSTANTS.levels[2])}`,
  `#define TOON_RIM_POWER ${f(TOON_CONSTANTS.rimPower)}`,
  `#define TOON_RIM_STRENGTH ${f(TOON_CONSTANTS.rimStrength)}`,
  `#define TOON_RIM_MIX ${f(TOON_CONSTANTS.rimMix)}`,
  `#define TOON_SHADOW_MIX ${f(TOON_CONSTANTS.shadowMix)}`,
].join('\n');
const PARS_ANCHOR = '#include <lights_physical_pars_fragment>';
const END_ANCHOR = '#include <lights_fragment_end>';

/**
 * Cel-shaded MeshStandardMaterial (shadows, fog, instancing, skinning keep working).
 * 3-band soft ramp, lavender shadow tint (PALETTE.shadowTint), rim light (default PALETTE.snow).
 */
export function createToonMaterial(opts: { color: ColorRepresentation; map?: Texture; rim?: ColorRepresentation }): Material {
  const mat = new MeshStandardMaterial({ color: opts.color, map: opts.map ?? null, roughness: 1, metalness: 0 });
  const shadowTint = { value: new Color(PALETTE.shadowTint) };
  const rim = { value: new Color(opts.rim ?? PALETTE.snow) };
  mat.userData.toon = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uToonShadowTint = shadowTint;
    shader.uniforms.uToonRim = rim;
    shader.fragmentShader = shader.fragmentShader
      .replace(PARS_ANCHOR, () => `${PARS_ANCHOR}\n${DEFINES}\n${PARS}`)
      .replace(END_ANCHOR, () => MAIN);
  };
  mat.customProgramCacheKey = () => 'sakura-toon-v1';
  return mat;
}
