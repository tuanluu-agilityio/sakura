# State
Milestone: M1
Updated: 2026-11-08

## In progress
- none

## Ready next
- M1 wave 1 (≤4 parallel): M1-T1 toon+postfx (opus), M1-T4 terrain (sonnet), M1-T5 sakura trees (opus), M1-T7 characters (sonnet)
- M1 wave 2: M1-T2 sky, M1-T3 Fuji, M1-T6 petals; then M1-T8 integration review
- Plan: docs/superpowers/plans/M1-static-scene.md (read only the task you dispatch)

## Blocked
- M0 human checkpoint: owner connects Netlify to the repo and confirms the empty pastel scene + `npm run tokens`. Start M1 only after the owner says go.

## Notes
- M0 done: #1-#6 merged (PRs #7,#8,#9,#43,#44,#45). Tokens: reports/tokens-summary.md
- Subagents cannot run `gh pr ready` / `gh issue edit` (permission); controller marks PRs ready and merges.
- Carry into M2-T2 brief: train front is at x=-400 at train time 0 (LAYOUT.train.startOffset derivation).
- Deferred minors to revisit: FpsMonitor boot-hitch downgrade (M6-T2); share AudioContext from assets.ts (M4-T1).
- Update this file after dispatch and after merge (see CLAUDE.md).
