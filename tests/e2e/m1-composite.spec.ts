import { test, expect, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

const LEVELS = ['low', 'medium', 'high'] as const;
const READY_MS = 30_000;
const SETTLE_MS = 3_000;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function waitReady(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => (window as any).__sakura?.ready), { timeout: READY_MS }).toBe(true);
}

/** Decodes a screenshot in the page and returns the measurements the composite asserts on. */
function measure(b64: string, skyB64: string, page: Page) {
  return page.evaluate(async ([shot, skyOnly]) => {
    const load = async (src: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${src}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      return { g, w: c.width, h: c.height };
    };
    const full = await load(shot!);
    const sky = await load(skyOnly!);
    const { camera } = (window as any).__sakura.ctx;
    const toScreen = (x: number, y: number, z: number) => {
      const p = camera.position.clone().set(x, y, z).project(camera);
      return { x: Math.round((p.x * 0.5 + 0.5) * full.w), y: Math.round((-p.y * 0.5 + 0.5) * full.h) };
    };
    const box = (cx: number, cy: number, hw: number, hh: number) => {
      const x = Math.max(0, cx - hw), y = Math.max(0, cy - hh);
      const d = full.g.getImageData(x, y, Math.min(full.w - x, 2 * hw), Math.min(full.h - y, 2 * hh)).data;
      return d;
    };
    const average = (d: Uint8ClampedArray) => {
      const s = [0, 0, 0];
      for (let i = 0; i < d.length; i += 4) { s[0]! += d[i]!; s[1]! += d[i + 1]!; s[2]! += d[i + 2]!; }
      const n = d.length / 4;
      return s.map((v) => Math.round(v / n));
    };

    // Hero crown region, centred on the upper half of the crown.
    const crown = toScreen(0, 11, 0);
    const crownBox = box(crown.x, crown.y, Math.round(full.w * 0.12), Math.round(full.h * 0.1));
    let pink = 0;
    for (let i = 0; i < crownBox.length; i += 4) {
      const R = crownBox[i]!, G = crownBox[i + 1]!, B = crownBox[i + 2]!;
      if (R > 200 && R - G > 18 && B > G) pink++;
    }

    // Sky gradient, measured on a frame showing only the dome, so scene objects cannot fake it.
    const horizonY = toScreen(0, 0, -1400).y;
    const band = (y0: number, y1: number) => {
      const d = sky.g.getImageData(0, Math.max(0, y0), sky.w, Math.max(1, y1 - y0)).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i + 2]! - d[i]!;
      return s / (d.length / 4);
    };
    const rows = Math.max(4, Math.round(sky.h * 0.04));

    // Fuji: the peak must be on screen and its neighbourhood must read as snow or blue rock, not sky.
    const peak = toScreen(0, 330, -900);
    const onScreen = peak.x >= 0 && peak.x < full.w && peak.y >= 0 && peak.y < full.h;
    const fujiBox = box(peak.x, peak.y + 8, 10, 6);
    let fuji = 0;
    const skyRef = sky.g.getImageData(Math.min(peak.x + 60, sky.w - 1), Math.max(0, peak.y + 8), 1, 1).data;
    for (let i = 0; i < fujiBox.length; i += 4) {
      const d = Math.hypot(fujiBox[i]! - skyRef[0]!, fujiBox[i + 1]! - skyRef[1]!, fujiBox[i + 2]! - skyRef[2]!);
      if (d > 12) fuji++;
    }

    // Palette conformance: average colours of the regions named in the brief.
    const lowerGrass = average(box(Math.round(full.w * 0.15), Math.round(full.h * 0.92), 20, 12));
    return {
      pinkShare: pink / (crownBox.length / 4),
      skyTop: band(0, rows), skyHorizon: band(horizonY - rows, horizonY),
      peak, onScreen, fujiShare: fuji / (fujiBox.length / 4),
      samples: { top: average(sky.g.getImageData(0, 0, sky.w, rows).data), grass: lowerGrass, blossom: average(crownBox) },
    };
  }, [b64, skyB64]);
}

