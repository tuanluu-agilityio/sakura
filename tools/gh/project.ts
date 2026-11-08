import { gh, ghJson, loadConfig } from './gh.ts';

export interface ProjectInfo {
  id: string;
  fields: Record<string, { id: string; options?: Record<string, string> }>;
}

interface ProjectItem {
  id: string;
  content?: { number?: number; type?: string };
  [field: string]: unknown;
}

let projectCache: ProjectInfo | null = null;
let itemsCache: ProjectItem[] | null = null;

/** Project node id + field ids (+ single-select option ids by name). Cached per run. */
export function loadProject(): ProjectInfo {
  if (projectCache) return projectCache;
  const { owner, projectNumber } = loadConfig();
  const n = String(projectNumber);
  const view = ghJson<{ id: string }>(['project', 'view', n, '--owner', owner, '--format', 'json']);
  const list = ghJson<{
    fields: { id: string; name: string; options?: { id: string; name: string }[] }[];
  }>(['project', 'field-list', n, '--owner', owner, '--limit', '100', '--format', 'json']);
  const fields: ProjectInfo['fields'] = {};
  for (const f of list.fields) {
    fields[f.name] = f.options
      ? { id: f.id, options: Object.fromEntries(f.options.map((o) => [o.name, o.id])) }
      : { id: f.id };
  }
  projectCache = { id: view.id, fields };
  return projectCache;
}

/** All project items (cached per run; call invalidateItems() after mutating membership). */
export function loadItems(): ProjectItem[] {
  if (itemsCache) return itemsCache;
  const { owner, projectNumber } = loadConfig();
  const out = ghJson<{ items: ProjectItem[] }>([
    'project', 'item-list', String(projectNumber), '--owner', owner, '--limit', '1000', '--format', 'json',
  ]);
  itemsCache = out.items;
  return itemsCache;
}

export function findItemByIssue(issueNumber: number): string | null {
  const item = loadItems().find((i) => i.content?.type === 'Issue' && i.content.number === issueNumber);
  return item ? item.id : null;
}

/** Current value of a field on an item, as listed by `gh project item-list` (lower-cased keys). */
export function getFieldValue(issueNumber: number, fieldName: string): unknown {
  const item = loadItems().find((i) => i.content?.type === 'Issue' && i.content.number === issueNumber);
  return item?.[fieldName.toLowerCase()];
}

/** Add an issue (by URL) to the project; returns the new item id. */
export function addIssueToProject(issueUrl: string): string {
  const { owner, projectNumber } = loadConfig();
  const out = ghJson<{ id: string }>([
    'project', 'item-add', String(projectNumber), '--owner', owner, '--url', issueUrl, '--format', 'json',
  ]);
  return out.id;
}

export function setField(itemId: string, fieldName: string, value: string | number): void {
  const project = loadProject();
  const field = project.fields[fieldName];
  if (!field) throw new Error(`Unknown project field "${fieldName}"`);
  const args = ['project', 'item-edit', '--id', itemId, '--project-id', project.id, '--field-id', field.id];
  if (typeof value === 'number') {
    args.push('--number', String(value));
  } else if (field.options) {
    const optionId = field.options[value];
    if (!optionId) throw new Error(`Field "${fieldName}" has no option "${value}"`);
    args.push('--single-select-option-id', optionId);
  } else {
    args.push('--text', value);
  }
  gh(args);
}
