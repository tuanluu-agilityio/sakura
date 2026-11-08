# State
Milestone: M2
Updated: 2026-11-08

## In progress
- none

## Ready next
- M2 per docs/superpowers/plans/M2-*.md, after owner approves M1 screenshots.

## Blocked
- M1 human checkpoint: owner reviews composites (sakura-wt/17/test-results/m1-composite-*.png, or the live site). Start M2 only after the owner says go.

## Notes
- M1 done: #10-#17 merged (PRs 46-53). Parked for M6: real-GPU fps check (CI is software GL), grass blades get no shadows, close-up check of ground petal z-fight/mound striping.
- M0 done: #1-#6 merged (PRs #7,#8,#9,#43,#44,#45). Tokens: reports/tokens-summary.md
- Subagents cannot run `gh pr ready` / `gh issue edit` (permission); controller marks PRs ready and merges.
- Carry into M2-T2 brief: train front is at x=-400 at train time 0 (LAYOUT.train.startOffset derivation).
- Deferred minors to revisit: FpsMonitor boot-hitch downgrade (M6-T2); share AudioContext from assets.ts (M4-T1).
- Update this file after dispatch and after merge (see CLAUDE.md).
