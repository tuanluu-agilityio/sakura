import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { dedupe, scanLogs } from './scan.ts';

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url));

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tokrep-'));
  const proj = join(root, 'D--proj-sakura');
  mkdirSync(join(proj, 'sess1'), { recursive: true });
  cpSync(join(fixtures, 'main.jsonl'), join(proj, 'sess1.jsonl'));
  cpSync(join(fixtures, 'subagents'), join(proj, 'sess1', 'subagents'), { recursive: true });
  // a non-sakura project must be ignored
  mkdirSync(join(root, 'D--other'), { recursive: true });
  cpSync(join(fixtures, 'main.jsonl'), join(root, 'D--other', 'o.jsonl'));
  return root;
}

it('scans sessions and subagents, skips malformed lines and other projects', () => {
  const rs = scanLogs(makeRoot());
  expect(rs).toHaveLength(5); // 3 dup + 1 branch + 1 subagent; malformed + non-usage skipped
  const sub = rs.find((r) => r.msgId === 'msg_c');
  expect(sub?.description).toBe('[#12] review');
  expect(sub?.cacheRead).toBe(1000);
});

it('dedupes by msgId keeping max output', () => {
  const rs = dedupe(scanLogs(makeRoot()));
  expect(rs).toHaveLength(3);
  expect(rs.find((r) => r.msgId === 'msg_dup')?.output).toBe(50);
});

it('returns [] for a missing root', () => {
  expect(scanLogs(join(tmpdir(), 'does-not-exist-tokrep'))).toEqual([]);
});
