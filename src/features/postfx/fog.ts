import { Fog, type Scene } from 'three';
import { PALETTE } from '../../core/palette';
import { fogRange } from '../../shared/toon';

/** Create (when `fog` is null) or update the scene's linear fog for a view distance. Sky colour = horizon. */
export function applyFog(scene: Scene, fog: Fog | null, viewDistance: number): Fog {
  const { near, far } = fogRange(viewDistance);
  const f = fog ?? new Fog(PALETTE.skyHorizon, near, far);
  f.near = near;
  f.far = far;
  scene.fog = f;
  return f;
}

/** Remove the fog only if it is still the one this feature installed. */
export function removeFog(scene: Scene, fog: Fog | null): void {
  if (fog && scene.fog === fog) scene.fog = null;
}
