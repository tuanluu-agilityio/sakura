import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
const SEP = String.fromCharCode(92);
import { BUDGET_BYTES, sumBudget, type SizedFile } from './budget.ts';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const root = 'dist';
const files: SizedFile[] = walk(root).map((p) => ({
  path: relative(root, p).split(SEP).join('/'),
  gzip: gzipSync(readFileSync(p)).length,
}));

console.log('Top 10 files (gzip):');
for (const f of [...files].sort((a, b) => b.gzip - a.gzip).slice(0, 10)) {
  console.log(`${(f.gzip / 1024).toFixed(1).padStart(10)} KB  ${f.path}`);
}
const total = sumBudget(files);
console.log(`Total: ${(total / 1048576).toFixed(2)} MB / ${BUDGET_BYTES / 1048576} MB`);
if (total > BUDGET_BYTES) {
  console.error('Budget exceeded');
  process.exit(1);
}
