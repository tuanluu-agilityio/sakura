import { describe, expect, it } from 'vitest';
import type { ResumeData } from './collect.ts';
import { MAX_LINES, capLines, render, suggest } from './render.ts';

const base = (): ResumeData => ({ state: 'Milestone: M1', inProgress: [], prs: [], worktrees: [], ready: [], warnings: [] });

describe('capLines', () => {
  it('keeps short lists, and replaces the tail with "+N more" while respecting the cap', () => {
    expect(capLines(['a', 'b'], 3)).toEqual(['a', 'b']);
    const c = capLines(['a', 'b', 'c', 'd', 'e'], 3);
    expect(c).toEqual(['a', 'b', '+3 more']);
  });
});

describe('render caps', () => {
  it('caps every section, stays <= 40 lines, and keeps warnings and NEXT', () => {
    const d: ResumeData = {
      state: Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n'),
      inProgress: Array.from({ length: 20 }, (_, i) => ({ issue: i, title: `t${i}`, status: 'In Progress' })),
      prs: Array.from({ length: 20 }, (_, i) => ({ number: i, title: 'p', draft: true, branch: `feat/${i}-x`, ci: 'pass' })),
      worktrees: Array.from({ length: 20 }, (_, i) => ({ path: `/w${i}`, branch: `feat/${i}-x`, dirty: true, unpushed: 1 })),
      ready: Array.from({ length: 20 }, (_, i) => `M1-T${i}`),
      warnings: Array.from({ length: 20 }, (_, i) => `w${i}`),
    };
    const out = render(d);
    expect(out.length).toBeLessThanOrEqual(MAX_LINES);
    expect(out.filter((l) => l.startsWith('PROJECT')).length).toBeLessThanOrEqual(6);
    expect(out.filter((l) => l.startsWith('PR ')).length).toBeLessThanOrEqual(6);
    expect(out.filter((l) => l.startsWith('WT ')).length).toBeLessThanOrEqual(6);
    expect(out.filter((l) => l.startsWith('WARN')).length).toBeLessThanOrEqual(4);
    expect(out.find((l) => l.startsWith('READY'))!.split(', ').length).toBe(6);
    expect(out.at(-1)).toMatch(/^NEXT: /);
    expect(out.some((l) => l.startsWith('WARN w0'))).toBe(true);
  });
});

describe('suggest priority', () => {
  it('dirty worktree beats in-progress beats ready beats idle', () => {
    const d = base();
    d.ready = ['M1-T1'];
    expect(suggest(d)).toBe('start M1-T1');
    d.inProgress = [{ issue: 7, title: 'x', status: 'In Progress' }];
    expect(suggest(d)).toBe('resume #7');
    d.worktrees = [{ path: '/w', branch: 'feat/9-y', dirty: false, unpushed: 2 }];
    expect(suggest(d)).toBe('commit/push #9');
  });

  it('ignores dirty worktrees that are not task branches (e.g. main)', () => {
    const d = base();
    d.worktrees = [{ path: '/r', branch: 'main', dirty: true, unpushed: 0 }];
    expect(suggest(d)).toBe('nothing pending; check docs/STATE.md');
  });
});
