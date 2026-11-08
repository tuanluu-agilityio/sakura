import { writeFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

/** Elapsed times of train run 2 (first run heading +x after page load): LAYOUT.train via runEvents(2, crossing.x). */
const RUN2 = { base: 126.7143, close: 148, pass: 156, clear: 160.1429, open: 163.1429 };
/** The train is at the crossing and the barrier has had time to come down (first run). */
const TRAIN_AT_CROSSING = 8.14;
const OPEN_TIME = 20;

const trackErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

/** Loads the scene, polls for ready and returns the boot time in ms (page clock). */
async function boot(page: Page): Promise<number> {
  await page.goto('/?debug=1&quality=low');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: 60_000 })
    .toBe(true);
  return page.evaluate(() => performance.now());
}

const look = (page: Page, p: number[], at: number[]): Promise<void> =>
  page.evaluate(([px, py, pz, ax, ay, az]) => {
    const s = (window as any).__sakura;
    s.setMode('play');
    s.ctx.camera.position.set(px, py, pz);
    s.ctx.camera.lookAt(ax, ay, az);
  }, [...p, ...at]);

const setTime = (page: Page, t: number): Promise<void> => page.evaluate((v) => (window as any).__sakura.setTime(v), t);

const life = (page: Page): Promise<{ elapsed: number; barrier: number; trainVisible: boolean }> =>
  page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    let barrier = -1;
    ctx.scene.traverse((o: any) => { if (o.userData.barrier !== undefined) barrier = o.userData.barrier; });
    return { elapsed: ctx.time.elapsed, barrier, trainVisible: ctx.scene.getObjectByName('train').visible };
  });

/** Share of pixels whose channels differ by more than 16/255, decoded in the page. */
function diffShare(page: Page, a: Buffer, b: Buffer): Promise<number> {
  return page.evaluate(async ([ba, bb]) => {
    const decode = async (b64: string): Promise<Uint8ClampedArray> => {
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const bmp = await createImageBitmap(blob);
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const g = c.getContext('2d')!;
      g.drawImage(bmp, 0, 0);
      return g.getImageData(0, 0, bmp.width, bmp.height).data;
    };
    const [x, y] = [await decode(ba!), await decode(bb!)];
    let differ = 0;
    for (let i = 0; i < x.length; i += 4) {
      if (Math.abs(x[i]! - y[i]!) > 16 || Math.abs(x[i + 1]! - y[i + 1]!) > 16 || Math.abs(x[i + 2]! - y[i + 2]!) > 16) differ++;
    }
    return differ / (x.length / 4);
  }, [a.toString('base64'), b.toString('base64')]);
}

test('train and crossing bring the scene to life, without console errors', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = trackErrors(page);
  const bootMs = await boot(page);
  console.log(`[life] ${testInfo.project.name} boot: ready observed at ${Math.round(bootMs)} ms`);
  testInfo.annotations.push({ type: 'boot-ms', description: String(Math.round(bootMs)) });

  await look(page, [-5, 6, -20], [0, 2.5, -40]);
  await setTime(page, OPEN_TIME);
  await expect.poll(async () => (await life(page)).barrier, { timeout: 60_000 }).toBe(0);
  await page.waitForTimeout(300);
  const before = await page.screenshot();

  await setTime(page, TRAIN_AT_CROSSING);
  const seen = await expect
    .poll(async () => { const s = await life(page); return s.barrier > 0 || s.trainVisible; }, { timeout: 40_000 })
    .toBe(true)
    .then(() => life(page));
  expect(seen.barrier > 0 || seen.trainVisible).toBe(true);
  await page.waitForTimeout(300);
  const after = await page.screenshot({ path: `test-results/life-train-${testInfo.project.name}.png` });

  const share = await diffShare(page, before, after);
  console.log(`[life] ${testInfo.project.name} pixel diff: ${(share * 100).toFixed(1)} %`);
  expect(share).toBeGreaterThanOrEqual(0.02);

  // Cohesion: train, village and the couple in one frame, palette reviewed by eye.
  await look(page, [-14, 16, 34], [18, 1, -18]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/life-cohesion-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});

// Manual visual timing review, run with LIFE_TIMING=1: screenshots at run-2 equivalents of 19, 21.5, 29, 34, 37 s.
test('timing review', async ({ page }, testInfo) => {
  test.skip(!process.env.LIFE_TIMING || testInfo.project.name !== 'desktop', 'manual review only');
  test.setTimeout(300_000);
  const errors = trackErrors(page);
  await boot(page);
  await look(page, [3, 3.4, -30], [10, 1.4, -40]);

  const shot = async (name: string): Promise<void> => {
    await page.waitForTimeout(200);
    await page.screenshot({ path: `test-results/life-t${name}-desktop.png` });
  };
  const until = (want: (s: { elapsed: number; barrier: number }) => boolean): Promise<void> =>
    expect.poll(async () => want(await life(page)), { timeout: 90_000, intervals: [50] }).toBe(true);

  await page.evaluate(() => {
    const ctx = (window as any).__sakura.ctx;
    (window as any).__samples = [] as unknown[];
    const lamps: any[] = [];
    let gear: any;
    ctx.scene.traverse((o: any) => { if (o.userData.barrier !== undefined) gear = o; });
    gear.traverse((o: any) => { if (o.isMesh && o.geometry.type === 'SphereGeometry') lamps.push(o.material); });
    const car = ctx.scene.getObjectByName('train-car-0');
    const tick = (): void => {
      (window as any).__samples.push({ t: ctx.time.elapsed, a: gear.userData.barrier, lampA: lamps[0].color.r, lampB: lamps[1].color.r, front: car.position.x + 9 });
      requestAnimationFrame(tick);
    };
    tick();
  });

  await setTime(page, RUN2.base + 19);
  await until((s) => s.barrier === 0);
  await shot('19');
  await setTime(page, RUN2.close - 0.2);
  await until((s) => s.elapsed >= RUN2.base + 21.5);
  await shot('21_5');
  await until((s) => s.barrier === 1);
  await until((s) => s.elapsed >= RUN2.close + 2.5);
  await shot('23_arms-down');
  await setTime(page, RUN2.pass - 0.4);
  await until((s) => s.elapsed >= RUN2.pass);
  await shot('29_pass');
  await setTime(page, RUN2.base + 34);
  await until((s) => s.elapsed >= RUN2.base + 34);
  await shot('34');
  await setTime(page, RUN2.open - 0.3);
  await until((s) => s.elapsed >= RUN2.base + 37);
  await shot('37');
  await until((s) => s.barrier === 0);

  const samples = await page.evaluate(() => (window as any).__samples as { t: number; a: number; lampA: number; lampB: number; front: number }[]);
  writeFileSync('test-results/life-timing-samples.json', JSON.stringify(samples));
  expect(errors).toEqual([]);
});
