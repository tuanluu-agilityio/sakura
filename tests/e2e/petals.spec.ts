import { test, expect, type Page } from '@playwright/test';

/** Renders once and stores a downsampled RGBA snapshot under window.__petalsShot[key]. */
async function snapshot(page: Page, key: string): Promise<void> {
  await page.evaluate((k) => {
    const ctx = (window as any).__sakura.ctx;
    const r = ctx.renderer;
    r.render(ctx.scene, ctx.camera);
    const gl = r.getContext() as WebGL2RenderingContext;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const shots = ((window as any).__petalsShot ??= {});
    shots[k] = px;
  }, key);
}

test('petals fall in the air, lie on the ground and the wind gusts', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // An explicit level turns auto-downgrade off, otherwise a slow runner drops the later setQuality('high') to medium.
  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 15_000 })
    .toBe(true);
  // Observe gusts from load on (first gust is 12-30 s of scene time after load).
  await page.evaluate(() => {
    const w = window as any;
    w.__gusts = [];
    w.__sakura.ctx.bus.on('wind:gust', (e: object) => w.__gusts.push({ ...e, at: w.__sakura.ctx.time.elapsed }));
  });
  const e0 = await page.evaluate(() => (window as any).__sakura.ctx.time.elapsed as number);

  // wind:gust within 35 s of scene time, checked first. Software GL renders this scene at ~1 fps
  // and the loop clamps dt to 0.1 s, so scene time crawls behind wall time. While waiting, swap
  // renderer.render (postfx wraps it with its composer) for a no-op so frames cost ~nothing
  // whatever the render pipeline; updates (wind controller) still run every frame.
  await page.evaluate(() => {
    const w = window as any;
    const r = w.__sakura.ctx.renderer;
    w.__render = r.render;
    r.render = () => {};
  });
  const e1 = await page.evaluate(() => (window as any).__sakura.ctx.time.elapsed as number);
  await page.waitForFunction(
    (start) => { const w = window as any; return w.__gusts.length > 0 || w.__sakura.ctx.time.elapsed > start + 35; },
    e0, { timeout: 100_000, polling: 250 },
  );
  const e2 = await page.evaluate(() => (window as any).__sakura.ctx.time.elapsed as number);
  const gusts = await page.evaluate(() => (window as any).__gusts as { at: number; duration: number; direction: { x: number; z: number } }[]);
  console.log(`[petals] scene time ${e0.toFixed(1)} s (subscribe) -> ${e1.toFixed(1)} s (render off) -> ${e2.toFixed(1)} s; gusts ${gusts.length}${gusts[0] ? ` first at ${gusts[0].at.toFixed(1)} s` : ''}`);
  expect(gusts.length).toBeGreaterThan(0);
  const gust = gusts[0]!;
  expect(gust.at - e0).toBeLessThanOrEqual(35);
  await page.evaluate(() => { const w = window as any; w.__sakura.ctx.renderer.render = w.__render; });
  expect(Math.hypot(gust.direction.x, gust.direction.z)).toBeCloseTo(1, 3);
  expect(gust.duration).toBeGreaterThanOrEqual(3);
  expect(gust.duration).toBeLessThanOrEqual(6);

  const info = await page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    const r = ctx.renderer;
    const falling = ctx.scene.getObjectByName('petals-falling');
    const ground = ctx.scene.getObjectByName('petals-ground');
    // Falling petals are drawn: count their draws during one full render (postfx composer included).
    let drawn = 0;
    falling.onAfterRender = () => { drawn++; };
    r.info.autoReset = false;
    r.info.reset();
    r.render(ctx.scene, ctx.camera);
    const calls = r.info.render.calls as number;
    r.info.autoReset = true;
    falling.onAfterRender = () => {};
    // Pink specks in the air: pixels that change when only the falling petals are hidden.
    const gl = r.getContext() as WebGL2RenderingContext;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const a = new Uint8Array(w * h * 4), b = new Uint8Array(w * h * 4);
    r.render(ctx.scene, ctx.camera);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, a);
    falling.visible = false;
    r.render(ctx.scene, ctx.camera);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b);
    falling.visible = true;
    let specks = 0;
    for (let i = 0; i < a.length; i += 4) {
      const R = a[i]!, G = a[i + 1]!, B = a[i + 2]!;
      const diff = Math.abs(R - b[i]!) + Math.abs(G - b[i + 1]!) + Math.abs(B - b[i + 2]!);
      if (diff > 30 && R > 150 && R - G >= 30 && B >= G) specks++;
    }
    return { calls, drawn, specks, fallingCount: falling.count, groundCount: ground.count, level: ctx.quality.level };
  });
  await page.screenshot({ path: `test-results/petals-${testInfo.project.name}.png` });
  console.log(`[petals] ${info.level}: falling ${info.fallingCount}, ground ${info.groundCount}, calls ${info.calls} (petal draws ${info.drawn}), pink specks ${info.specks}px`);
  expect(info.calls).toBeGreaterThanOrEqual(1);
  expect(info.drawn).toBeGreaterThanOrEqual(1);
  expect(info.fallingCount).toBeGreaterThan(0);
  expect(info.groundCount).toBeGreaterThan(0);
  expect(info.specks).toBeGreaterThan(20);

  await snapshot(page, 'a');
  await page.waitForTimeout(20_000);
  await snapshot(page, 'b');
  await page.screenshot({ path: `test-results/petals-${testInfo.project.name}-20s.png` });
  const changed = await page.evaluate(() => {
    const { a, b } = (window as any).__petalsShot as { a: Uint8Array; b: Uint8Array };
    let n = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 1]! - b[i + 1]!) + Math.abs(a[i + 2]! - b[i + 2]!) > 24) n++;
    }
    return n / (a.length / 4);
  });
  console.log(`[petals] changed after 20 s: ${(changed * 100).toFixed(2)}%`);
  expect(changed).toBeGreaterThan(0.01);

  // High quality (8000 petals) builds and renders without errors.
  await page.evaluate(() => (window as any).__sakura.setQuality('high'));
  await page.waitForTimeout(500);
  const high = await page.evaluate(() => (window as any).__sakura.ctx.scene.getObjectByName('petals-falling').count);
  expect(high).toBe(8000);
  expect(errors).toEqual([]);
});
