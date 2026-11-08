import { attribute, type IssueMap } from './attribute.ts';
import { price, type Pricing } from './price.ts';
import { dedupe, type UsageRecord } from './scan.ts';

export interface TaskMeta {
  issue: number;
  model: string;
  type: string;
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
}

/** Model id -> family (opus|sonnet|haiku) so it is comparable to the planned model. */
export const family = (model: string): string => /opus|sonnet|haiku/.exec(model)?.[0] ?? model;

export function buildRows(
  raw: UsageRecord[],
  tasks: Record<string, TaskMeta>,
  pricing: Pricing,
): Row[] {
  const issueMap: IssueMap = Object.fromEntries(Object.entries(tasks).map(([id, t]) => [t.issue, id]));
  const rows = new Map<string, Row & { files: Set<string> }>();
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
        files: new Set(),
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
    row.costUsd += price(r, pricing);
  }
  const out: Row[] = [];
  for (const row of rows.values()) {
    const { files, ...rest } = row;
    out.push({ ...rest, runs: files.size, model: row.models.length === 1 ? (row.models[0] ?? '') : row.models.length ? 'mixed' : '' });
  }
  const order = (r: Row) => (r.taskId === 'orchestration' ? 'zzz' : r.taskId);
  return out.sort((a, b) => order(a).localeCompare(order(b), 'en', { numeric: true }));
}

const HEADER = 'taskId,issue,milestone,type,modelPlanned,model,runs,input,output,cacheWrite,cacheRead,costUsd';

export function toCsv(rows: Row[]): string {
  const lines = rows.map((r) =>
    [r.taskId, r.issue ?? '', r.milestone, r.type, r.modelPlanned, r.model, r.runs, r.input, r.output,
      r.cacheWrite, r.cacheRead, r.costUsd.toFixed(4)].join(','),
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

  const byTM = new Map<string, { n: number; cost: number }>();
  for (const r of tasks) {
    const k = `${r.type || '(không rõ)'}|${r.model || '(không rõ)'}`;
    const e = byTM.get(k) ?? { n: 0, cost: 0 };
    e.n += 1;
    e.cost += r.costUsd;
    byTM.set(k, e);
  }

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
      ['Loại task', 'Model', 'Số task', 'TB / task'],
      [...byTM].sort().map(([k, v]) => {
        const [t = '', m = ''] = k.split('|');
        return [t, m, v.n, usd(v.cost / v.n)];
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
