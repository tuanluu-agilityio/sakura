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

const usd = (n: number) => `$${n.toFixed(2)}`;
const tokens = (r: Row) => r.input + r.output + r.cacheWrite + r.cacheRead;

function table(head: string[], body: (string | number)[][]): string {
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((b) => `| ${b.join(' | ')} |`)].join('\n');
}

export function toSummary(rows: Row[], pricing: Pricing): string {
  const total = rows.reduce((s, r) => s + r.costUsd, 0);
  const totalTok = rows.reduce((s, r) => s + tokens(r), 0);
  const orch = rows.find((r) => r.taskId === 'orchestration');
  const tasks = rows.filter((r) => r.taskId !== 'orchestration');

  const byMs = new Map<string, { n: number; cost: number }>();
  for (const r of tasks) {
    const k = r.milestone || '(không rõ)';
    const e = byMs.get(k) ?? { n: 0, cost: 0 };
    e.n += 1;
    e.cost += r.costUsd;
    byMs.set(k, e);
  }

  // record-level aggregation by (type, role, family): never a "mixed" bucket
  const byTRF = new Map<string, { tasks: Set<string>; cost: number }>();
  for (const r of tasks) {
    for (const p of r.parts) {
      const k = [r.type || '(không rõ)', p.role, p.family].join('|');
      const e = byTRF.get(k) ?? { tasks: new Set<string>(), cost: 0 };
      e.tasks.add(r.taskId);
      e.cost += p.cost;
      byTRF.set(k, e);
    }
  }

  const byPA = new Map<string, { n: number; cost: number }>();
  for (const r of tasks.filter((t) => t.implModel)) {
    const k = [r.modelPlanned || '(không rõ)', r.implModel].join('|');
    const e = byPA.get(k) ?? { n: 0, cost: 0 };
    e.n += 1;
    e.cost += r.implCostUsd;
    byPA.set(k, e);
  }

  const taskCost = tasks.reduce((s, r) => s + r.costUsd, 0);
  const reviewCost = tasks.reduce((s, r) => s + r.reviewCostUsd, 0);
  const unpriced = [...new Set(rows.flatMap((r) => r.unpriced))].sort();

  const top = [...tasks].sort((a, b) => b.costUsd - a.costUsd).slice(0, 5);
  const esc = tasks.filter((r) => r.models.length > 1);

  const parts: string[] = [
    '# Báo cáo token',
    '',
    `Giá tham chiếu kiểm tra ngày ${pricing.checked}. Chi phí tính bằng USD theo bảng giá trong \`tools/token-report/pricing.json\`.`,
    '',
    '## Tổng',
    '',
    `- Tổng chi phí: ${usd(total)}`,
    `- Tổng token (input + output + cache): ${totalTok.toLocaleString('en-US')}`,
    `- Số task có dữ liệu: ${tasks.length}`,
    '',
    '## Theo milestone',
    '',
    table(['Milestone', 'Số task', 'Chi phí'], [...byMs].sort().map(([k, v]) => [k, v.n, usd(v.cost)])),
    '',
    '## Theo loại task × model (chi phí trung bình mỗi task)',
    '',
    table(
      ['Loại task', 'Vai trò', 'Model', 'Số task', 'Tổng', 'TB / task'],
      [...byTRF].sort().map(([k, v]) => {
        const [t = '', ro = '', m = ''] = k.split('|');
        return [t, ro, m, v.tasks.size, usd(v.cost), usd(v.cost / v.tasks.size)];
      }),
    ),
    '',
    '## Model dự kiến vs thực tế (người implement)',
    '',
    table(
      ['Dự kiến', 'Thực tế', 'Số task', 'TB / task'],
      [...byPA].sort().map(([k, v]) => {
        const [pl = '', ac = ''] = k.split('|');
        return [pl, ac, v.n, usd(v.cost / v.n)];
      }),
    ),
    '',
    '## 5 task tốn kém nhất',
    '',
    top.length
      ? table(['Task', 'Model', 'Chi phí'], top.map((r) => [r.taskId, r.model, usd(r.costUsd)]))
      : '_Chưa có dữ liệu._',
    '',
    '## Leo thang model (task dùng hơn 1 model)',
    '',
    esc.length ? esc.map((r) => `- ${r.taskId}: ${r.models.join(', ')}`).join('\n') : '_Không có._',
    '',
    '## Review',
    '',
    taskCost > 0
      ? `- Tỷ trọng review: ${usd(reviewCost)} / ${usd(taskCost)} chi phí task (${((reviewCost / taskCost) * 100).toFixed(1)}%)`
      : '- Chưa có dữ liệu review.',
    '',
    '## Model chưa có giá (tính $0)',
    '',
    unpriced.length ? unpriced.map((m) => `- ${m}`).join('\n') : '_Không có._',
    '',
    '## Orchestration',
    '',
    orch && total > 0
      ? `- Chi phí orchestration: ${usd(orch.costUsd)} (${((orch.costUsd / total) * 100).toFixed(1)}% tổng)`
      : '- Chưa có dữ liệu orchestration.',
    '',
    '> Lưu ý: chỉ tính phiên trên máy này.',
    '',
  ];
  return parts.join('\n');
}
