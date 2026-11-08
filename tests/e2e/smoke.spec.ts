import { test, expect } from '@playwright/test';

test('boots without console errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);
  await page.screenshot({ path: `test-results/smoke-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});

test('resizes on viewport change', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);

  for (const size of [{ width: 800, height: 600 }, { width: 600, height: 800 }]) {
    await page.setViewportSize(size);
    await expect
      .poll(() => page.evaluate(() => {
        const c = document.querySelector('canvas')!;
        return { width: c.clientWidth, height: c.clientHeight };
      }))
      .toEqual(size);
  }
  expect(await page.evaluate(() => (window as any).__sakura?.ready)).toBe(true);
  expect(errors).toEqual([]);
});
