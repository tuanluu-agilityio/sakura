import type { EventBus, EventMap } from './types';

// Each registration is its own object, so unsubscribe removes exactly one even if fn is shared.
type Entry = { fn: (p: unknown) => void };

export function createBus(): EventBus {
  // Arrays are never mutated (copy-on-write): an in-progress emit iterates its own snapshot,
  // so listeners added or removed during emit take effect from the next emit.
  const listeners = new Map<keyof EventMap, readonly Entry[]>();
  return {
    on(t, fn) {
      const entry: Entry = { fn: fn as Entry['fn'] };
      listeners.set(t, [...(listeners.get(t) ?? []), entry]);
      return () => {
        const cur = listeners.get(t);
        if (cur) listeners.set(t, cur.filter((e) => e !== entry));
      };
    },
    emit(t, p) {
      const list = listeners.get(t);
      if (!list) return;
      for (const e of list) e.fn(p);
    },
  };
}
