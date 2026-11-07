# M6 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Read `docs/superpowers/plans/README.md` (constraints, contract, layout) first. Steps use `- [ ]`.

**Goal:** Prove and reach the performance targets, rule out leaks, verify on a real phone, and ship v1.0.0 with human-facing documentation and the token/cost lessons.
**Architecture:** Perf tests live in `tests/perf/` with their own Playwright config so normal `npm run e2e` and CI never run them by default. Statistics helpers are pure (`tools/perf/stats.ts`) and unit-tested. The debug hook `window.__sakura` gains `stats()` and `setQuality()`.
**Tech Stack:** Playwright + Chrome DevTools Protocol (CDP), Node 24 scripts.
**Spec:** `docs/superpowers/specs/2026-11-07-sakura-relax-design.md` §6, §8, §9.

## Global Constraints
See README "Global constraints". Additionally for M6: perf numbers are only meaningful on a machine with a real GPU; **CI never gates on fps** (software GL). Gating runs use `PERF_ENFORCE=1 npm run perf` locally by the implementer/orchestrator and the result (incl. `renderer` string from `WEBGL_debug_renderer_info`) is committed in `reports/perf.md`. The `?quality=` URL param, manual-quality-disables-auto-downgrade and `__sakura.setMode` already exist (M0-T2); do not reimplement them.

## Review Focus
1. CPU-throttled run is unstable on shared CI runners → CI runs only `perf:smoke` (10 s, asserts samples exist and no errors, never an fps threshold) (test in T1: `smoke records samples`).
2. `?quality=low` conflicts with saved settings (user previously chose High) → URL wins for the run and nothing is written to localStorage; the test seeds `localStorage['sakura.settings']` with `quality:'high'` and still expects `low` (test in T1).
3. Leaks from `setQuality` rebuilds (geometries, textures, render targets, shadow maps not disposed) → geometry/texture counts after returning to a level match the first visit ±5 % (test in T3).
4. fps sampling during loading/intro skews averages → sampling starts only when `__sakura.mode === 'play'` plus a 3 s warm-up; `dropWarmup` unit-tested (T1).
5. README links to a Netlify site that is not connected or returns non-200 → `npm run readme:check` fails until `siteUrl` in `tools/project.json` responds 200 (test in T5).

---

### Task M6-T1: Performance harness
**Model:** sonnet · **Type:** perf · **Size:** S · **Depends:** none
**Files:** Create `playwright.perf.config.ts`, `tests/perf/fps.spec.ts`, `tests/perf/helpers.ts`, `tools/perf/{stats.ts,stats.test.ts,report.ts}`, `reports/perf.md` (generated); Modify `src/core/debug.ts` and `src/main.ts` (hook), `package.json`, `.gitignore` (`reports/perf-*.json`).
**Interfaces:**
- Produces hook additions on `window.__sakura`: `stats(): { drawCalls: number; triangles: number; geometries: number; textures: number; heapMB: number | null }` (`renderer.info.render.calls/triangles`, `renderer.info.memory.geometries/textures`, `performance.memory?.usedJSHeapSize / 1048576` else `null`); `setQuality(level: 'auto' | QualityLevel): void` (calls `ctx.settings.set({ quality })`).
- `stats.ts`: `summarize(samples: number[]): { avg: number; p5: number; min: number; n: number }` (p5 = value at index `floor(0.05*(n-1))` of the ascending sort; empty → zeros); `dropWarmup(samples: { t: number; v: number }[], warmupSec: number): number[]` (drops samples with `t < warmupSec`).
- npm scripts: `perf` = `playwright test -c playwright.perf.config.ts && node tools/perf/report.ts`; `perf:smoke` = `PERF_SMOKE=1 playwright test -c playwright.perf.config.ts -g smoke` (cross-platform: set env via the config using `process.env`, document the Windows form `cross-env`-free: read `--grep` only, so use `playwright test -c playwright.perf.config.ts -g "smoke"` and let the test read `process.env.PERF_SECONDS ?? 10`).
- `playwright.perf.config.ts`: `testDir: 'tests/perf'`, `workers: 1`, `timeout: 180_000`, single Chromium project with `args: ['--ignore-gpu-blocklist','--enable-gpu-rasterization']`, `webServer` same as the main config.
- Runs in `fps.spec.ts` (each writes `reports/perf-<name>.json` = `{ name, quality, throttle, summary, stats, renderer }`): `mobile low throttled` (viewport 412×915, `isMobile`, `hasTouch`, CDP `Emulation.setCPUThrottlingRate {rate: 4}`, URL `/?quality=low`, 30 s), `desktop medium` (1280×720, `/?quality=medium`, 30 s), `desktop high` (`/?quality=high`, 30 s), and `smoke records samples` (desktop, `/?quality=low`, `PERF_SECONDS` default 10, **no fps assertion**).
- Procedure per run: goto → wait `__sakura.ready` and `mode==='intro'` → click `#start` → wait `mode==='play'` → warm-up 3 s → every 500 ms push `{t, v: __sakura.fps}` for the run length while a scripted walk plays by keyboard (`helpers.walk(page, seconds)`: loop `[W 5 s]`, `[W+D 2 s]`, `[W 5 s]`, `[W+A 2 s]` pressing/releasing with `keyboard.down/up`, Shift held on the last segment) → read `stats()` once at the end → `summarize(dropWarmup(...))`.
- Enforcement (only when `PERF_ENFORCE=1`): throttled low `avg >= 30`, desktop medium `avg >= 60 * 0.95`, `stats.drawCalls <= 150` for the low run. Without the env var the spec only asserts `n >= 10` and `avg > 0`.
- `report.ts` reads `reports/perf-*.json`, writes `reports/perf.md` (English table: run, avg, p5, min, drawCalls, triangles, geometries, textures, heapMB, renderer; date; commit sha from `git rev-parse --short HEAD`).
- [ ] Tests first: `summarize([60,60,30,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60])` → `min 30`, `p5 30`, `avg 58.5`; `summarize([])` → zeros; `dropWarmup([{t:1,v:10},{t:4,v:50}], 3)` → `[50]` (Review 4). Spec-level: seed `localStorage` via `page.addInitScript` with `quality:'high'`, open `/?quality=low` → `__sakura.quality === 'low'` and `localStorage['sakura.settings']` still contains `"high"` (Review 2).
- [ ] Implement; run the three real runs locally with `PERF_ENFORCE` unset, commit `reports/perf.md` (the baseline for T2).
**Acceptance:** typecheck; unit tests; `npm run perf:smoke` passes on CI-like env; `npm run perf` writes `reports/perf.md`; CI workflow gains a job step `npm run perf:smoke` only (no thresholds); default `npm run e2e` does not run `tests/perf`.

