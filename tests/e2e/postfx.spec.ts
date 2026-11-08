import { test, expect, type Page } from '@playwright/test';

/** Render one frame through the (wrapped) renderer and sample a 5x5 grid of pixels in the same task. */
async function samplePixels(page: Page): Promise<number[][]> {
  return page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    ctx.renderer.render(ctx.scene, ctx.camera);
    const gl = ctx.renderer.getContext() as WebGL2RenderingContext;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const out: number[][] = [];
    const px = new Uint8Array(4);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        gl.readPixels(Math.floor(((i + 0.5) / 5) * w), Math.floor(((j + 0.5) / 5) * h), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        out.push([px[0]!, px[1]!, px[2]!]);
      }
    }
    return out;
  });
}

function assertNotBlank(pixels: number[][]): void {
  // Not black, and not one flat colour (the vignette darkens the corners).
  expect(pixels.some(([r, g, b]) => r! + g! + b! > 60)).toBe(true);
  const sums = pixels.map(([r, g, b]) => r! + g! + b!);
  expect(Math.max(...sums) - Math.min(...sums)).toBeGreaterThan(3);
}

test('postfx renders at low and medium without console errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);

  for (const level of ['low', 'medium'] as const) {
    await page.evaluate((l) => (window as any).__sakura.setQuality(l), level);
    expect(await page.evaluate(() => (window as any).__sakura.quality)).toBe(level);
    expect(await page.evaluate(() => (window as any).__sakura.ctx.scene.fog?.far)).toBe(level === 'low' ? 220 : 320);
    assertNotBlank(await samplePixels(page));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `test-results/postfx-${level}-${testInfo.project.name}.png` });
  }
  await page.screenshot({ path: `test-results/postfx-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});
