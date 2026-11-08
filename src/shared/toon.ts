import { DataTexture, MeshToonMaterial, NearestFilter, RedFormat, type ColorRepresentation, type Material, type Texture } from 'three';

let gradient: DataTexture | null = null;

/** Shared 3-step ramp for cel shading. */
function gradientMap(): DataTexture {
  if (gradient) return gradient;
  gradient = new DataTexture(new Uint8Array([90, 180, 255]), 3, 1, RedFormat);
  gradient.minFilter = NearestFilter;
  gradient.magFilter = NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

/** M0 stub (signature frozen; upgraded in M1-T1). `rim` is accepted but not yet rendered. */
export function createToonMaterial(opts: { color: ColorRepresentation; map?: Texture; rim?: ColorRepresentation }): Material {
  return new MeshToonMaterial({ color: opts.color, map: opts.map ?? null, gradientMap: gradientMap() });
}