### Task M6-T2: Optimisation pass
**Model:** opus · **Type:** perf · **Size:** M · **Depends:** M6-T1
**Files:** Modify files in any `src/features/*` and `src/core/*` as needed (changes must preserve visuals), `reports/perf.md`; Create `tests/perf/budget.spec.ts`.
**Interfaces:** Consumes `reports/perf.md` baseline, `__sakura.stats()`. Produces: updated feature code, a new report, and a regression guard.
- [ ] Read the baseline report; profile the worst case with Chrome Performance (CDP `Profiler`/`Tracing` via Playwright) and `renderer.info`; write the ordered findings (cost estimate each) in the PR body before changing code.
- [ ] Candidate list, apply in order of measured win, re-running `npm run perf` after each and keeping only changes that help: (1) merge static geometry per feature with `BufferGeometryUtils.mergeGeometries` (houses, fences, lanterns, rails, stones, paddies) — one draw call per material; (2) instancing audit: any set of ≥ 20 identical meshes (sleepers, fence posts, grass, petals, lanterns) must be `InstancedMesh`; (3) shadows: only main tree trunk/canopy, bench, player, couple, train cast; shadow frustum fitted to `viewDistance`; update shadow map only when sun or casters move (static casters baked once) ; (4) texture sizes ≤ 1024² at `low`, mipmaps on, `anisotropy` ≤ 4 on low; (5) shader cost: rim/fresnel and toon ramp in fragment kept to ≤ 1 texture fetch, grass wind in vertex shader only, avoid `discard` where alpha-to-coverage is possible; (6) cull: `frustumCulled` correct for instanced meshes (bounding spheres), far Fuji/sky without depth write; (7) bloom at medium/high at half resolution; (8) pixel ratio and viewDistance fog far = profile viewDistance.
- [ ] Targets (hard): mobile throttled low run `avg >= 30`, `p5 >= 22`; desktop medium `avg >= 57` (60 fps within noise) ; draw calls at low `<= 150`; no visual regression: before/after screenshots of the intro frame and the tree-top view at `medium`, compared by eye and attached (palette unchanged).
- [ ] `tests/perf/budget.spec.ts` (runs under the perf config): `test('draw calls at low stay within budget')` loads `/?quality=low`, enters play, waits 3 s, asserts `stats().drawCalls <= 150` (always asserted, not only under `PERF_ENFORCE`; it is deterministic, so it also runs in CI via `npm run perf:budget` = `playwright test -c playwright.perf.config.ts -g "draw calls"`).
- [ ] Unit/e2e suites still green after refactors; commit per optimisation (small commits) so a bad one can be reverted; re-run `PERF_ENFORCE=1 npm run perf`; commit updated `reports/perf.md` with before/after table.
**Acceptance:** typecheck; unit; build; `npm run budget`; e2e green; `PERF_ENFORCE=1 npm run perf` green on a GPU machine; PR body includes before/after numbers and screenshots.

