import { test, expect, type Page } from '@playwright/test';
import { LAYOUT } from '../../src/core/layout';
import { TRAIN_CFG, crossingClosed, runEvents, trainStateAt } from '../../src/shared/train-schedule';

const FIRST_RUN = runEvents(0, LAYOUT.crossing.x);
/** First run finished and second not started: the schedule says no train and an open crossing. */
const IDLE_TIME = ((2 * TRAIN_CFG.xMax + TRAIN_CFG.cars * TRAIN_CFG.carLength) / TRAIN_CFG.speed - TRAIN_CFG.startOffset + (TRAIN_CFG.period - TRAIN_CFG.startOffset)) / 2;
/** Just after the front passes: the arms then have until tOpen to come fully down. */
const TRAIN_TIME = FIRST_RUN.tPass + 1;

const trackErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

const look = (page: Page, p: number[], at: number[]): Promise<void> =>
  page.evaluate(([px, py, pz, ax, ay, az]) => {
    const s = (window as any).__sakura;
    s.setMode('play');
    s.ctx.camera.position.set(px, py, pz);
    s.ctx.camera.lookAt(ax, ay, az);
  }, [...p, ...at]);

const setTime = (page: Page, t: number): Promise<void> => page.evaluate((v) => (window as any).__sakura.setTime(v), t);

/** All values come from one frame, so `front` can be compared with the schedule at `elapsed`. */
const life = (page: Page, halfCar: number): Promise<{ elapsed: number; barrier: number; trainVisible: boolean; front: number }> =>
  page.evaluate((half) => {
    const ctx = (window as any).__sakura.ctx;
    let barrier = -1;
    ctx.scene.traverse((o: any) => { if (o.userData.barrier !== undefined) barrier = o.userData.barrier; });
    const car = ctx.scene.getObjectByName('train-car-0');
    return { elapsed: ctx.time.elapsed, barrier, trainVisible: ctx.scene.getObjectByName('train').visible, front: car.position.x + half };
  }, halfCar);

test('train and crossing bring the scene to life, without console errors', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = trackErrors(page);
  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 60_000 })
    .toBe(true);
  const bootMs = await page.evaluate(() => performance.now());
  console.log(`[life] ${testInfo.project.name} boot: ready observed at ${Math.round(bootMs)} ms`);
  const halfCar = TRAIN_CFG.carLength / 2;

  await setTime(page, IDLE_TIME);
  await expect
    .poll(async () => { const s = await life(page, halfCar); return { barrier: s.barrier, trainVisible: s.trainVisible }; }, { timeout: 60_000 })
    .toEqual({ barrier: 0, trainVisible: false });

  await setTime(page, TRAIN_TIME);
  await expect.poll(async () => (await life(page, halfCar)).barrier, { timeout: 60_000 }).toBe(1);
  const s = await life(page, halfCar);
  expect(crossingClosed(s.elapsed, LAYOUT.crossing.x)).toBe(true);
  expect(s.trainVisible).toBe(true);
  expect(Math.abs(s.front - trainStateAt(s.elapsed).frontX)).toBeLessThan(0.1);

  await look(page, [-5, 6, -20], [0, 2.5, -40]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/life-train-${testInfo.project.name}.png` });

  // Cohesion: train, village and the couple in one frame, palette reviewed by eye.
  await look(page, [-14, 16, 34], [18, 1, -18]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/life-cohesion-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});
