import { expect, it } from 'vitest';
import type { Pricing } from './price.ts';
import { buildRows, toCsv } from './report.ts';
import { toSummary } from './summary.ts';
import type { UsageRecord } from './scan.ts';

const pricing: Pricing = {
  checked: 'x',
  models: {
    'claude-opus-5': { input: 4, output: 0, cacheWrite: 0, cacheRead: 0 },
    'claude-sonnet-5': { input: 2, output: 0, cacheWrite: 0, cacheRead: 0 },
  },
};
const tasks = { 'M0-T2': { issue: 2, model: 'opus', type: 'feature-logic' } };

let n = 0;
const rec = (over: Partial<UsageRecord>): UsageRecord => ({
  msgId: `m${n++}`, model: 'claude-opus-5-5', ts: '', branch: 'main', sessionFile: 'f0',
  input: 1_000_000, output: 0, cacheWrite: 0, cacheRead: 0, ...over,
});

it('splits implement and review by role', () => {
  const [row] = buildRows(
    [
      rec({ branch: 'chore/2-x', sessionFile: 'impl' }),
      rec({ description: '[#2] review', model: 'claude-sonnet-5-5', sessionFile: 'rev' }),
    ],
    tasks,
    pricing,
  );
  expect(row).toMatchObject({
    taskId: 'M0-T2', implModel: 'opus', implCostUsd: 4, implRuns: 1,
    reviewModel: 'sonnet', reviewCostUsd: 2, reviewRuns: 1, costUsd: 6, model: 'mixed',
  });
});

it('implementer family ignores the reviewer; escalation gives mixed', () => {
  const [row] = buildRows(
    [
      rec({ branch: 'chore/2-x', sessionFile: 'a' }),
      rec({ branch: 'chore/2-x', model: 'claude-sonnet-5-5', sessionFile: 'b' }),
      rec({ description: '[#2] review', model: 'claude-haiku-5-5', sessionFile: 'c' }),
    ],
    tasks,
    pricing,
  );
  expect(row?.implModel).toBe('mixed');
  expect(row?.reviewModel).toBe('haiku');
});

it('unattributed records are orchestration, even when described as review', () => {
  const rows = buildRows([rec({ description: 'review something' })], tasks, pricing);
  expect(rows[0]?.taskId).toBe('orchestration');
  expect(rows[0]?.parts[0]?.role).toBe('orchestration');
});

it('lists unpriced models and prices them at 0', () => {
  const rows = buildRows([rec({ branch: 'chore/2-x', model: 'claude-haiku-5-5' })], tasks, pricing);
  expect(rows[0]?.unpriced).toEqual(['claude-haiku-5-5']);
  expect(rows[0]?.costUsd).toBe(0);
  expect(toSummary(rows, pricing)).toContain('claude-haiku-5-5');
});

it('csv has the role columns and summary never buckets mixed', () => {
  const rows = buildRows(
    [rec({ branch: 'chore/2-x', sessionFile: 'a' }), rec({ branch: 'chore/2-x', model: 'claude-sonnet-5-5', sessionFile: 'b' })],
    tasks,
    pricing,
  );
  expect(toCsv(rows).split('\n')[0]).toContain('implModel,implCostUsd,implRuns,reviewModel,reviewCostUsd,reviewRuns');
  const typeTable = toSummary(rows, pricing).split('## Model dự kiến')[0]!.split('Theo loại task')[1]!;
  expect(typeTable).toContain('| feature-logic | implement | opus |');
  expect(typeTable).toContain('| feature-logic | implement | sonnet |');
  expect(typeTable).not.toContain('mixed');
});