### Task M6-T3: Memory and long-run check
**Model:** sonnet · **Type:** perf · **Size:** S · **Depends:** none
**Files:** Create `tests/perf/memory.spec.ts`, `tools/perf/memory.ts` (+ `memory.test.ts`); Modify feature `setQuality`/`dispose` implementations where leaks are found; `package.json`.
**Interfaces:** Consumes `__sakura.stats()`, `__sakura.setQuality(level)`, `__sakura.setMode(m)` (all exist after M6-T1 / M0-T2; if T1 has not merged yet, add only what is missing and note it).
- Produces: npm scripts `perf:memory` (full 10 minutes; `MEM_MINUTES` default 10) and `perf:memory:quick` (`MEM_MINUTES=1`); `tools/perf/memory.ts` exports `growthRatio(base: number, last: number): number` (`last/base`, base 0 → 1) and `withinTolerance(first: number, again: number, tol = 0.05): boolean` (`|again-first| <= tol*max(first,1)`).
- Test `memory.spec.ts` → `test('no leaks over quality and mode cycling')`, `timeout = (MEM_MINUTES+2)*60_000`: desktop Chromium, CDP session; start at `/` default, enter play; schedule every 20 s: `setQuality` cycling `medium → high → low → medium → …`; every 60 s: `setMode('menu')` 2 s then `play`, then press `p` with `waitForEvent('download')` (swallow), then wait 2 s; every 30 s sample: `HeapProfiler.collectGarbage` (CDP) twice, then `stats()` and record `{minute, quality, heapMB, geometries, textures}`.
- Assertions: after warm-up baseline (first sample at ≥ 90 s) `growthRatio(baselineHeap, lastHeap) < 1.15`; for each quality level, the **second and later** visits have `withinTolerance(firstVisit.geometries, visit.geometries)` and the same for `textures` (Review 3); no `pageerror`/console error; `renderer.info.programs?.length` (read via `stats` if exposed, else skip) does not grow after the second cycle. With `MEM_MINUTES=1` the thresholds are identical but only one level cycle is checked.
- [ ] Tests first: `memory.test.ts` unit tests for `growthRatio(100,114)=1.14`, `growthRatio(0,5)=1`, `withinTolerance(100,104)=true`, `(100,106)=false`.
- [ ] Run `perf:memory` locally; if it fails, find the leak: for each feature's `setQuality`, ensure replaced `InstancedMesh`/geometries/materials/textures/`WebGLRenderTarget`s/composer passes are `.dispose()`d and shadow map (`light.shadow.map?.dispose()`) is released when size changes; event subscriptions (`bus.on`) returned unsubscribers called in `dispose`; no per-frame allocations in `update` (hoist `Vector3`s). Fix with the smallest change per feature, one commit each, citing the measurement.
- [ ] Commit the final numbers into `reports/perf.md` (append a "Memory" section).
**Acceptance:** typecheck; unit tests; build; `npm run perf:memory:quick` green; one full 10-minute run green (output pasted into PR); not part of CI.

### Task M6-T4: Human device check and bug-fix buffer
**Model:** opus · **Type:** integration · **Size:** S · **Depends:** M6-T2, M6-T3
**Files:** none planned (fixes land as `[M6-FIX-n]` issues/PRs). Run inline by the orchestrator; this is a human checkpoint.
**Interfaces:** Consumes the deployed Netlify URL on `main`.
- [ ] Orchestrator confirms the latest `main` deploy is live (HTTP 200 on the site URL from `tools/project.json` `siteUrl`) and posts the URL plus this checklist to the human.
- [ ] Human checklist (owner on own phone, `<url>/?debug=1`, then without debug): loads under 10 s on mobile data; fps ≥ 30 in overlay at default quality; touch joystick + look drag + pinch work; rotate phone portrait/landscape; train passes and bell is audible after tapping Start (iOS silent switch off), mute button works; photo → share sheet appears; menu → quality switch does not crash; leave the tab for 1 min and return (no burst of sound, no jump).
- [ ] Each problem → `gh issue create` titled `[M6-FIX-n] <summary>`, milestone `M6`, label `model:<haiku|sonnet|opus>` chosen by the rubric (visual/perf bugs opus; UI/audio sonnet; copy/docs haiku). These are ad-hoc: `plan-sync` does not need to know them, token attribution works through the usual `[#N]` subagent descriptions. Fix loop identical to normal tasks; repeat the device check for the affected items.
- [ ] Exit when the human replies that the device check passed; orchestrator records result and remaining known issues in `docs/STATE.md`.
**Acceptance:** human sign-off recorded; all `[M6-FIX-*]` issues closed or explicitly deferred (listed in README "Known issues").

