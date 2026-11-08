import { test, expect } from '@playwright/test';

test('terrain renders at intro pose', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);

  const h = await page.evaluate(() => (window as any).__sakura.ctx.terrain.heightAt(0, 0));
  expect(Math.abs(h - 1.8)).toBeLessThan(0.05);

  await page.waitForTimeout(500);
  const png = await page.screenshot({ path: `test-results/terrain-${testInfo.project.name}.png` });

  // Grass blades are unlit shader output, so they read green even before the sky task adds lights.
  const green = await page.evaluate(async (b64) => {
    const canvas = new Image();
    canvas.src = `data:image/png;base64,${b64}`;
    await canvas.decode();
    const copy = document.createElement('canvas');
    copy.width = canvas.naturalWidth; copy.height = canvas.naturalHeight;
    const g = copy.getContext('2d')!;
    g.drawImage(canvas, 0, 0);
    const y0 = Math.floor(copy.height * 0.4);
    const data = g.getImageData(0, y0, copy.width, copy.height - y0).data;
    let hits = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 1]! > data[i]! && data[i + 1]! > data[i + 2]!) hits++;
    return hits / (data.length / 4);
  }, png.toString('base64'));
  expect(green).toBeGreaterThan(0.15);
  expect(errors).toEqual([]);
});
