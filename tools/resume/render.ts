import type { ResumeData } from './collect.ts';

/** Total output budget: 1 header + STATE_CAP state lines + at most 24 other lines + NEXT = 40. */
export const MAX_LINES = 40;
export const STATE_CAP = 15;
export const SECTION_CAP = 6;
export const WARN_CAP = 4;

/** Keep at most `cap` lines; if more, the last kept line becomes "+N more" so the cap still holds. */
export function capLines(lines: string[], cap: number): string[] {
  if (lines.length <= cap) return lines;
  return [...lines.slice(0, cap - 1), `+${lines.length - (cap - 1)} more`];
}

export function suggest(d: ResumeData): string {
  const issueOf = (branch: string) => /^(?:feat|chore)\/(\d+)-/.exec(branch)?.[1];
  const dirty = d.worktrees.find((w) => (w.dirty || w.unpushed > 0) && issueOf(w.branch));
  if (dirty) return `commit/push #${issueOf(dirty.branch)}`;
  if (d.inProgress[0]) return `resume #${d.inProgress[0].issue}`;
  if (d.ready[0]) return `start ${d.ready[0]}`;
  return 'nothing pending; check docs/STATE.md';
}

/** The STATE.md part: printed first, before any network call. */
export function renderState(state: string): string[] {
  const body = state.split(/\r?\n/).filter((l) => l.trim() !== '');
  return ['== STATE.md ==', ...capLines(body, STATE_CAP)];
}

/** Everything after STATE.md; each section is capped so warnings and NEXT always survive. */
export function renderRest(d: ResumeData): string[] {
  const out: string[] = [];
  out.push(...capLines(d.inProgress.map((i) => `PROJECT #${i.issue} ${i.title}`), SECTION_CAP));
  out.push(...capLines(d.prs.map((p) => `PR #${p.number} ${p.draft ? 'draft' : 'ready'} ci=${p.ci} ${p.branch}`), SECTION_CAP));
  const wt = d.worktrees.filter((w) => w.dirty || w.unpushed > 0);
  out.push(
    ...capLines(
      wt.map((w) => `WT ${w.branch}: ${[w.dirty ? 'dirty' : '', w.unpushed ? `unpushed=${w.unpushed}` : ''].filter(Boolean).join(' ')} (${w.path})`),
      SECTION_CAP,
    ),
  );
  out.push(`READY ${d.ready.length ? d.ready.slice(0, SECTION_CAP).join(', ') : '(none)'}`);
  out.push(...capLines(d.warnings.map((w) => `WARN ${w}`), WARN_CAP));
  out.push(`NEXT: ${suggest(d)}`);
  return out;
}

export function render(d: ResumeData): string[] {
  return [...renderState(d.state), ...renderRest(d)];
}
