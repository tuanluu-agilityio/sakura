import { test, expect } from '@playwright/test';

test('sky gradient is bluer at the top than at the horizon', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/sky-${testInfo.project.name}.png` });
  // The horizon band is covered by terrain and Fuji from the intro pose: sample the dome on its own.
  await page.evaluate(() => {
    const { scene } = (window as any).__sakura.ctx;
    for (const o of scene.children) o.visible = o.name === 'sky-dome';
  });
  await page.waitForTimeout(300);
  const png = await page.screenshot();

  const result = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    const bluish = (y0: number, y1: number): number => {
      const d = g.getImageData(0, y0, c.width, Math.max(1, y1 - y0)).data;
      let s = 0; let n = 0;
      for (let i = 0; i < d.length; i += 4) { s += d[i + 2]! - d[i]!; n++; }
      return s / n;
    };
    const h = c.height;
    return { top: bluish(0, Math.floor(h * 0.15)), horizon: bluish(Math.floor(h * 0.4), Math.floor(h * 0.5)) };
  }, png.toString('base64'));
  expect(result.top).toBeGreaterThan(result.horizon);
  expect(errors).toEqual([]);
});
