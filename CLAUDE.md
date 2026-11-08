# Sakura

Relaxing single-page 3D anime-style Japanese countryside (Three.js + TypeScript + Vite), deployed on Netlify.

## Commands
- `npm run dev` / `build` / `preview`
- `npm run typecheck` (tsc --noEmit), `npm test` (vitest), `npm run e2e` (playwright)
- `npm run budget` (gzip size budget, run after build)
- `npm run tokens` / `resume` / `plan:sync` (project tooling)

## Folder rules
- Files <= 200 lines; shaders in `.glsl` (import with `?raw`). Feature README <= 20 lines.
- Features live in `src/features/<name>/`, export `default` a `Feature`. Features never import other features. Allowed imports: `three`, `src/core/*`, `src/shared/*`, own folder.
- `src/core/types.ts` changes after M0 = separate PR merged first, labelled `contract`.
- All agent-facing text in English. Human-facing (spec, `reports/tokens-summary.md`, root `README.md`) in Vietnamese.

## Binding rules
- Assets only in `public/assets/{models,audio,textures}`, each listed in `CREDITS.md` (CC0 or CC-BY only).
- Initial load <= 12 MB compressed excluding audio, enforced by `npm run budget`.
- Node >= 24, npm only. No runtime dependencies besides `three` until a task says so.

## Never read
`public/assets/**`, `dist/**`, `node_modules/**`, `reports/*.csv`, `.superpowers/**`, `package-lock.json`.

## Session start
- Rely on the `npm run resume` output; read only the current milestone plan and your task.
- Branch naming: `feat/N-slug` or `chore/N-slug`.
- Subagent dispatch description must start with `[#N] `.
- Commit and push after every step; open a draft PR with `Closes #N`.
- Update `docs/STATE.md` after dispatch and after merge.
