# State
Milestone: M3
Updated: 2026-11-08

## In progress
- none

## Ready next
- M3 per docs/superpowers/plans (only after the owner approves the M2 checkpoint).

## Blocked
- Human checkpoint M2: owner checks the scene feels alive (train + barrier + lamps, couple, village, stream) and says go.

## Notes
- M2 done: #18-#22 merged (PRs 54-58). Parked for M6: chibi faceless, crossing gate colliders flip instantly, `__sakura.fps` floors at 10 when slow, debug setQuality leaves auto on, stream wade test slow under load.
- M1 done: #10-#17 merged (PRs 46-53). Parked for M6: real-GPU fps check (CI is software GL), grass blades get no shadows, close-up check of ground petal z-fight/mound striping.
- M0 done: #1-#6 merged (PRs #7,#8,#9,#43,#44,#45). Tokens: reports/tokens-summary.md
- Subagents cannot run `gh pr ready` / `gh issue edit` (permission); controller marks PRs ready and merges.
- Deferred minors to revisit: FpsMonitor boot-hitch downgrade (M6-T2); share AudioContext from assets.ts (M4-T1).
- Update this file after dispatch and after merge (see CLAUDE.md).
