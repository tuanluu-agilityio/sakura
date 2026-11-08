import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gh, ghJson, loadConfig } from '../gh/gh.ts';
import { addIssueToProject, findItemByIssue, getFieldValue, setField } from '../gh/project.ts';
import { parsePlan } from './parse.ts';

interface MapEntry {
  issue: number;
  model: string;
  type: string;
  size: string;
  depends: string[];
}

const PLANS_DIR = fileURLToPath(new URL('../../docs/superpowers/plans/', import.meta.url));
const MAP_FILE = PLANS_DIR + 'issue-map.json';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const msIdx = argv.indexOf('--milestone');
const onlyMilestone = msIdx >= 0 ? argv[msIdx + 1] : undefined;
if (msIdx >= 0 && !onlyMilestone) throw new Error('--milestone needs a value, e.g. --milestone M1');

const { repo, owner } = loadConfig();
const slug = `${owner}/${repo}`;
const log = (msg: string) => console.log(dryRun ? `[dry-run] ${msg}` : msg);

const map: Record<string, MapEntry> = existsSync(MAP_FILE)
  ? (JSON.parse(readFileSync(MAP_FILE, 'utf8')) as Record<string, MapEntry>)
  : {};

// One listing (instead of a per-task search) avoids search-index lag creating duplicates.
const existing = ghJson<{ number: number; title: string }[]>([
  'issue', 'list', '--repo', slug, '--state', 'all', '--limit', '1000', '--json', 'number,title',
]);

function findIssue(id: string): number | null {
  const prefix = `[${id}]`;
  const hit = existing.find((i) => i.title.startsWith(prefix));
  return hit ? hit.number : null;
}

let created = 0;
let adopted = 0;
let added = 0;
let fieldSets = 0;

const files = readdirSync(PLANS_DIR).filter((f) => /^M\d+-.*\.md$/.test(f)).sort();
for (const file of files) {
  const milestone = file.slice(0, file.indexOf('-'));
  if (onlyMilestone && milestone !== onlyMilestone) continue;
  // Numeric id order so intra-milestone dependencies resolve to already-created issues.
  const tasks = parsePlan(readFileSync(PLANS_DIR + file, 'utf8'), milestone).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  for (const t of tasks) {
    let issue = findIssue(t.id);
    let isNew = false;
    if (issue === null) {
      isNew = true;
      const deps = t.depends.map((d) => (map[d] ? `#${map[d].issue}` : d));
      const body = t.body + (deps.length ? `\n\nDepends: ${deps.join(', ')}` : '');
      const title = `[${t.id}] ${t.title}`;
      if (dryRun) {
        log(`create issue "${title}" labels=model:${t.model} milestone=${milestone}`);
        issue = 0;
      } else {
        const url = gh([
          'issue', 'create', '--repo', slug, '--title', title, '--body', body,
          '--label', `model:${t.model}`, '--milestone', milestone,
        ]);
        issue = Number(url.split('/').pop());
        existing.push({ number: issue, title });
        log(`created #${issue} ${title}`);
      }
      created++;
    } else {
      adopted++;
      log(`adopt #${issue} [${t.id}]`);
    }

    if (issue !== 0) {
      map[t.id] = { issue, model: t.model, type: t.type, size: t.size, depends: t.depends };
    }

    let item = issue === 0 ? null : findItemByIssue(issue);
    if (!item) {
      added++;
      if (dryRun) {
        log(`add [${t.id}] to project; set Task type=${t.type} Size=${t.size} Model (planned)=${t.model} Status=Todo`);
        continue;
      }
      item = addIssueToProject(`https://github.com/${slug}/issues/${issue}`);
      setField(item, 'Status', 'Todo');
    }
    if (dryRun) {
      // Existing item: report only fields that would change.
      const want: [string, string][] = [['Task type', t.type], ['Size', t.size], ['Model (planned)', t.model]];
      for (const [f, v] of want) {
        if (getFieldValue(issue, f) !== v) {
          log(`set ${f}=${v} on [${t.id}]`);
          fieldSets++;
        }
      }
      continue;
    }
    const want: [string, string][] = [['Task type', t.type], ['Size', t.size], ['Model (planned)', t.model]];
    for (const [f, v] of want) {
      if (isNew || getFieldValue(issue, f) !== v) {
        setField(item, f, v);
        fieldSets++;
      }
    }
  }
}

if (!dryRun) {
  const sorted = Object.fromEntries(
    Object.entries(map).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    ),
  );
  writeFileSync(MAP_FILE, JSON.stringify(sorted, null, 2) + '\n');
}
log(
  `summary: ${created} issue(s) ${dryRun ? 'to create' : 'created'}, ${adopted} adopted, ` +
    `${added} ${dryRun ? 'to add to' : 'added to'} project, ${fieldSets} field value(s) ${dryRun ? 'to set' : 'set'}`,
);
