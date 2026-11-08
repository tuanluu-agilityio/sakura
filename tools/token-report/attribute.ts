import type { UsageRecord } from './scan.ts';

/** issueMap: issue number -> task id (e.g. 2 -> "M0-T2"). */
export type IssueMap = Record<number, string>;

export function attribute(r: Pick<UsageRecord, 'description' | 'branch'>, issueMap: IssueMap): string {
  const d = r.description?.match(/^\[#(\d+)\]/);
  const b = r.branch.match(/^(?:feat|chore)\/(\d+)-/);
  const n = d ? Number(d[1]) : b ? Number(b[1]) : null;
  if (n === null) return 'orchestration';
  return issueMap[n] ?? `#${n}`;
}
