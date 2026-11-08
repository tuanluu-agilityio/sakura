import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export interface ProjectItem { issue: number; title: string; status: string }
export interface PrInfo { number: number; title: string; draft: boolean; branch: string; ci: string }
export interface WtInfo { path: string; branch: string; dirty: boolean; unpushed: number }
export interface MapEntry { issue: number; depends: string[] }
export interface ResumeData {
  state: string;
  inProgress: ProjectItem[];
  prs: PrInfo[];
  worktrees: WtInfo[];
  ready: string[];
  warnings: string[];
}

/** Runs an external command and returns trimmed stdout; throws on failure. */
export type Runner = (cmd: string, args: string[], cwd?: string) => string;

export interface Deps {
  run: Runner;
  readText: (relPath: string) => string;
  owner: string;
  projectNumber: number;
}

export const defaultRun: Runner = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', cwd, maxBuffer: 64 * 1024 * 1024, timeout: 10_000 });
  if (r.error) throw new Error(`${cmd} failed to start: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 2).join(' ')} exited ${r.status}: ${r.stderr.trim()}`);
  return r.stdout.trim();
};

export function defaultDeps(): Deps {
  const root = new URL('../../', import.meta.url);
  const cfg = JSON.parse(readFileSync(new URL('tools/project.json', root), 'utf8')) as {
    owner: string;
    projectNumber: number;
  };
  return {
    run: defaultRun,
    readText: (p) => readFileSync(new URL(p, root), 'utf8'),
    owner: cfg.owner,
    projectNumber: cfg.projectNumber,
  };
}

/**
 * Tasks that are ready: in the current milestone (when given), not closed, not in progress,
 * and every dependency is a closed issue. A dependency missing from the map is satisfied only
 * if it is a bootstrap id (M<n>-B<n>, no issue); any other unknown dependency yields a warning
 * and keeps the task out of the ready list.
 */
export function computeReady(
  map: Record<string, MapEntry>,
  closed: Set<number>,
  inProgress: Set<number>,
  milestone?: string,
): { ready: string[]; warnings: string[] } {
  const ready: string[] = [];
  const warnings: string[] = [];
  for (const [id, e] of Object.entries(map)) {
    if (milestone && !id.startsWith(`${milestone}-`)) continue;
    if (closed.has(e.issue) || inProgress.has(e.issue)) continue;
    let ok = true;
    for (const d of e.depends) {
      const dep = map[d];
      if (dep) {
        if (!closed.has(dep.issue)) ok = false;
      } else if (!/^M\d+-B\d+$/.test(d)) {
        warnings.push(`unknown dependency ${d} of ${id}`);
        ok = false;
      }
    }
    if (ok) ready.push(id);
  }
  return { ready, warnings };
}

function ciState(rollup: { status?: string; conclusion?: string }[] | undefined): string {
  if (!rollup || rollup.length === 0) return 'no-ci';
  if (rollup.some((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'STARTUP_FAILURE'].includes(c.conclusion ?? ''))) return 'fail';
  if (rollup.some((c) => c.status && c.status !== 'COMPLETED')) return 'pending';
  return 'pass';
}

/** Gather everything; each external call is isolated so a failure becomes a warning, never a throw. */
export function collect(deps: Deps = defaultDeps()): ResumeData {
  const data: ResumeData = { state: '', inProgress: [], prs: [], worktrees: [], ready: [], warnings: [] };
  const attempt = <T>(label: string, fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (e) {
      data.warnings.push(`${label}: ${(e as Error).message.split('\n')[0]}`);
      return fallback;
    }
  };

  data.state = attempt('STATE.md', () => deps.readText('docs/STATE.md'), '(docs/STATE.md missing)');

  data.inProgress = attempt('project items', () => {
    const out = JSON.parse(
      deps.run('gh', ['project', 'item-list', String(deps.projectNumber), '--owner', deps.owner, '--limit', '200', '--format', 'json']),
    ) as { items: { status?: string; title?: string; content?: { number?: number; type?: string } }[] };
    return out.items
      .filter((i) => i.status === 'In Progress' && i.content?.type === 'Issue' && i.content.number !== undefined)
      .map((i) => ({ issue: i.content!.number!, title: i.title ?? '', status: 'In Progress' }));
  }, [] as ProjectItem[]);

  data.prs = attempt('open PRs', () => {
    const list = JSON.parse(
      deps.run('gh', ['pr', 'list', '--state', 'open', '--json', 'number,title,isDraft,headRefName,statusCheckRollup']),
    ) as { number: number; title: string; isDraft: boolean; headRefName: string; statusCheckRollup?: { status?: string; conclusion?: string }[] }[];
    return list.map((p) => ({ number: p.number, title: p.title, draft: p.isDraft, branch: p.headRefName, ci: ciState(p.statusCheckRollup) }));
  }, [] as PrInfo[]);

  const paths = attempt('git worktrees', () => {
    const porcelain = deps.run('git', ['worktree', 'list', '--porcelain']);
    const res: { path: string; branch: string }[] = [];
    for (const block of porcelain.split(/\r?\n\r?\n/)) {
      const path = /^worktree (.+)$/m.exec(block)?.[1];
      if (!path) continue;
      const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? '(detached)';
      res.push({ path, branch });
    }
    return res;
  }, [] as { path: string; branch: string }[]);
  for (const w of paths) {
    const dirty = attempt(`status ${w.branch}`, () => deps.run('git', ['-C', w.path, 'status', '--porcelain']).length > 0, false);
    let unpushed = 0;
    try {
      unpushed = Number(deps.run('git', ['-C', w.path, 'rev-list', '@{u}..HEAD', '--count'])) || 0;
    } catch {
      unpushed = 0; // no upstream configured: nothing to compare against
    }
    data.worktrees.push({ path: w.path, branch: w.branch, dirty, unpushed });
  }

  const map = attempt('issue-map.json', () => JSON.parse(deps.readText('docs/superpowers/plans/issue-map.json')) as Record<string, MapEntry>, null);
  if (map) {
    const closed = attempt('closed issues', () => {
      const rows = JSON.parse(deps.run('gh', ['issue', 'list', '--state', 'closed', '--limit', '1000', '--json', 'number'])) as { number: number }[];
      return new Set(rows.map((r) => r.number));
    }, null as Set<number> | null);
    if (closed) {
      const milestone = /^Milestone:\s*(M\d+)/m.exec(data.state)?.[1];
      if (!milestone) data.warnings.push('no Milestone: line in STATE.md; ready not filtered');
      const r = computeReady(map, closed, new Set(data.inProgress.map((i) => i.issue)), milestone);
      data.ready = r.ready;
      data.warnings.push(...r.warnings);
    }
  }

  return data;
}
