import type { EventBus, EventMap } from './types';

type Listener = (p: unknown) => void;

export function createBus(): EventBus {
  const listeners = new Map<keyof EventMap, Listener[]>();
  return {
    on(t, fn) {
      const list = listeners.get(t) ?? [];
      list.push(fn as Listener);
      listeners.set(t, list);
      return () => {
        const cur = listeners.get(t);
        if (!cur) return;
        // Copy-on-write so an in-progress emit keeps iterating its own snapshot.
        listeners.set(t, cur.filter((l) => l !== fn));
      };
    },
    emit(t, p) {
      const list = listeners.get(t);
      if (!list) return;
      for (const fn of list) fn(p);
    },
  };
}
