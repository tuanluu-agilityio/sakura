export const PALETTE = {
  skyTop: '#8ec5ff',
  skyHorizon: '#fde2ef',
  grass: '#9bd28a',
  grassDark: '#7cc06c',
  blossom: '#ffd6e6',
  blossomDeep: '#f7a8c8',
  petal: '#f48fb1',
  fuji: '#8aa6c9',
  snow: '#ffffff',
  shadowTint: '#8a7fb0',
  trainBody: '#f4f1ea',
  trainStripe: '#2f7ab8',
  trunk: '#7a5a48',
  path: '#c9b38f',
  water: '#9fd3e6',
} as const;

export type PaletteKey = keyof typeof PALETTE;
