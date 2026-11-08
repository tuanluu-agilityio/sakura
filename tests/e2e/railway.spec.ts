import { test, expect } from '@playwright/test';

test('level crossing is closed at load and opens after the train', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 10_000 })
    .toBe(true);

  const states = await page.evaluate(() => {
    const s = (window as any).__sakura;
    (window as any).__crossing = [] as boolean[];
    s.ctx.bus.on('crossing:state', (p: { closed: boolean }) => (window as any).__crossing.push(p.closed));
    s.setMode('play');
    s.ctx.camera.position.set(6, 3.2, -28);
    s.ctx.camera.lookAt(10, 1.2, -40);
    return true;
  });
  expect(states).toBe(true);

  const barrier = (): Promise<number> =>
    page.evaluate(() => {
      let a = -1;
      (window as any).__sakura.ctx.scene.traverse((o: any) => { if (o.userData.barrier !== undefined) a = o.userData.barrier; });
      return a;
    });
  const shot = async (name: string, t: number, down: boolean): Promise<void> => {
    await page.evaluate((tt) => (window as any).__sakura.setTime(tt), t);
    // Wait until the arms have fully reached the target (low fps slows the dt-clamped animation).
    await expect.poll(barrier, { timeout: 60_000 }).toBe(down ? 1 : 0);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/railway-${name}-${testInfo.project.name}.png` });
  };
  await shot('open', 20, false);
  await shot('closed', 0, true);
  const emitted = await page.evaluate(() => (window as any).__crossing as boolean[]);
  expect(emitted).toEqual([false, true]);
  expect(errors).toEqual([]);
});
