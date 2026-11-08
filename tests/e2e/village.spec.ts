import { test, expect } from '@playwright/test';

const VIEWS = {
  village: { from: [20, 7, 14], at: [47, 2, -10] },
  paddies: { from: [-20, 9, 8], at: [-50, 0, -17] },
  stream: { from: [-6, 3.5, 30], at: [0, 0.2, 18] },
  torii: { from: [-8, 3, -8], at: [-20, 2.5, -15] },
} as const;

test('village, paddies, stream and bridge render', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1&quality=low');
  await expect.poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 30_000 }).toBe(true);

  const names = await page.evaluate(() => (window as any).__sakura.ctx.scene.children.map((o: { name: string }) => o.name));
  for (const n of ['village-houses', 'paddy-dikes', 'paddy-water', 'torii', 'lantern-stone', 'lantern-window', 'stream', 'bridge-deck', 'bridge-rails']) {
    expect(names).toContain(n);
  }
  const lights = await page.evaluate(() => {
    let n = 0;
    (window as any).__sakura.ctx.scene.traverse((o: { isPointLight?: boolean }) => { if (o.isPointLight) n++; });
    return n;
  });
  expect(lights).toBe(0);

  if (testInfo.project.name === 'desktop') {
    for (const [name, v] of Object.entries(VIEWS)) {
      await page.evaluate(([f, a]) => {
        const { camera, renderer, scene } = (window as any).__sakura.ctx;
        camera.position.set(f![0], f![1], f![2]);
        camera.lookAt(a![0], a![1], a![2]);
        camera.updateMatrixWorld();
        renderer.render(scene, camera);
      }, [v.from, v.at]);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `test-results/village-${name}.png` });
    }
  }
  expect(errors).toEqual([]);
});
