import type { Feature, QualityProfile, WorldContext } from '../../core/types';
import { createClouds, type Clouds } from './clouds';
import { createDome, type Dome } from './dome';
import { createLight, type SkyLight } from './light';

let ctx: WorldContext;
let dome: Dome;
let clouds: Clouds;
let light: SkyLight;

const sky: Feature = {
  name: 'sky',
  init(c) {
    ctx = c;
    dome = createDome();
    clouds = createClouds();
    light = createLight(c);
    c.scene.add(dome.mesh, clouds.mesh);
  },
  update(_dt, elapsed) {
    dome.update(ctx.camera);
    clouds.update(elapsed);
    light.update();
  },
  setQuality(p: QualityProfile) { light.setQuality(p); },
  dispose() {
    ctx.scene.remove(dome.mesh, clouds.mesh);
    dome.dispose();
    clouds.dispose();
    light.dispose();
  },
};

export default sky;
