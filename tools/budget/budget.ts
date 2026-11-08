export const BUDGET_BYTES = 12 * 1024 * 1024;

export interface SizedFile { path: string; gzip: number }

/** Convert Windows separators to '/'. */
export function normalizePath(p: string): string {
  return p.replaceAll('\\', '/');
}

/** Sum gzip sizes, excluding audio except the first music track (music-01.*, first by sorted path). */
export function sumBudget(files: SizedFile[]): number {
  const norm = files.map((f) => ({ path: normalizePath(f.path), gzip: f.gzip }));
  const isAudio = (p: string): boolean => p.includes('assets/audio/');
  const music = norm
    .filter((f) => /(^|\/)music-01\.[^/]+$/.test(f.path))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))[0];
  const kept = norm.filter((f) => !isAudio(f.path));
  if (music) kept.push(music);
  return kept.reduce((s, f) => s + f.gzip, 0);
}
