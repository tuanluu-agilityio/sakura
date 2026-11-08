import './style.css';
import { createContext, currentQuality, isTouchDevice } from './core/context';
import { createDebugOverlay } from './core/debug';
import { createLoop } from './core/loop';
import { FpsMonitor, QUALITY_PROFILES, lowerLevel } from './core/quality';
import { resizeRenderer } from './core/renderer';
import type { GameMode, QualityLevel } from './core/types';
import { features } from './features';

declare global {
  interface Window {
    __sakura?: { ready: boolean; readonly mode: GameMode; readonly quality: QualityLevel; readonly fps: number; setMode(m: GameMode): void };
  }
}

async function boot(): Promise<void> {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const ctx = createContext(canvas);
  const { renderer, camera, scene, bus } = ctx;

  let autoQuality = currentQuality(ctx.settings.get()).auto;
  let monitor = new FpsMonitor(isTouchDevice());
  let fps = 0;

  const resize = (): void => resizeRenderer(renderer, camera, ctx.quality);
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  const applyQuality = (level: QualityLevel): void => {
    if (level === ctx.quality.level) return;
    const profile = QUALITY_PROFILES[level];
    ctx.quality = profile;
    resize();
    for (const f of features) f.setQuality?.(profile);
    bus.emit('quality:change', { profile });
  };

  bus.on('settings:change', ({ settings }) => {
    const q = currentQuality(settings);
    autoQuality = q.auto;
    monitor = new FpsMonitor(isTouchDevice());
    applyQuality(q.level);
  });

  for (const f of features) await f.init(ctx);

  const updateDebug = createDebugOverlay(ctx, () => fps);
  const loop = createLoop((dt, elapsed) => {
    ctx.time.elapsed = elapsed;
    if (dt > 0) fps = fps === 0 ? 1 / dt : fps * 0.9 + (1 / dt) * 0.1;
    for (const f of features) f.update?.(dt, elapsed);
    renderer.render(scene, camera);
    if (autoQuality && monitor.sample(dt) === 'downgrade') {
      const lower = lowerLevel(ctx.quality.level);
      if (lower) applyQuality(lower);
    }
    updateDebug();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.start();
  });

  ctx.setMode('intro');
  renderer.render(scene, camera);
  loop.start();

  window.__sakura = {
    ready: true,
    get mode() { return ctx.mode; },
    get quality() { return ctx.quality.level; },
    get fps() { return fps; },
    setMode: (m) => ctx.setMode(m),
  };
}

boot().catch((err: unknown) => {
  console.error('[sakura] boot failed', err);
});
