import { test, expect } from '@playwright/test';

test('train runs on the rails at the crossing', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);

  // Front 30 m past the crossing: all three cars span the track near x = 10.
  await page.evaluate(() => {
    const s = (window as any).__sakura;
    s.setTime(((10 + 400 + 30) / 14) - 23.2857);
  });
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    const g = ctx.scene.getObjectByName('train');
    return { visible: g?.visible, cars: g?.children.length };
  });
  expect(state).toEqual({ visible: true, cars: 3 });

  await page.evaluate(() => {
    const s = (window as any).__sakura;
    s.setMode('play');
    s.ctx.camera.position.set(-5, 6, -20);
    s.ctx.camera.lookAt(0, 2.5, -40);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/train-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});
