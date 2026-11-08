import type { Feature } from '../core/types';
import terrain from './terrain';

/** Registration order = init and update order. M1 base order: sky, postfx, fuji, terrain, sakura-trees, petals. */
export const features: Feature[] = [terrain];
