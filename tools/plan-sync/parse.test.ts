import { describe, expect, it } from 'vitest';
import { parsePlan } from './parse.ts';

const FIXTURE = `# M9 Plan

### Task M9-B0: Bootstrap
**Model:** opus · **Type:** devops · **Size:** S · **Depends:** none
- [ ] skipped

---

### Task M9-T1: First thing
**Model:** sonnet · **Type:** scaffold · **Size:** M · **Depends:** none
**Files:** Create \`a.ts\`.
- [ ] do it

### Task M9-T2: Second thing
**Model:** haiku · **Type:** ui · **Size:** S · **Depends:** M9-T1, M8-T3 (uses \`x\`)
- [ ] do more

---
Trailing text not in a task.
`;

describe('parsePlan', () => {
  const tasks = parsePlan(FIXTURE, 'M9');

  it('parses two tasks with exact fields, skipping B0', () => {
    expect(tasks.map((t) => t.id)).toEqual(['M9-T1', 'M9-T2']);
    expect(tasks[0]).toMatchObject({
      id: 'M9-T1',
      title: 'First thing',
      model: 'sonnet',
      type: 'scaffold',
      size: 'M',
      depends: [],
    });
    expect(tasks[1]).toMatchObject({
      title: 'Second thing',
      model: 'haiku',
      type: 'ui',
      size: 'S',
      depends: ['M9-T1', 'M8-T3'],
    });
  });

  it('ends the body before the next ### Task or ---', () => {
    expect(tasks[0]?.body).toBe(
      '### Task M9-T1: First thing\n**Model:** sonnet · **Type:** scaffold · **Size:** M · **Depends:** none\n**Files:** Create `a.ts`.\n- [ ] do it',
    );
    expect(tasks[1]?.body.endsWith('- [ ] do more')).toBe(true);
    expect(tasks[1]?.body).not.toContain('Trailing');
  });
});
