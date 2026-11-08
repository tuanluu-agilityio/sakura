// Pure surface classification. Priority: wood > water > stone > dirt > grass.
import { LAYOUT } from '../../core/layout';
import type { Surface } from '../../core/types';
import { distToBridge, distToPath, distToStream } from './height';

const LANTERN_RADIUS = 0.8;

export function surfaceAt(x: number, z: number): Surface {
  if (distToBridge(x, z) <= 0) return 'wood';
  if (distToStream(x, z) <= LAYOUT.stream.width / 2) return 'water';
  for (const l of LAYOUT.lanterns) if (Math.hypot(x - l.x, z - l.z) <= LANTERN_RADIUS) return 'stone';
  if (distToPath(x, z) <= LAYOUT.pathWidth / 2) return 'dirt';
  return 'grass';
}
