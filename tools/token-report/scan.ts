import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface UsageRecord {
  msgId: string;
  model: string;
  ts: string;
  branch: string;
  description?: string;
  sessionFile: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export function defaultRoot(): string {
  return join(homedir(), '.claude', 'projects');
}

function dirs(p: string): string[] {
  try {
    return readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory());
  } catch {
    return [];
  }
}

function files(p: string, pred: (n: string) => boolean): string[] {
  try {
    return readdirSync(p).filter((n) => pred(n) && statSync(join(p, n)).isFile());
  } catch {
    return [];
  }
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** Parse one jsonl file into usage records; malformed lines are skipped silently. */
export function parseFile(path: string, description?: string): UsageRecord[] {
  const out: UsageRecord[] = [];
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return out;
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      const m = o?.message;
      const u = m?.usage;
      if (!u || typeof m.id !== 'string') continue;
      out.push({
        msgId: m.id,
        model: typeof m.model === 'string' ? m.model : '',
        ts: typeof o.timestamp === 'string' ? o.timestamp : '',
        branch: typeof o.gitBranch === 'string' ? o.gitBranch : '',
        description,
        sessionFile: path,
        input: num(u.input_tokens),
        output: num(u.output_tokens),
        cacheWrite: num(u.cache_creation_input_tokens),
        cacheRead: num(u.cache_read_input_tokens),
      });
    } catch {
      // malformed line: skip
    }
  }
  return out;
}

function readDescription(metaPath: string): string | undefined {
  try {
    const d = JSON.parse(readFileSync(metaPath, 'utf8')).description;
    return typeof d === 'string' ? d : undefined;
  } catch {
    return undefined;
  }
}

/** Scan project log dirs whose name contains "sakura": sessions and their subagents. */
export function scanLogs(root: string = defaultRoot()): UsageRecord[] {
  const out: UsageRecord[] = [];
  if (!existsSync(root)) return out;
  for (const d of dirs(root).filter((n) => n.toLowerCase().includes('sakura'))) {
    const dir = join(root, d);
    for (const f of files(dir, (n) => n.endsWith('.jsonl'))) out.push(...parseFile(join(dir, f)));
    for (const s of dirs(dir)) {
      const sub = join(dir, s, 'subagents');
      for (const f of files(sub, (n) => n.startsWith('agent-') && n.endsWith('.jsonl'))) {
        const description = readDescription(join(sub, f.replace(/\.jsonl$/, '.meta.json')));
        out.push(...parseFile(join(sub, f), description));
      }
    }
  }
  return out;
}

/** One record per msgId, keeping the one with the largest output (streamed partials repeat the id). */
export function dedupe(rs: UsageRecord[]): UsageRecord[] {
  const best = new Map<string, UsageRecord>();
  for (const r of rs) {
    const cur = best.get(r.msgId);
    if (!cur || r.output > cur.output) best.set(r.msgId, r);
  }
  return [...best.values()];
}
