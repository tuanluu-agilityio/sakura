import { DirectionalLight, HemisphereLight, Mesh, PlaneGeometry, type Scene } from 'three';
import { PALETTE } from '../core/palette';
import { createToonMaterial } from './toon';

/** Debug-only plain ground + light so characters can be screenshot before the world features exist. Returns a remover. */
export function createCharacterStage(scene: Scene): () => void {
  const ground = new Mesh(new PlaneGeometry(40, 40), createToonMaterial({ color: PALETTE.grass }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const sun = new DirectionalLight(PALETTE.snow, 2.2);
  sun.position.set(3, 6, 4);
  const fill = new HemisphereLight(PALETTE.skyTop, PALETTE.grassDark, 0.8);
  scene.add(ground, sun, fill);
  return () => {
    scene.remove(ground, sun, fill);
    ground.geometry.dispose();
    (ground.material as { dispose(): void }).dispose();
  };
}
