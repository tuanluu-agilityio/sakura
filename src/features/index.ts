import type { Feature } from '../core/types';
import sky from './sky';
import postfx from './postfx';
import fuji from './fuji';
import terrain from './terrain';
import sakuraTrees from './sakura-trees';
import petals from './petals';
import train from './train';
import village from './village';
import couple from './couple';

/** Registration order = init and update order. M1 base order: sky, postfx, fuji, terrain, sakura-trees, petals. */
export const features: Feature[] = [sky, postfx, fuji, terrain, sakuraTrees, petals, train, village, couple];
