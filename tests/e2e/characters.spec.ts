import { test, expect } from '@playwright/test';

const IDS = ['player', 'boy', 'girl'] as const;
const CLIPS = ['idle', 'walk', 'run', 'sit'] as const;

test('three characters load, resolve all clips and render', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?debug=1');
  await expect
    .poll(() => page.evaluate(() => (window as any).__sakura?.characters !== undefined), { timeout: 10_000 })
    .toBe(true);

  const result = await page.evaluate(async () => {
    const s = (window as any).__sakura;
    const ctx = s.ctx;
    const out: Record<string, { ok: boolean; clips: Record<string, string> }> = {};
    const rigs: any[] = [];
    s.characters.stage();
    for (const [i, id] of (['player', 'boy', 'girl'] as const).entries()) {
      const rig = await s.characters.load(id);
      const resolved: Record<string, string> = {};
      for (const c of ['idle', 'walk', 'run', 'sit']) {
        const name = s.characters.resolve(rig.clipNames, c);
        resolved[c] = rig.clipNames.includes(name) ? name : '';
      }
      rig.root.position.set((i - 1) * 1.3, 0, 0);
      rig.play(['walk', 'idle', 'sit'][i]!, 0);
      ctx.scene.add(rig.root);
      rigs.push(rig);
      out[id] = { ok: rig !== null, clips: resolved };
    }
    ctx.camera.position.set(0, 1.5, 5);
    ctx.camera.lookAt(0, 0.85, 0);
    let last = performance.now();
    const tick = (now: number) => { for (const r of rigs) r.update((now - last) / 1000); last = now; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return out;
  });

  for (const id of IDS) {
    expect(result[id]!.ok).toBe(true);
    for (const c of CLIPS) expect(result[id]!.clips[c]).toBeTruthy();
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/characters-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});
