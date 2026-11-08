import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { findItemByIssue, setField } from '../gh/project.ts';
import type { Pricing } from './price.ts';
import { buildRows, toCsv, toSummary, type TaskMeta } from './report.ts';
import { scanLogs } from './scan.ts';

const noProject = process.argv.includes('--no-project');

const here = (p: string) => new URL(p, import.meta.url);
const pricing = JSON.parse(readFileSync(here('./pricing.json'), 'utf8')) as Pricing;
const tasks = JSON.parse(readFileSync(here('../../docs/superpowers/plans/issue-map.json'), 'utf8')) as Record<string, TaskMeta>;

const rows = buildRows(scanLogs(), tasks, pricing);

mkdirSync(here('../../reports/'), { recursive: true });
writeFileSync(here('../../reports/tokens.csv'), toCsv(rows));
writeFileSync(here('../../reports/tokens-summary.md'), toSummary(rows, pricing));
console.log(`token-report: ${rows.length} rows -> reports/tokens.csv, reports/tokens-summary.md`);

if (!noProject) {
  let updated = 0;
  for (const r of rows) {
    if (r.issue === null || !tasks[r.taskId]) continue;
    const item = findItemByIssue(r.issue);
    if (!item) {
      console.warn(`warning: issue #${r.issue} (${r.taskId}) not on the Project - skipped`);
      continue;
    }
    setField(item, 'Input tokens', r.input);
    setField(item, 'Output tokens', r.output);
    setField(item, 'Cache write tokens', r.cacheWrite);
    setField(item, 'Cache read tokens', r.cacheRead);
    setField(item, 'Cost (USD)', Number(r.costUsd.toFixed(2)));
    setField(item, 'Agent runs', r.runs);
    if (r.implModel) setField(item, 'Model (actual)', r.implModel);
    updated++;
  }
  console.log(`token-report: updated ${updated} Project items`);
}
