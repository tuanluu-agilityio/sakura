import { describe, expect, it } from 'vitest';
import { collect, computeReady, type Deps, type MapEntry } from './collect.ts';

const MAP: Record<string, MapEntry> = {
  'M1-T1': { issue: 10, depends: ['M0-B0'] },
  'M1-T2': { issue: 11, depends: ['M1-T1'] },
  'M1-T3': { issue: 12, depends: ['M1-T2'] },
  'M1-T4': { issue: 13, depends: ['M1-T1'] },
};

describe('computeReady', () => {
  it('dep closed -> ready; dep open -> not ready; closed/in-progress excluded', () => {
    const ready = computeReady(MAP, new Set([10]), new Set([13]));
    expect(ready).toEqual(['M1-T2']); // T1 closed, T3 blocked by open T2, T4 in progress
  });

  it('treats deps without an issue (bootstrap) as satisfied', () => {
    expect(computeReady(MAP, new Set(), new Set())).toEqual(['M1-T1']);
  });
});

function deps(run: Deps['run']): Deps {
  return {
    run,
    owner: 'o',
    projectNumber: 1,
    readText: (p) => (p.endsWith('STATE.md') ? '# State\nMilestone: M1' : JSON.stringify(MAP)),
  };
}

describe('collect', () => {
  it('turns gh failures into warnings and still returns state', () => {
    const d = deps((cmd, args) => {
      if (cmd === 'gh') throw new Error('gh not authenticated');
      if (args.includes('--porcelain') && args[0] === 'worktree') return 'worktree /r\nbranch refs/heads/main';
      return '';
    });
    const r = collect(d);
    expect(r.state).toContain('Milestone: M1');
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.inProgress).toEqual([]);
    expect(r.prs).toEqual([]);
    expect(r.ready).toEqual([]);
    expect(r.worktrees).toEqual([{ path: '/r', branch: 'main', dirty: false, unpushed: 0 }]);
  });

  it('collects items, PRs, dirty/unpushed worktrees and ready tasks', () => {
    const d = deps((cmd, args) => {
      const a = args.join(' ');
      if (a.startsWith('project item-list')) {
        return JSON.stringify({ items: [{ status: 'In Progress', title: '[M1-T4] x', content: { number: 13, type: 'Issue' } }, { status: 'Todo', content: { number: 11, type: 'Issue' } }] });
      }
      if (a.startsWith('pr list')) {
        return JSON.stringify([{ number: 20, title: 't', isDraft: true, headRefName: 'feat/13-x', statusCheckRollup: [{ status: 'COMPLETED', conclusion: 'SUCCESS' }] }]);
      }
      if (a.startsWith('issue list')) return JSON.stringify([{ number: 10 }]);
      if (a.startsWith('worktree list')) return 'worktree /r\nbranch refs/heads/main\n\nworktree /w\nbranch refs/heads/feat/13-x';
      if (a.includes('status --porcelain')) return a.includes('/w') ? ' M file.ts' : '';
      if (a.includes('rev-list')) return a.includes('/w') ? '2' : '0';
      throw new Error(`unexpected ${cmd} ${a}`);
    });
    const r = collect(d);
    expect(r.warnings).toEqual([]);
    expect(r.inProgress).toEqual([{ issue: 13, title: '[M1-T4] x', status: 'In Progress' }]);
    expect(r.prs).toEqual([{ number: 20, title: 't', draft: true, branch: 'feat/13-x', ci: 'pass' }]);
    expect(r.worktrees[1]).toEqual({ path: '/w', branch: 'feat/13-x', dirty: true, unpushed: 2 });
    expect(r.ready).toEqual(['M1-T2']);
  });
});
