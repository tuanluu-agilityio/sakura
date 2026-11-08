export interface TaskSpec {
  id: string;
  title: string;
  model: string;
  type: string;
  size: string;
  depends: string[];
  body: string;
}

const HEADING = /^### Task (M\d+-[TB]\d+): (.+?)\s*$/;
const META = /^\*\*Model:\*\*\s*(.*?)\s*·\s*\*\*Type:\*\*\s*(.*?)\s*·\s*\*\*Size:\*\*\s*(.*?)\s*·\s*\*\*Depends:\*\*\s*(.*)$/;

export function parseDepends(raw: string): string[] {
  return raw.match(/M\d+-[TB]\d+/g) ?? [];
}

/** Parse `### Task M<m>-T<n>: <title>` sections of one milestone plan. */
export function parsePlan(md: string, milestone: string): TaskSpec[] {
  const lines = md.split(/\r?\n/);
  const tasks: TaskSpec[] = [];
  let i = 0;
  while (i < lines.length) {
    const head = HEADING.exec(lines[i] ?? '');
    if (!head) {
      i++;
      continue;
    }
    const start = i;
    i++;
    while (i < lines.length && !/^### Task /.test(lines[i] ?? '') && (lines[i] ?? '').trim() !== '---') i++;
    const id = head[1] as string;
    const title = head[2] as string;
    if (id.endsWith('-B0') || !id.startsWith(`${milestone}-`)) continue;
    const section = lines.slice(start, i);
    const meta = section.map((l) => META.exec(l)).find((m) => m !== null && m !== undefined);
    if (!meta) throw new Error(`Task ${id}: missing Model/Type/Size/Depends line`);
    tasks.push({
      id,
      title,
      model: meta[1] as string,
      type: meta[2] as string,
      size: meta[3] as string,
      depends: parseDepends(meta[4] as string),
      body: section.join('\n').trimEnd(),
    });
  }
  return tasks;
}
