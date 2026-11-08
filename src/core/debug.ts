import type { WorldContext } from './types';

/** `?debug=1` overlay: fps, quality, mode, draw calls. Returns a per-frame updater (no-op when off). */
export function createDebugOverlay(ctx: WorldContext, getFps: () => number): () => void {
  if (new URLSearchParams(location.search).get('debug') !== '1') return () => {};

  const el = document.createElement('pre');
  el.id = 'sakura-debug';
  Object.assign(el.style, {
    position: 'fixed', top: '8px', left: '8px', margin: '0', padding: '6px 8px', zIndex: '1000',
    font: '12px/1.3 monospace', color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: '4px',
    pointerEvents: 'none',
  });
  document.body.appendChild(el);

  let acc = 0;
  let last = performance.now();
  return () => {
    const now = performance.now();
    acc += now - last;
    last = now;
    if (acc < 250) return;
    acc = 0;
    el.textContent =
      `fps   ${getFps().toFixed(0)}\n` +
      `qual  ${ctx.quality.level}\n` +
      `mode  ${ctx.mode}\n` +
      `calls ${ctx.renderer.info.render.calls}`;
  };
}
