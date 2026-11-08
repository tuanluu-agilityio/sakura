import type { Pricing } from './price.ts';
import type { Row } from './report.ts';

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
  const esc = tasks.filter((r) => r.implModel === 'mixed');

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
    '## Leo thang model (implementer dùng hơn 1 model)',
    '',
    esc.length ? esc.map((r) => `- ${r.taskId}: ${[...new Set(r.parts.filter((p) => p.role === 'implement').map((p) => p.family))].join(', ')}`).join('\n') : '_Không có._',
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
