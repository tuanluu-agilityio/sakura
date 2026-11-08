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