### Task M6-T5: Final reports, README, release tag
**Model:** haiku · **Type:** docs · **Size:** S · **Depends:** M6-T2, M6-T3, M6-T4
**Files:** Create `README.md` (root, Vietnamese), `reports/lessons.md` (Vietnamese, hand-written), `tools/readme-check/{main.ts,check.test.ts}`; Modify `tools/token-report/report.ts` (+ its test) to append `reports/lessons.md` under `## Bài học`, `package.json` (`readme:check`), `reports/tokens-summary.md` (generated).
**Interfaces:** `checkReadme(md: string, siteUrl: string | undefined): string[]` returns problems: missing `siteUrl`, `siteUrl` not present in the README, or README lacking the required headings. `main.ts` also does `fetch(siteUrl, { method: 'HEAD' })` and reports non-200 (skipped with a warning when offline).
- [ ] Run `npm run tokens` (updates CSV, summary, Project fields). Read only `reports/tokens-summary.md` (never the CSV). Write `reports/lessons.md` in Vietnamese: loại task nào rẻ trên model nào (haiku/sonnet/opus, số liệu trung bình từ bảng), các lần escalate và lý do, tỷ lệ chi phí orchestration, 5 khuyến nghị cho dự án sau (ví dụ: plan chi tiết giúp haiku làm được nhiều hơn, task L nên chia nhỏ). `report.ts` includes this file at the end of `tokens-summary.md`; test: with a fixture lessons file the summary ends with `## Bài học` + its content; without the file the section is omitted.
- [ ] Root `README.md` (Vietnamese) sections in this order: `# Sakura` (một câu mô tả + ảnh `reports/` screenshot link), `## Xem trực tiếp` (link = `siteUrl` from `tools/project.json`), `## Điều khiển` (bảng desktop: WASD/mũi tên, Shift chạy, chuột kéo nhìn, cuộn zoom, P chụp ảnh, M tắt tiếng, Esc menu; mobile: joystick trái, kéo phải để nhìn, chụm để zoom, nút máy ảnh), `## Chạy cục bộ` (`npm ci`, `npm run dev`, `npm test`, `npm run e2e`, `npm run perf`, `?debug=1`, `?quality=`), `## Cách làm việc với AI` (kế hoạch trong `docs/superpowers/plans`, orchestrator + subagent theo model haiku/sonnet/opus, issue/PR cho từng task, `npm run tokens` và link `reports/tokens-summary.md`), `## Giấy phép và ghi công` (link `CREDITS.md`), `## Vấn đề đã biết`.
- [ ] Tests first: `checkReadme('# Sakura', 'https://x.netlify.app')` → non-empty (missing headings and link); a full fixture → `[]`; `siteUrl` undefined → contains a "siteUrl" problem (Review 5). If `tools/project.json` has no `siteUrl`, STOP and report to the orchestrator (human must connect Netlify, spec §10) instead of inventing a URL.
- [ ] Run `npm run readme:check` (must pass), `npm run credits`, `npm run budget`, final `npm run typecheck && npm test && npm run e2e`.
- [ ] After the PR is squash-merged, the orchestrator tags: `git tag -a v1.0.0 -m "Sakura v1.0.0"` and `git push origin v1.0.0`, and updates `docs/STATE.md` (Milestone: done).
**Acceptance:** `readme:check` green with a live 200 URL; `reports/tokens-summary.md` contains `## Bài học`; README sections present; all checks green; tag `v1.0.0` pushed by the orchestrator.

## Milestone exit (orchestrator)
- [ ] All M6 issues Done; `npm run tokens`; update + push `docs/STATE.md` (next milestone).
- [ ] Human checkpoint: post Netlify URL, wait for owner: v1 release: owner phone test passed, reports final, tag v1.0.0. Rejections become new issues in the next milestone (revert allowed).
