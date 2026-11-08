import type { QualityLevel, QualityProfile, Settings } from './types';

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  low: { level: 'low', petals: 1500, shadowMapSize: 1024, bloom: false, maxPixelRatio: 1, viewDistance: 220, grassDensity: 0.35 },
  medium: { level: 'medium', petals: 4000, shadowMapSize: 2048, bloom: true, maxPixelRatio: 1.5, viewDistance: 320, grassDensity: 0.7 },
  high: { level: 'high', petals: 8000, shadowMapSize: 4096, bloom: true, maxPixelRatio: 2, viewDistance: 450, grassDensity: 1.0 },
};

const LEVELS: readonly QualityLevel[] = ['low', 'medium', 'high'];

function isLevel(v: unknown): v is QualityLevel {
  return typeof v === 'string' && (LEVELS as readonly string[]).includes(v);
}

export function pickInitialQuality(env: { touch: boolean; cores: number }): QualityLevel {
  return env.touch || env.cores <= 4 ? 'low' : 'medium';
}

/** URL `?quality=` > manual setting > auto. Only the auto path allows auto-downgrade. */
export function resolveQuality(o: { url: string; setting: Settings['quality']; auto: QualityLevel }): { level: QualityLevel; auto: boolean } {
  const fromUrl = new URLSearchParams(o.url).get('quality');
  if (isLevel(fromUrl)) return { level: fromUrl, auto: false };
  if (o.setting !== 'auto') return { level: o.setting, auto: false };
  return { level: o.auto, auto: true };
}

/** One level lower, or null when already at the bottom. */
export function lowerLevel(level: QualityLevel): QualityLevel | null {
  const i = LEVELS.indexOf(level);
  return i > 0 ? (LEVELS[i - 1] ?? null) : null;
}

const WINDOW_S = 5;

/** Tumbling 5 s window of frame times; signals a downgrade when avg fps is below threshold. */
export class FpsMonitor {
  private readonly threshold: number;
  private time = 0;
  private frames = 0;

  constructor(touch: boolean) {
    this.threshold = touch ? 28 : 50;
  }

  sample(dt: number): 'downgrade' | null {
    this.time += dt;
    this.frames++;
    if (this.time < WINDOW_S) return null;
    const fps = this.frames / this.time;
    this.time = 0;
    this.frames = 0;
    return fps < this.threshold ? 'downgrade' : null;
  }
}
