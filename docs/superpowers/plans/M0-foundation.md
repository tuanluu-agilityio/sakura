# M0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Read `docs/superpowers/plans/README.md` (constraints, contract, layout) first. Steps use `- [ ]`.

**Goal:** Empty-but-real app on GitHub + Netlify with the frozen core contract, CI, and the three AI-workflow tools (plan-sync, token report, resume).
**Architecture:** Vite + TS app; `src/core` owns loop/renderer/bus/quality/input/colliders/layout/settings; features plug in via `src/features/index.ts`. Tools are dependency-free Node 24 scripts run with native TS type-stripping (`node tools/x/main.ts`; use `import type`, no enums/namespaces).
**Tech Stack:** three (exact pin), typescript, vite, vitest, @playwright/test, nipplejs (installed in M3).
**Spec:** `docs/superpowers/specs/2026-11-07-sakura-relax-design.md` §3–§5.

## Global Constraints
See README "Global constraints". Additionally for M0: Node ≥ 24; `npm` only; no runtime deps besides `three`.

## Review Focus
1. Tab hidden for minutes then shown → first frame dt huge → must clamp to 0.1 s (test in T2).
2. Browser resize / phone rotation → renderer + camera aspect update, pixel ratio capped by profile (e2e in T2).
3. Player at run speed (6 m/s, dt 0.1) pushing into a thin box (hw 0.1) → must not tunnel (test in T3).
4. Same assistant message logged multiple times / partial streaming lines → tokens counted once (test in T5).
5. `npm run resume` with no network / `gh` failing → still prints STATE.md + local git state, exit 0 (test in T6).

---

### Task M0-B0: Orchestrator bootstrap (inline, no subagent, no issue)
Run by the main session before anything else; tokens land in `orchestration`.
- [ ] `git push`-ready: `gh repo create tuanluu-agilityio/sakura --public --source . --remote origin --push`
- [ ] Create project: `gh project create --owner tuanluu-agilityio --title Sakura` → record number; `gh project link <n> --owner tuanluu-agilityio --repo tuanluu-agilityio/sakura`.
- [ ] Create fields (`gh project field-create`): single-select `Milestone` (M0..M6), `Task type` (scaffold, feature-logic, shader-visual, asset-sourcing, ui, audio, test, docs, devops, integration, perf), `Size` (S,M,L), `Model (planned)` and `Model (actual)` (haiku, sonnet, opus, mixed); number fields `Input tokens`, `Output tokens`, `Cache write tokens`, `Cache read tokens`, `Cost (USD)`, `Agent runs`. Status field exists by default: ensure options Todo, In Progress, In Review, Done.
- [ ] Create GitHub milestones M0..M6 (`gh api repos/:owner/:repo/milestones -f title=M0 ...`), labels `model:haiku|sonnet|opus`, `contract`.
- [ ] Write `tools/project.json`: `{ "owner": "tuanluu-agilityio", "repo": "sakura", "projectNumber": <n> }` and commit to `main` directly ("chore: project config").
- [ ] Manually create issues for M0-T1..T6 with titles `[M0-Tn] <title>`, body = task section; add to project. (plan-sync later adopts them by title prefix.)

