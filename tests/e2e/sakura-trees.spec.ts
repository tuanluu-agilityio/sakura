import { test, expect } from '@playwright/test';

test('hero sakura tree fills the upper centre with pink', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 15_000 })
    .toBe(true);
  await page.screenshot({ path: `test-results/sakura-trees-${testInfo.project.name}.png` });

  const result = await page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    const r = ctx.renderer;
    // Tree-only draw calls, worst case: hide everything else (lights too, so no shadow pass)
    // and disable frustum culling on tree meshes for one render.
    const others = ctx.scene.children.filter((o: any) => !o.name.startsWith('sakura-tree-') && o.visible);
    const meshes: any[] = [];
    for (const o of ctx.scene.children) if (o.name.startsWith('sakura-tree-')) o.traverse((m: any) => { if (m.isMesh) meshes.push(m); });
    others.forEach((o: any) => { o.visible = false; });
    meshes.forEach((m) => { m.frustumCulled = false; });
    r.render(ctx.scene, ctx.camera);
    const calls = r.info.render.calls as number;
    others.forEach((o: any) => { o.visible = true; });
    meshes.forEach((m) => { m.frustumCulled = true; });
    // Render the full scene and read back in the same task (drawing buffer is not preserved).
    r.render(ctx.scene, ctx.camera);
    const gl = r.getContext() as WebGL2RenderingContext;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    // Upper centre: x 25-75 %, y 50-90 % from the bottom (GL origin is bottom-left).
    const x0 = Math.floor(w * 0.25), y0 = Math.floor(h * 0.5);
    const rw = Math.floor(w * 0.5), rh = Math.floor(h * 0.4);
    const px = new Uint8Array(rw * rh * 4);
    gl.readPixels(x0, y0, rw, rh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let pink = 0;
    for (let i = 0; i < px.length; i += 4) {
      const R = px[i]!, G = px[i + 1]!, B = px[i + 2]!;
      // Blossom tones have R-G >= ~30; the sky horizon clear colour has R-G = 27.
      if (R > 150 && R - G >= 30 && B >= G) pink++;
    }
    return { share: pink / (rw * rh), calls };
  });
  console.log(`[sakura-trees] pink share ${(result.share * 100).toFixed(1)}%, tree draw calls (unculled) ${result.calls}`);
  expect(result.share).toBeGreaterThan(0.08);
  // 13 trees x (trunk + blossom), shadow passes excluded.
  expect(result.calls).toBeLessThanOrEqual(26);
  expect(errors).toEqual([]);
});
