import type { Feature } from '../core/types';
import sky from './sky';
import terrain from './terrain';
import sakuraTrees from './sakura-trees';

/** Registration order = init and update order. M1 base order: sky, postfx, fuji, terrain, sakura-trees, petals. */
export const features: Feature[] = [sky, terrain, sakuraTrees];
