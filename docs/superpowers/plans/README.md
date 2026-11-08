# Sakura — Plan Index & Orchestrator Runbook

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Read ONLY this file + the milestone file of your task + `src/core/types.ts`. Do not read the spec unless your task says so.

**Spec:** `docs/superpowers/specs/2026-11-07-sakura-relax-design.md` (Vietnamese, approved 2026-11-07).
**Goal:** single-page relaxing 3D anime-style Japanese countryside (sakura, Fuji, train, couple, walkable third-person player, photo, audio), desktop + mobile, deployed on Netlify; with per-task token/cost tracking.
**Stack:** Three.js (pin exact latest stable at M0), TypeScript strict, Vite, Vitest, Playwright, nipplejs. No React/R3F/Babylon/physics engine.

## Milestone files
| File | Milestone | Human checkpoint |
|---|---|---|
| `M0-foundation.md` | repo, project, core contract, CI, tools | Netlify shows empty scene; `npm run tokens` works |
| `M1-static-scene.md` | sky, Fuji, terrain+grass, sakura trees, petals+wind, toon+postfx, character assets | standing still looks beautiful |
| `M2-life.md` | railway+crossing, train, village+stream, couple | scene feels alive |
| `M3-walk.md` | player, 3rd-person camera, mobile controls, petal kick-up | walkable on desktop + phone |
| `M4-audio.md` | audio engine, procedural fallback, sourced audio, wiring | sounds pleasant |
| `M5-experience.md` | loading+intro+start, UI/menu/i18n, photo, fallback/a11y/credits | complete experience |
| `M6-polish.md` | perf harness, optimisation, leak check, device check, final reports | v1 release |

## Global constraints (every task inherits these)
- Files ≤ 200 lines; shaders in `.glsl` (import with `?raw`). Feature README ≤ 20 lines.
- Features live in `src/features/<name>/`, export `default` a `Feature` (see contract). **Features never import other features.** Allowed imports: `three`, `src/core/*`, `src/shared/*`, own folder.
- `src/core/types.ts` changes after M0 = separate PR merged first, labelled `contract`.
- All agent-facing text in English. Human-facing (spec, `reports/tokens-summary.md`, root `README.md`) in Vietnamese.
- Assets only in `public/assets/{models,audio,textures}`; every asset listed in `CREDITS.md` with source URL + licence (CC0 or CC-BY only; no paid assets). Agents never read binary assets.
- Initial load ≤ 12 MB compressed excluding audio (first music track ≤ 1.5 MB allowed). Enforced by `npm run budget`.
- Perf: desktop 60 fps; mid phone ≥ 30 fps at `low`. Petal/grass animation on GPU only (InstancedMesh + vertex shader).
- Quality profiles (exact values, defined in `src/core/quality.ts`):
  | level | petals | shadowMapSize | bloom | maxPixelRatio | viewDistance (m) | grassDensity |
  |---|---|---|---|---|---|---|
  | low | 1500 | 1024 | false | 1 | 220 | 0.35 |
  | medium | 4000 | 2048 | true | 1.5 | 320 | 0.7 |
  | high | 8000 | 4096 | true | 2 | 450 | 1.0 |
- Auto quality: start `low` if touch device or `hardwareConcurrency ≤ 4`, else `medium`; downgrade one level when 5 s rolling avg fps < 50 (desktop) / < 28 (touch); never auto-upgrade.
- Palette (`src/core/palette.ts`): skyTop `#8ec5ff`, skyHorizon `#fde2ef`, grass `#9bd28a`, grassDark `#7cc06c`, blossom `#ffd6e6`, blossomDeep `#f7a8c8`, petal `#f48fb1`, fuji `#8aa6c9`, snow `#ffffff`, shadowTint `#8a7fb0`, trainBody `#f4f1ea`, trainStripe `#2f7ab8`, trunk `#7a5a48`, path `#c9b38f`, water `#9fd3e6`.
- Reference look: style A mockup in `.superpowers/brainstorm/*/content/visual-style.html` (local only).
- Browsers: last 2 Chrome/Edge/Safari/Firefox, iOS Safari ≥ 16, Chrome Android; WebGL2 required (else fallback image).
- `?debug=1` shows fps/quality overlay.

