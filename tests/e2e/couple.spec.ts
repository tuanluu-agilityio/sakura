import { test, expect } from '@playwright/test';

test('couple sits on the bench and is visible from the intro end pose', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect.poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 30_000 }).toBe(true);

  const info = await page.evaluate(() => {
    const { ctx } = (window as any).__sakura;
    // Intro end pose (LAYOUT.intro.to / lookAt), re-applied every frame so no camera controller overrides it.
    const pose = () => { ctx.camera.position.set(6, 2.5, 9); ctx.camera.lookAt(0, 1.0, 3.2); };
    const loop = () => { pose(); requestAnimationFrame(loop); };
    loop();
    const seated: { x: number; y: number }[] = [];
    ctx.scene.traverse((o: any) => { if (o.name === 'head') seated.push({ x: o.getWorldPosition(o.position.clone()).x, y: o.getWorldPosition(o.position.clone()).y }); });
    return seated;
  });
  expect(info.length).toBe(2);
  for (const h of info) expect(h.y).toBeGreaterThan(0.8);

  await page.waitForTimeout(1500);
  await page.screenshot({ path: testInfo.outputPath('couple.png') });
  await page.screenshot({ path: 'test-results/couple-intro-end.png' });
  expect(errors).toEqual([]);
});
