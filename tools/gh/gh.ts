import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export interface ProjectConfig {
  owner: string;
  repo: string;
  projectNumber: number;
  projectUrl?: string;
}

/** Run `gh` with args; returns trimmed stdout, throws with stderr on non-zero exit. */
export function gh(args: string[]): string {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`gh ${args.join(' ')} failed to start: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(`gh ${args.slice(0, 3).join(' ')} exited ${r.status}: ${r.stderr.trim()}`);
  }
  return r.stdout.trim();
}

export function ghJson<T>(args: string[]): T {
  return JSON.parse(gh(args)) as T;
}

export function loadConfig(): ProjectConfig {
  const url = new URL('../project.json', import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as ProjectConfig;
}
