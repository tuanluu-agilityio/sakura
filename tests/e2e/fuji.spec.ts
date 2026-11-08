import { test, expect } from '@playwright/test';

test('fuji is visible above the horizon with a snow cap at low quality', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);
  await page.waitForTimeout(500);
  const png = await page.screenshot({ path: `test-results/fuji-${testInfo.project.name}.png` });

  const r = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    const horizon = [0xfd, 0xe2, 0xef];
    // Scan the upper half for non-sky pixels (Fuji body) and near-white snow.
    const data = g.getImageData(0, 0, c.width, Math.floor(c.height * 0.5)).data;
    let body = 0, snow = 0, minY = c.height, maxY = 0;
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i]!, G = data[i + 1]!, B = data[i + 2]!;
      const d = Math.hypot(R - horizon[0]!, G - horizon[1]!, B - horizon[2]!);
      // Fuji body is bluish (b > r) and distinct from the horizon colour.
      if (d > 12 && B > R) {
        body++;
        const y = Math.floor(i / 4 / c.width);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    // Snow = near-white pixels in the top third of the Fuji region.
    const top = minY + Math.floor((maxY - minY) / 3);
    for (let y = minY; y <= top; y++) {
      for (let x = 0; x < c.width; x++) {
        const k = (y * c.width + x) * 4;
        if (data[k]! > 235 && data[k + 1]! > 235 && data[k + 2]! > 235) snow++;
      }
    }
    return { body, snow, minY, maxY };
  }, png.toString('base64'));

  expect(r.body).toBeGreaterThan(500);
  expect(r.snow).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});
