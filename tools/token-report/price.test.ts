import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { price, type Pricing } from './price.ts';
import type { UsageRecord } from './scan.ts';

const pricing = JSON.parse(readFileSync(new URL('./pricing.json', import.meta.url), 'utf8')) as Pricing;

const rec = (over: Partial<UsageRecord>): UsageRecord => ({
  msgId: 'm', model: 'claude-opus-5-5', ts: '', branch: '', sessionFile: 'f',
  input: 0, output: 0, cacheWrite: 0, cacheRead: 0, ...over,
});

it('1M input tokens on opus costs the input price', () => {
  expect(price(rec({ input: 1_000_000 }), pricing)).toBe(pricing.models['claude-opus-5-5']!.input);
});
it('sums all four token kinds', () => {
  const p = { checked: 'x', models: { 'claude-x': { input: 1, output: 2, cacheWrite: 3, cacheRead: 4 } } };
  expect(price(rec({ model: 'claude-x-1', input: 1e6, output: 1e6, cacheWrite: 1e6, cacheRead: 1e6 }), p)).toBe(10);
});
it('longest prefix wins', () => {
  const p = {
    checked: 'x',
    models: {
      'claude-opus-5': { input: 5, output: 0, cacheWrite: 0, cacheRead: 0 },
      'claude-opus-5-5': { input: 4, output: 0, cacheWrite: 0, cacheRead: 0 },
    },
  };
  expect(price(rec({ model: 'claude-opus-5-5', input: 1e6 }), p)).toBe(4);
});
it('unknown model costs 0 and warns', () => {
  const warn = console.warn;
  const lines: string[] = [];
  console.warn = (s: string) => lines.push(s);
  try {
    expect(price(rec({ model: 'mystery-1', input: 1e6 }), pricing)).toBe(0);
  } finally {
    console.warn = warn;
  }
  expect(lines[0]).toContain('mystery-1');
});