### Task M0-T1: App scaffold, CI, Netlify, CLAUDE.md
**Model:** sonnet · **Type:** scaffold · **Size:** M · **Depends:** M0-B0
**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts` (temporary: renders a pastel clear colour), `src/style.css`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `.github/workflows/ci.yml`, `netlify.toml`, `CLAUDE.md`, `CREDITS.md` (header only), `tools/budget/main.ts`, `public/assets/.gitkeep`.
**Interfaces:** Produces npm scripts: `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `e2e` (`playwright test`), `budget` (`node tools/budget/main.ts`), placeholders `tokens`, `resume`, `plan:sync` (filled by T4–T6).
- [ ] Init: `npm i three@<latest stable> -E`, `npm i -D typescript vite vitest @playwright/test @types/three -E`. tsconfig: `strict`, `noUncheckedIndexedAccess`, `moduleResolution: bundler`, `allowImportingTsExtensions` + `noEmit`, include `src`, `tools`, `tests`. Vite: `?raw` imports for `.glsl` (add `src/glsl.d.ts`).
- [ ] Playwright config: projects `desktop` (1280×720 Chromium) and `mobile` (`devices['Pixel 7']`); `webServer` = `npm run build && npm run preview -- --port 4173`.
- [ ] Write failing `smoke.spec.ts`: `test('boots without console errors')` — collects `console` errors + `pageerror`, goto `/`, expects `canvas` visible, expects `await page.evaluate(() => (window as any).__sakura?.ready) === true` within 10 s, expects errors `[]`; screenshot to `test-results/smoke-<project>.png`.
- [ ] Minimal `main.ts`: WebGL2 renderer full-screen canvas, clear colour `#fde2ef`, sets `window.__sakura = { ready: true }`. Run `npm run e2e` → PASS both projects.
- [ ] `tools/budget/main.ts`: after build, sum gzip size (node:zlib) of `dist/**` excluding `dist/assets/audio/**` except first file matching `music-01.*`; fail (exit 1) if > 12 MB; print table top 10 files. Unit test `tools/budget/budget.test.ts`: `sumBudget(files)` excludes audio except music-01, threshold 12*1024*1024.
- [ ] CI `ci.yml` on push/PR: node 24, `npm ci`, typecheck, test, build, budget, `npx playwright install --with-deps chromium`, e2e; upload `test-results/*.png` as artifact `screenshots`.
- [ ] `netlify.toml`: build `npm run build`, publish `dist`, node 24, headers: `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.
- [ ] `CLAUDE.md` (≤ 60 lines, English): project one-liner; commands; folder rules (copy "Global constraints" bullets 1–4 from plans README); **Never read**: `public/assets/**`, `dist/**`, `node_modules/**`, `reports/*.csv`, `.superpowers/**`, `package-lock.json`; **Session start**: rely on resume output, read only current milestone plan + task; branch naming `feat/N-slug`/`chore/N-slug`; subagent dispatch description must start `[#N] `; commit+push after every step, draft PR `Closes #N`; update `docs/STATE.md` after dispatch/merge.
- [ ] Commit, push, PR, CI green.
**Acceptance:** CI green; `npm run budget` passes; screenshots artifact present; CLAUDE.md ≤ 60 lines.

### Task M0-T2: Core contract, loop, renderer, bus, quality, settings, assets
**Model:** opus · **Type:** feature-logic · **Size:** M · **Depends:** M0-T1
**Files:** Create `src/core/{types.ts,bus.ts,loop.ts,renderer.ts,quality.ts,settings.ts,assets.ts,context.ts,debug.ts,palette.ts}`, `src/shared/toon.ts`, `src/features/index.ts`, `src/features/README.md`; tests `src/core/{bus,loop,quality,settings}.test.ts`; Modify `src/main.ts`, `tests/e2e/smoke.spec.ts`.
**Interfaces:**
- Produces: everything in README "Core contract" verbatim in `types.ts`; `createBus(): EventBus`; `createLoop(onFrame: (dt: number, elapsed: number) => void): { start(): void; stop(): void }` with `clampDt(raw: number): number` = `Math.min(Math.max(raw, 0), 0.1)`; `QUALITY_PROFILES: Record<QualityLevel, QualityProfile>` (exact table values); `pickInitialQuality(env: { touch: boolean; cores: number }): QualityLevel`; `resolveQuality(o: { url: string; setting: Settings['quality']; auto: QualityLevel }): { level: QualityLevel; auto: boolean }`; `class FpsMonitor { constructor(touch: boolean); sample(dt: number): 'downgrade' | null }` (5 s window, thresholds 50/28, resets window after downgrade); `createSettings(storage: Storage, bus: EventBus): SettingsStore` defaults `{ musicVolume: 0.4, ambientVolume: 0.6, muted: false, quality: 'auto', lang: navigator.language.startsWith('vi') ? 'vi' : 'en' }`, merges stored JSON, ignores corrupt JSON; `createAssets(): AssetLoader` (GLTFLoader with MeshoptDecoder, TextureLoader, AudioContext decode; progress aggregates all pending); `createContext(canvas): WorldContext` (PerspectiveCamera fov 55, near 0.1, **far 2500** so Fuji at 900 m renders; flat default terrain, `setMode` emits `game:mode`, `provideTerrain`); `PALETTE` constants (README); `createToonMaterial(opts)` stub = `MeshToonMaterial` with 3-step gradient map; `features: Feature[]` (empty array) in `src/features/index.ts`.
- [ ] Tests first: bus `on` returns unsubscribe, emit order preserved, unsubscribe during emit safe; `clampDt(5) === 0.1`, `clampDt(-1) === 0`; `pickInitialQuality({touch:true,cores:8}) === 'low'`, `({touch:false,cores:4}) === 'low'`, `({touch:false,cores:8}) === 'medium'`; `resolveQuality({ url: '?quality=high', setting: 'auto', auto: 'low' })` → `{ level: 'high', auto: false }`; `({url:'', setting:'medium', auto:'low'})` → `{ level:'medium', auto:false }`; `({url:'', setting:'auto', auto:'low'})` → `{ level:'low', auto:true }`; FpsMonitor: 6 s of dt=1/40 desktop → one `'downgrade'`, then null for next 4.9 s; 6 s of 1/60 → never; settings: corrupt localStorage → defaults; `set({muted:true})` persists + emits once. Run → FAIL.
- [ ] Implement modules; `main.ts`: createContext → `await Promise.all(features.map(f => f.init(ctx)))` sequentially in array order (await each) → loop calls `update` on each feature, FpsMonitor downgrade → `setQuality` on all + `quality:change`; renderer resize on `resize`/`orientationchange` with `setPixelRatio(min(devicePixelRatio, profile.maxPixelRatio))`; `visibilitychange` hidden → loop stop, visible → start (dt clamp covers the gap). Sets `ctx.mode = 'intro'` after init. `window.__sakura = { ready, get mode(), get quality(), get fps(), setMode(m) }`. Quality resolution per README (URL `?quality=` > manual setting > auto; non-auto disables FpsMonitor); react to `settings:change` quality. `debug.ts`: `?debug=1` overlay (fps, quality, mode, draw calls).
- [ ] e2e add `test('resizes on viewport change')`: set viewport 800×600 then 600×800 → canvas client size matches, `__sakura.ready` still true, no errors.
- [ ] `src/features/README.md` (≤ 20 lines): how to write a feature (template), the no-cross-import rule, registration in `index.ts`.
- [ ] All green; commit; PR.
**Acceptance:** unit + e2e green; `types.ts` matches README contract names exactly; label PR `contract`.

### Task M0-T3: Input, colliders, layout
**Model:** sonnet · **Type:** feature-logic · **Size:** M · **Depends:** M0-T2
**Files:** Create `src/core/{input.ts,colliders.ts,layout.ts}`, tests `src/core/{input,colliders,layout}.test.ts`; Modify `src/core/context.ts`.
**Interfaces:**
- Produces: `createInput(target: HTMLElement): InputState & { endFrame(): void }` — keyboard WASD/arrows (normalised diagonal), Shift run, mouse drag or pointer-lock look, wheel zoom, keys P/M/Escape → actions; `touch: TouchSink` merges touch input into the same state (M3-T3 calls it; last-writer-wins per frame between keyboard and touch move). `endFrame()` resets look/zoom (called by loop after updates).
- `createColliders(): ColliderRegistry` — circle/box (rotated) vs circle push-out; `resolve(pos, radius, prev?)` (contract): when `prev` given, sweep from `prev` to `pos` in sub-steps with displacement ≤ radius/2 each, pushing out at every sub-step.
- `LAYOUT` object with every value in README "World layout" (typed: `spawn`, `train` incl. `startOffset`, `mainTree`, `mound`, `bench`, `trees: {x,z,scale}[]` 12 entries, `path: {x,z}[]`, `pathWidth`, `railway`, `fences`, `crossing`, `stream`, `bridge`, `village`, `paddies`, `torii`, `lanterns` (6), `fuji`, `train`, `intro`, `bounds`), plus `distanceToPolyline(x, z, pts): number` helper.
- [ ] Tests: diagonal W+D → move length 1; `consumeAction('photo')` true once after P keydown then false; collider: circle r=0.4 at x=0 moving from z=2 to z=−2 through box (hw 2, hd 0.1) with prev given → ends z ≥ 0.1+0.4 (no tunnelling); rotated box 45° push-out direction correct; `setEnabled(id,false)` lets through; layout: all 12 trees ≥ 6 m apart, none within 3 m of path, all inside bounds; bridge lies on path ∩ stream (distance < 1 m to both).
- [ ] Implement; wire into `createContext`. Green; commit; PR.
**Acceptance:** tests green; no feature folders touched.

### Task M0-T4: plan-sync (plans → issues + Project)
**Model:** sonnet · **Type:** devops · **Size:** M · **Depends:** M0-T1
**Files:** Create `tools/gh/{gh.ts,project.ts}`, `tools/plan-sync/{parse.ts,main.ts,parse.test.ts}`, `docs/superpowers/plans/issue-map.json` (generated, committed).
**Interfaces:**
- Produces: `gh(args: string[]): string` (spawnSync, throws on non-zero with stderr); `loadProject(): { id: string; fields: Record<string, { id: string; options?: Record<string, string> }> }` (cached per run, via `gh project view/field-list --format json`); `setField(itemId, fieldName, value: string | number)`; `findItemByIssue(issueNumber): string | null`.
- `parsePlan(md: string, milestone: string): TaskSpec[]` where `TaskSpec = { id: string; title: string; model: string; type: string; size: string; depends: string[]; body: string }` — reads `### Task M<m>-T<n>: <title>` and the `**Model:** … · **Type:** … · **Size:** … · **Depends:** …` line; skips `M0-B0`.
- `issue-map.json`: `{ "<taskId>": { "issue": number, "model": string, "type": string, "size": string, "depends": string[] } }`.
- [ ] Tests on a fixture string: 2 tasks parsed with exact fields; depends `none` → `[]`; `M0-B0` skipped; body ends before next `### Task` or `---`.
- [ ] `main.ts`: for each `M*-*.md` in plans dir → for each task: find existing issue by title prefix `[<id>]` (`gh issue list --search "in:title [<id>]" --state all --json number,title`); create if missing (title `[<id>] <title>`, body = task body + `\n\nDepends: #a, #b` resolved via map, labels `model:<model>`, milestone `M<m>`); ensure in project; set fields Task type/Size/Model (planned), Status Todo if new (the project's built-in `Milestone` column comes from the issue milestone; there is no custom Milestone field). Writes `issue-map.json`. Flags: `--dry-run`, `--milestone M1`.
- [ ] Run `npm run plan:sync -- --dry-run` (prints planned actions), then real run for all milestones; commit `issue-map.json`.
**Acceptance:** idempotent (second run creates nothing); all plan tasks visible in Project with fields set.

### Task M0-T5: Token report
**Model:** sonnet · **Type:** devops · **Size:** M · **Depends:** M0-T4 (uses `tools/gh`)
**Files:** Create `tools/token-report/{scan.ts,attribute.ts,price.ts,report.ts,main.ts,pricing.json}`, tests `tools/token-report/{attribute,price,scan}.test.ts`, fixtures `tools/token-report/fixtures/{main.jsonl,subagents/agent-x.jsonl,subagents/agent-x.meta.json}`; outputs `reports/tokens.csv`, `reports/tokens-summary.md`.
**Interfaces:**
- `scanLogs(root = ~/.claude/projects): UsageRecord[]` — dirs whose name contains `sakura`; files `*/*.jsonl` (sessions) and `*/*/subagents/agent-*.jsonl` (+ sibling `.meta.json` → `description`). `UsageRecord = { msgId: string; model: string; ts: string; branch: string; description?: string; sessionFile: string; input: number; output: number; cacheWrite: number; cacheRead: number }` from lines with `message.usage`. Skip malformed lines silently.
- `dedupe(rs): UsageRecord[]` — one per `msgId`, keep record with max `output`.
- `attribute(r, issueMap): string` → task id: `description` matches `^\[#(\d+)\]` → map issue→taskId; else `branch` matches `^(feat|chore)/(\d+)-` → map; else `'orchestration'`. Unknown issue number → `'#<n>'`.
- `price(r, pricing): number` USD. `pricing.json`: `{ "checked": "YYYY-MM-DD", "models": { "<model-id-prefix>": { "input": $/MTok, "output": …, "cacheWrite": …, "cacheRead": … } } }`, prefix match on model id (e.g. `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-5`). **Fill real prices by invoking the `claude-api` skill; write today's date in `checked`.** Unknown model → cost 0 + warning line.
- Report: CSV rows `taskId,issue,milestone,type,modelPlanned,model,runs,input,output,cacheWrite,cacheRead,costUsd` (runs = distinct subagent files + distinct sessions on that branch); `tokens-summary.md` in Vietnamese: totals; by milestone; by task type × model (avg cost/task); top 5 costly tasks; escalations (tasks with >1 model); orchestration share; note "chỉ tính phiên trên máy này".
- Project update: per task issue → set Input/Output/Cache write/Cache read tokens, Cost (USD) (2 decimals), Agent runs, Model (actual) (single model or `mixed`). `--no-project` flag skips.
- [ ] Tests: fixture with duplicated msgId (3 lines, outputs 10/50/50) → counted once with 50; description `[#12] review` → attributed to map[12]; branch `feat/7-sky` → map[7]; `main` → orchestration; malformed line skipped; price of 1M input on opus = pricing value.
- [ ] Implement; `npm run tokens` on real logs; commit reports.
**Acceptance:** tests green; current B0/M0 work appears (orchestration + M0 tasks); Project fields populated.

### Task M0-T6: STATE.md, resume command, SessionStart hook
**Model:** sonnet · **Type:** devops · **Size:** S · **Depends:** M0-T4
**Files:** Create `docs/STATE.md`, `tools/resume/{main.ts,collect.ts,collect.test.ts}`, `.claude/settings.json`.
**Interfaces:**
- `docs/STATE.md` template (≤ 30 lines): `Milestone:`, `Updated:` (ISO), `## In progress` (`- #N [Mx-Ty] branch=… worktree=… done: steps… next: …`), `## Ready next`, `## Blocked`, `## Notes` (≤ 5 lines).
- `collect(): { state: string; inProgress: ProjectItem[]; prs: PrInfo[]; worktrees: WtInfo[]; ready: string[]; warnings: string[] }`; each external call wrapped — failure → warning, never throw. `ready` = tasks whose deps are all closed issues and which are not closed/in progress, from `issue-map.json` + `gh issue list --state closed`.
- `main.ts` prints ≤ 40 lines: STATE.md body, in-progress items, open PRs (draft?, CI state), dirty/unpushed worktrees (`git -C <wt> status --porcelain`, `git rev-list @{u}..HEAD --count`), ready tasks (first 6), warnings, then line `NEXT: <suggestion>` (dirty worktree → "commit/push #N"; in-progress → "resume #N"; else first ready task).
- `.claude/settings.json`: SessionStart hook running `npm run --silent resume` (verify current hook schema with the `update-config` skill before writing).
- [ ] Tests: `collect` with injected runner where `gh` throws → warnings non-empty, state still returned; ready computation with fixture map (dep closed → ready; dep open → not).
- [ ] Implement; run `npm run resume` manually; open a new Claude Code session to confirm hook output appears.
**Acceptance:** tests green; hook verified; output ≤ 40 lines.

## Milestone exit (orchestrator)
- [ ] All M0 issues Done; `npm run plan:sync` run for M1–M6; `npm run tokens`; update STATE.md (Milestone: M1).
- [ ] Ask human to connect Netlify (spec §10) and check checkpoint: empty pastel scene on Netlify URL, `npm run tokens` output.
