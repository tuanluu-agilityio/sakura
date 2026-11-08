import { collect, type ResumeData } from './collect.ts';

const MAX_LINES = 40;

export function suggest(d: ResumeData): string {
  const dirty = d.worktrees.find((w) => (w.dirty || w.unpushed > 0) && /^(?:feat|chore)\//.test(w.branch));
  const issueOf = (branch: string) => /^(?:feat|chore)\/(\d+)-/.exec(branch)?.[1];
  if (dirty) {
    const n = issueOf(dirty.branch);
    return `commit/push ${n ? `#${n}` : dirty.branch}`;
  }
  if (d.inProgress[0]) return `resume #${d.inProgress[0].issue}`;
  if (d.ready[0]) return `start ${d.ready[0]}`;
  return 'nothing pending; check docs/STATE.md';
}

export function render(d: ResumeData): string[] {
  const lines: string[] = [];
  lines.push('== STATE.md ==');
  lines.push(...d.state.split(/\r?\n/).filter((l) => l.trim() !== ''));
  lines.push('== In progress (Project) ==');
  lines.push(...(d.inProgress.length ? d.inProgress.map((i) => `#${i.issue} ${i.title}`) : ['(none)']));
  lines.push('== Open PRs ==');
  lines.push(...(d.prs.length ? d.prs.map((p) => `#${p.number} ${p.draft ? 'draft' : 'ready'} ci=${p.ci} ${p.branch}`) : ['(none)']));
  const wt = d.worktrees.filter((w) => w.dirty || w.unpushed > 0);
  lines.push('== Dirty/unpushed worktrees ==');
  lines.push(...(wt.length ? wt.map((w) => `${w.branch}: ${w.dirty ? 'dirty ' : ''}${w.unpushed ? `unpushed=${w.unpushed}` : ''} (${w.path})`) : ['(none)']));
  lines.push(`== Ready == ${d.ready.length ? d.ready.slice(0, 6).join(', ') : '(none)'}`);
  if (d.warnings.length) lines.push(...d.warnings.map((w) => `WARN ${w}`));
  const next = `NEXT: ${suggest(d)}`;
  const body = lines.length > MAX_LINES - 1 ? [...lines.slice(0, MAX_LINES - 2), '...(truncated)'] : lines;
  return [...body, next];
}

try {
  console.log(render(collect()).join('\n'));
} catch (e) {
  console.log(`resume failed: ${(e as Error).message}`);
}
process.exit(0);
