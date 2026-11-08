// Pure terrain height (no THREE/DOM). Units: metres.
import { LAYOUT, distanceToPolyline } from '../../core/layout';

const NOISE_AMP = 0.35;
const NOISE_WAVELENGTH = 25;
const FADE = 4; // noise fades to 0 within this distance of path/mound/embankment/stream
const BANK = 1; // stream bank falloff
const BRIDGE_BLEND = 1.2; // channel fades back in this far from the bridge rect
const EMBANK_FLAT = 2; // half width of the flat rail bed
const EMBANK_RAMP = 3; // ramp length down to ground

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function hash(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1]; one lattice cell per unit of input. */
export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Distance from (x, z) to the bridge rectangle (0 inside). */
export function distToBridge(x: number, z: number): number {
  const { x: bx, z: bz, length, width } = LAYOUT.bridge;
  return Math.hypot(Math.max(Math.abs(x - bx) - width / 2, 0), Math.max(Math.abs(z - bz) - length / 2, 0));
}

export function distToStream(x: number, z: number): number {
  return distanceToPolyline(x, z, LAYOUT.stream.points);
}

export function distToPath(x: number, z: number): number {
  return distanceToPolyline(x, z, LAYOUT.path);
}

export function heightAt(x: number, z: number): number {
  const { mound, railway, stream, pathWidth } = LAYOUT;
  const dMound = Math.hypot(x - mound.x, z - mound.z);
  const dRail = Math.abs(z - railway.z);
  const dStream = distToStream(x, z);

  // Rolling noise, masked out near every authored feature.
  const edge = Math.min(
    distToPath(x, z) - pathWidth / 2,
    dMound - mound.radius,
    dRail - EMBANK_FLAT - EMBANK_RAMP,
    dStream - stream.width / 2 - BANK,
  );
  const noise = (valueNoise(x / NOISE_WAVELENGTH, z / NOISE_WAVELENGTH) * 2 - 1) * NOISE_AMP;
  let h = noise * smoothstep(0, FADE, edge);

  if (dMound < mound.radius) h += mound.height * (0.5 + 0.5 * Math.cos((Math.PI * dMound) / mound.radius));
  h += railway.embankmentHeight * (1 - smoothstep(EMBANK_FLAT, EMBANK_FLAT + EMBANK_RAMP, dRail));

  const carve = (1 - smoothstep(stream.width / 2, stream.width / 2 + BANK, dStream)) * smoothstep(0, BRIDGE_BLEND, distToBridge(x, z));
  return h - stream.depth * carve;
}
