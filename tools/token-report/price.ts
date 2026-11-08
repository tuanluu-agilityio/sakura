import type { UsageRecord } from './scan.ts';

export interface ModelPrice {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface Pricing {
  notes?: string;
  checked: string;
  models: Record<string, ModelPrice>;
}

const warned = new Set<string>();

/** Longest-prefix match so `claude-opus-5-5` wins over `claude-opus-5`. */
export function findPrice(model: string, pricing: Pricing): ModelPrice | null {
  let best: string | null = null;
  for (const prefix of Object.keys(pricing.models)) {
    if (model.startsWith(prefix) && (best === null || prefix.length > best.length)) best = prefix;
  }
  return best === null ? null : (pricing.models[best] ?? null);
}

/** Cost in USD (prices are $/MTok). Unknown model: 0 and a one-time warning. */
export function price(r: UsageRecord, pricing: Pricing): number {
  const p = findPrice(r.model, pricing);
  if (!p) {
    if (!warned.has(r.model)) {
      warned.add(r.model);
      console.warn(`warning: no pricing for model "${r.model}" - cost counted as 0`);
    }
    return 0;
  }
  return (r.input * p.input + r.output * p.output + r.cacheWrite * p.cacheWrite + r.cacheRead * p.cacheRead) / 1e6;
}
