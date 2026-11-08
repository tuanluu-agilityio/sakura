const SEP = String.fromCharCode(92);
export const BUDGET_BYTES = 12 * 1024 * 1024;

export interface SizedFile { path: string; gzip: number }

/** Sum gzip sizes, excluding audio except the first music track (music-01.*). */
export function sumBudget(files: SizedFile[]): number {
  return files
    .filter((f) => {
      const p = f.path.split(SEP).join('/');
      if (!p.includes('assets/audio/')) return true;
      return /(^|\/)music-01\.[^/]+$/.test(p);
    })
    .reduce((s, f) => s + f.gzip, 0);
}