for (const level of LEVELS) {
  test(`composite at ${level}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await page.goto(`/?debug=1&quality=${level}`);
    await waitReady(page);
    await page.waitForTimeout(SETTLE_MS);

    const suffix = testInfo.project.name === 'desktop' ? '' : `-${testInfo.project.name}`;
    const shot = await page.screenshot({ path: `test-results/m1-composite-${level}${suffix}.png` });
    const fps = await page.evaluate(() => (window as any).__sakura.fps as number);
    // __sakura.fps cannot read below 10 (the loop clamps dt to 0.1 s); log the real frame rate next to it.
    const rawFps = await page.evaluate(() => new Promise<number>((done) => {
      const start = performance.now();
      let n = 0;
      const tick = (now: number) => { n++; if (now - start < 2000) requestAnimationFrame(tick); else done((n * 1000) / (now - start)); };
      requestAnimationFrame(tick);
    }));

    await page.evaluate(() => {
      const { scene } = (window as any).__sakura.ctx;
      for (const o of scene.children) o.visible = o.name === 'sky-dome';
    });
    await page.waitForTimeout(400);
    const skyShot = await page.screenshot();

    const m = await measure(shot.toString('base64'), skyShot.toString('base64'), page);
    console.log(`[m1-composite] ${testInfo.project.name}/${level} fps ${fps.toFixed(1)} rawFps ${rawFps.toFixed(1)} ${JSON.stringify(m)}`);
    expect(errors).toEqual([]);
    expect(fps).toBeGreaterThan(20);
    expect(m.pinkShare).toBeGreaterThan(0.08);
    expect(m.skyTop).toBeGreaterThan(m.skyHorizon);
    expect(m.onScreen).toBe(true);
    expect(m.fujiShare).toBeGreaterThan(0.5);
  });
}

test.describe('feature lifecycle', () => {
  let vite: ViteDevServer;
  const port = Number(process.env.E2E_PORT ?? 4173) + 1000;

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'desktop') return;
    // Dev server, so the page can import the live features module without a production debug hook.
    vite = await createServer({ server: { port, strictPort: true }, logLevel: 'error' });
    await vite.listen();
  });
  test.afterAll(async () => { await vite?.close(); });

  test('features dispose cleanly after repeated quality switches', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one renderer is enough');
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await page.goto(`http://localhost:${port}/?debug=1&quality=low`);
    await waitReady(page);

    const memory = await page.evaluate(async () => {
      const path = '/src/features/index.ts';
      const { features } = await import(/* @vite-ignore */ path);
      const s = (window as any).__sakura;
      const { memory: mem } = s.ctx.renderer.info;
      const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const snap = () => ({ geometries: mem.geometries as number, textures: mem.textures as number });
      await frame();
      const cycle = async () => {
        for (const l of ['low', 'high', 'low']) { s.setQuality(l); await frame(); await frame(); }
      };
      await cycle();
      const settled = snap();
      for (let i = 0; i < 4; i++) await cycle();
      const afterCycles = snap();
      // Textures the renderer itself keeps for any lit material: measured on a second renderer, no features involved.
      const terrain = s.ctx.scene.getObjectByName('terrain');
      const probe = new s.ctx.renderer.constructor({ canvas: document.createElement('canvas') });
      const probeScene = new s.ctx.scene.constructor();
      probeScene.add(terrain.clone());
      probe.render(probeScene, s.ctx.camera);
      const rendererOwned = probe.info.memory.textures as number;
      probe.dispose();
      probe.forceContextLoss();
      const steps: Record<string, unknown> = {};
      for (const f of [...features].reverse()) { f.dispose?.(); await frame(); steps[f.name] = snap(); }
      await frame();
      await frame();
      return { settled, afterCycles, steps, rendererOwned, disposed: snap() };
    });
    console.log(`[m1-composite] memory ${JSON.stringify(memory)}`);
    expect(memory.afterCycles).toEqual(memory.settled);
    expect(memory.disposed).toEqual({ geometries: 0, textures: memory.rendererOwned });
    expect(errors).toEqual([]);
  });
});
