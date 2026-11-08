import { attribute, type IssueMap } from './attribute.ts';
import { findPrice, price, type Pricing } from './price.ts';
import { dedupe, type UsageRecord } from './scan.ts';

export interface TaskMeta {
  issue: number;
  model: string;
  type: string;
}

export type Role = 'implement' | 'review' | 'orchestration';

export const roleOf = (r: Pick<UsageRecord, 'description'>, taskId: string): Role =>
  taskId === 'orchestration' ? 'orchestration' : /review/i.test(r.description ?? '') ? 'review' : 'implement';

export interface Part {
  role: Role;
  family: string;
  cost: number;
}

export interface Row {
  taskId: string;
  issue: number | null;
  milestone: string;
  type: string;
  modelPlanned: string;
  model: string; // single model family, or "mixed"
  models: string[];
  runs: number;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  costUsd: number;
  implModel: string; // implementer family, "mixed" only for an escalation, '' if none
  implCostUsd: number;
  implRuns: number;
  reviewModel: string;
  reviewCostUsd: number;
  reviewRuns: number;
  parts: Part[]; // cost per (role, family), for record-level aggregation
  unpriced: string[]; // model ids priced at $0
}

/** Model id -> family (opus|sonnet|haiku) so it is comparable to the planned model. */
export const family = (model: string): string => /opus|sonnet|haiku/.exec(model)?.[0] ?? model;

export function buildRows(
  raw: UsageRecord[],
  tasks: Record<string, TaskMeta>,
  pricing: Pricing,
): Row[] {
  const issueMap: IssueMap = Object.fromEntries(Object.entries(tasks).map(([id, t]) => [t.issue, id]));
  const rows = new Map<string, Row & { files: Set<string>; roleFiles: Record<Role, Set<string>>; roleFams: Record<Role, Set<string>> }>();
  for (const r of dedupe(raw)) {
    if (r.model === '<synthetic>') continue; // client-generated placeholder, no real usage
    const taskId = attribute(r, issueMap);
    let row = rows.get(taskId);
    if (!row) {
      const meta = tasks[taskId];
      const unknownIssue = /^#(\d+)$/.exec(taskId);
      row = {
        taskId,
        issue: meta ? meta.issue : unknownIssue ? Number(unknownIssue[1]) : null,
        milestone: /^(M\d+)-/.exec(taskId)?.[1] ?? '',
        type: meta?.type ?? '',
        modelPlanned: meta?.model ?? '',
        model: '',
        models: [],
        runs: 0,
        input: 0, output: 0, cacheWrite: 0, cacheRead: 0, costUsd: 0,
        implModel: '', implCostUsd: 0, implRuns: 0, reviewModel: '', reviewCostUsd: 0, reviewRuns: 0,
        parts: [], unpriced: [],
        files: new Set(),
        roleFiles: { implement: new Set(), review: new Set(), orchestration: new Set() },
        roleFams: { implement: new Set(), review: new Set(), orchestration: new Set() },
      };
      rows.set(taskId, row);
    }
    row.files.add(r.sessionFile);
    const fam = family(r.model);
    if (r.model && !row.models.includes(fam)) row.models.push(fam);
    row.input += r.input;
    row.output += r.output;
    row.cacheWrite += r.cacheWrite;
    row.cacheRead += r.cacheRead;
    const cost = price(r, pricing);
    row.costUsd += cost;
    const role = roleOf(r, taskId);
    row.roleFiles[role].add(r.sessionFile);
    if (r.model) row.roleFams[role].add(fam);
    if (findPrice(r.model, pricing) === null && r.model && !row.unpriced.includes(r.model)) row.unpriced.push(r.model);
    const part = row.parts.find((p) => p.role === role && p.family === fam);
    if (part) part.cost += cost;
    else row.parts.push({ role, family: fam, cost });
    if (role === 'implement') row.implCostUsd += cost;
    else if (role === 'review') row.reviewCostUsd += cost;
  }
  const out: Row[] = [];
  for (const row of rows.values()) {
    const { files, roleFiles, roleFams, ...rest } = row;
    const one = (set: Set<string>) => (set.size === 1 ? ([...set][0] ?? '') : set.size ? 'mixed' : '');
    out.push({
      ...rest,
      runs: files.size,
      model: row.models.length === 1 ? (row.models[0] ?? '') : row.models.length ? 'mixed' : '',
      implModel: one(roleFams.implement),
      implRuns: roleFiles.implement.size,
      reviewModel: one(roleFams.review),
      reviewRuns: roleFiles.review.size,
    });
  }
  const order = (r: Row) => (r.taskId === 'orchestration' ? 'zzz' : r.taskId);
  return out.sort((a, b) => order(a).localeCompare(order(b), 'en', { numeric: true }));
}

const HEADER = 'taskId,issue,milestone,type,modelPlanned,model,runs,input,output,cacheWrite,cacheRead,costUsd,implModel,implCostUsd,implRuns,reviewModel,reviewCostUsd,reviewRuns';

export function toCsv(rows: Row[]): string {
  const lines = rows.map((r) =>
    [r.taskId, r.issue ?? '', r.milestone, r.type, r.modelPlanned, r.model, r.runs, r.input, r.output,
      r.cacheWrite, r.cacheRead, r.costUsd.toFixed(4), r.implModel, r.implCostUsd.toFixed(4), r.implRuns, r.reviewModel,
      r.reviewCostUsd.toFixed(4), r.reviewRuns].join(','),
  );
  return [HEADER, ...lines].join('\n') + '\n';
}