## Core contract (authoritative summary; M0-T2 creates `src/core/types.ts` exactly with these names)
```ts
type QualityLevel = 'low' | 'medium' | 'high';
interface QualityProfile { level: QualityLevel; petals: number; shadowMapSize: number; bloom: boolean; maxPixelRatio: number; viewDistance: number; grassDensity: number; }
type Surface = 'grass' | 'dirt' | 'wood' | 'stone' | 'water';
type GameMode = 'loading' | 'intro' | 'play' | 'photo' | 'menu';
interface EventMap {
  'game:mode': { mode: GameMode; prev: GameMode };
  'quality:change': { profile: QualityProfile };
  'train:approach': { direction: 1 | -1; eta: number };      // seconds until train front reaches crossing
  'train:pass': { direction: 1 | -1 };                         // front at crossing
  'train:clear': { direction: 1 | -1 };                        // tail left crossing zone
  'crossing:state': { closed: boolean };
  'wind:gust': { strength: number; direction: { x: number; z: number }; duration: number };
  'photo:request': {}; 'photo:done': { blob: Blob };
  'player:step': { surface: Surface; running: boolean };
  'ui:visibility': { visible: boolean };
  'settings:change': { settings: Settings };
}
interface EventBus { on<K extends keyof EventMap>(t: K, fn: (p: EventMap[K]) => void): () => void; emit<K extends keyof EventMap>(t: K, p: EventMap[K]): void; }
type Collider =
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'box'; x: number; z: number; hw: number; hd: number; rot: number };   // half extents, rot radians around Y
interface ColliderRegistry { add(c: Collider): string; remove(id: string): void; setEnabled(id: string, on: boolean): void; resolve(pos: THREE.Vector3, radius: number, prev?: THREE.Vector3): THREE.Vector3; }  // mutates+returns pos; prev enables anti-tunnelling sub-steps
interface Terrain { heightAt(x: number, z: number): number; surfaceAt(x: number, z: number): Surface; }
type Action = 'photo' | 'mute' | 'menu';
interface TouchSink { move(x: number, y: number, run: boolean): void; look(dx: number, dy: number): void; zoom(d: number): void; action(a: Action): void; }
interface InputState { move: THREE.Vector2; run: boolean; look: THREE.Vector2; zoom: number; consumeAction(a: Action): boolean; touch: TouchSink; }   // touch: M3-T3 feeds it
  // move: x=right y=forward, length ≤ 1. look: pixels since last frame (reset each frame). zoom: wheel/pinch delta since last frame.
interface AssetLoader { gltf(url: string): Promise<GLTF>; texture(url: string): Promise<THREE.Texture>; audio(url: string): Promise<AudioBuffer>; onProgress(fn: (loaded: number, total: number) => void): void; }
interface Settings { musicVolume: number; ambientVolume: number; muted: boolean; quality: 'auto' | QualityLevel; lang: 'vi' | 'en'; }
interface SettingsStore { get(): Settings; set(patch: Partial<Settings>): void; }   // persists to localStorage 'sakura.settings', emits settings:change
interface WindState { direction: THREE.Vector2; strength: number; gust: number; }  // gust 0..1 current gust envelope
interface WorldContext {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer;
  bus: EventBus; terrain: Terrain; colliders: ColliderRegistry; input: InputState;
  assets: AssetLoader; settings: SettingsStore; quality: QualityProfile; wind: WindState;
  player: { position: THREE.Vector3; heading: number; speed: number };   // written only by player feature
  mode: GameMode; setMode(m: GameMode): void;
  provideTerrain(t: Terrain): void;      // terrain feature calls once; default is flat (height 0, 'grass')
  time: { elapsed: number };
}
interface Feature { name: string; init(ctx: WorldContext): void | Promise<void>; update?(dt: number, elapsed: number): void; setQuality?(p: QualityProfile): void; dispose?(): void; }
```
- Feature registration order lives in `src/features/index.ts` (array); M1 fixes the base order `sky, postfx, fuji, terrain, sakura-trees, petals` (terrain before anything reading `ctx.terrain` at init); later features append after `petals`. Each milestone task appends its feature there (merge conflicts there are trivial; resolve by keeping all lines).
- Shared modules (not features): `src/shared/toon.ts` (`createToonMaterial(opts: { color: THREE.ColorRepresentation; map?: THREE.Texture; rim?: THREE.ColorRepresentation; }): THREE.Material` — stub in M0, upgraded in M1-T1, signature frozen), `src/shared/characters.ts` (M1-T7), `src/shared/train-schedule.ts` (M2-T2; `trainStateAt(t)` used by train, railway, audio, intro), `src/shared/i18n.ts` (M5-T2).
- Debug/test hook `window.__sakura = { ready, mode, quality, fps, setMode(m) }` (M0-T2). URL params: `?debug=1` overlay, `?quality=low|medium|high` forces a level (no auto downgrade).
- Quality resolution (M0-T2): URL param > `settings.quality` if not `'auto'` (manual ⇒ auto-downgrade disabled) > auto.

## World layout (`src/core/layout.ts`, created in M0-T3; units metres, +x east, −z north toward Fuji)
- Walkable bounds: x,z ∈ [−80, 80]; soft boundary (hills + hedge colliders) just outside.
- Player spawn `(0, 0, 30)` heading north (facing −z).
- Main tree on mound: centre `(0, 0)`, mound radius 9 m, height 1.8 m. Bench `(0, 3.2)` (just south of the trunk, on the mound) facing south (+z), length 2 m; the tree is behind/above the couple.
- Secondary trees: 12 fixed positions listed in layout (path rows along the dirt path + scattered), min 6 m from each other.
- Dirt path: polyline `(0,80)→(0,12)→(10,−20)→(10,−48)` (to crossing), width 2.4 m.
- Railway: straight along x at `z = −40`, embankment top height 1.4 m, width 6 m, track from x −400 to 400. Fences both sides z −37 / −43 except gap at crossing x ∈ [8, 12]. Crossing centre `(10, −40)`.
- Stream: polyline `(−80,15)→(−40,8)→(0,18)→(40,10)→(80,20)`, width 3 m, depth 0.6 m. Wooden bridge where the path crosses: centre `(0, 18)`, length 6 m, width 2.4 m, spanning z.
- Village: east, x ∈ [25, 70], z ∈ [−25, 5]: 5 houses, rice paddies x ∈ [−70, −30], z ∈ [−30, −5]; small torii at `(−20, −15)`; 6 stone lanterns along the path.
- Fuji: centre `(0, −900)`, base radius 520, height 330 (visual only, no collision).
- Train: 3 cars × 18 m, speed 14 m/s, period 75 s, alternating direction (first run +x). Crossing closes 8 s before arrival, opens 3 s after clear. `startOffset` = time shift so the first approach eta at page load ≈ 6 s (intro shows a train).
- Intro camera path: orbit-ish dolly from `(18, 6, 22)` to `(6, 2.5, 9)` looking at bench, 14 s loop.

## Model assignment rubric
| Model | Task types |
|---|---|
| haiku | config, docs, boilerplate with exact spec, simple UI, credits, simple tests |
| sonnet | most features, tooling scripts, audio, UI, asset sourcing |
| opus | core contract, toon/petal shaders, sakura tree generation, player controller & camera, perf optimisation, milestone integration review |
Escalation: 2 failed attempts (red CI or review reject) → re-dispatch on next tier; record the failure (it still counts in tokens).

## Task header format (every task in every milestone file)
```
### Task M<m>-T<n>: <title>
**Model:** haiku|sonnet|opus · **Type:** scaffold|feature-logic|shader-visual|asset-sourcing|ui|audio|test|docs|devops|integration|perf · **Size:** S|M|L · **Depends:** <task ids or none>
**Files:** Create/Modify lists · **Interfaces:** Consumes / Produces
- [ ] steps (TDD where logic exists) …
**Acceptance:** bullet list (must include: typecheck, unit tests, build, e2e smoke, screenshot attached to PR for visual tasks)
```
Milestones run in order: a milestone starts only after the previous milestone exit. `Depends: none` = no dependency inside the milestone; explicit cross-milestone ids are informational.
`tools/plan-sync` parses exactly `### Task M<m>-T<n>: <title>` headings and the `**Model:** … **Depends:** …` line. Do not change this format.

## Orchestrator runbook (main session, Opus)
**Session start:** read the `npm run resume` output (auto via SessionStart hook). Do not reread spec/plans beyond the current milestone file. Continue in-progress tasks before starting new ones.

**Per task:**
1. Pick ready tasks (deps Done) from current milestone; ≤ 4 concurrent.
2. Issue `#N` exists (created by `npm run plan:sync`). Set Status=In Progress (Status options: Todo, In Progress, Done; "in review" = open non-draft PR).
3. Create worktree: `git worktree add ../sakura-wt/N -b feat/N-<slug> main` (`chore/` for type docs/devops).
4. Dispatch implementer subagent with `model` = planned model, **description starting `[#N] `**, prompt = the task section verbatim + "Work in <worktree path>. Read CLAUDE.md, src/core/types.ts, your feature folder only. Commit + push after each step; open a draft PR `Closes #N` after the first commit; tick the issue checklist (`gh issue edit` body) as steps complete."
5. On return: CI green + review (dispatch reviewer on sonnet with description `[#N] review`, uses `/code-review low`; for visual tasks orchestrator also views the PR screenshot vs palette/mockup). Fix loop via same implementer model.
6. Mark PR ready, squash-merge, delete branch, `git worktree remove`. Set Status=Done, `Model (actual)`.
7. `npm run tokens` (updates CSV, summary, Project fields). Update + push `docs/STATE.md`.
**Stop & ask the human only when:** a task fails > 3 runs; a milestone costs > 2× the average of previous milestones (from M1); a milestone checkpoint is reached (post the Netlify URL and wait).
