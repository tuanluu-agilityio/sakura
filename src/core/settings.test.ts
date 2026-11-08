import { describe, it, expect } from 'vitest';
import { createBus } from './bus';
import { createSettings } from './settings';
import type { Settings } from './types';

function memoryStorage(init: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(init));
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k); },
    setItem: (k, v) => { data.set(k, String(v)); },
  };
}

const lang = navigator.language.startsWith('vi') ? 'vi' : 'en';
const DEFAULTS: Settings = { musicVolume: 0.4, ambientVolume: 0.6, muted: false, quality: 'auto', lang };

describe('createSettings', () => {
  it('uses defaults when storage is empty', () => {
    expect(createSettings(memoryStorage(), createBus()).get()).toEqual(DEFAULTS);
  });

  it('falls back to defaults on corrupt JSON', () => {
    const s = createSettings(memoryStorage({ 'sakura.settings': '{not json' }), createBus());
    expect(s.get()).toEqual(DEFAULTS);
  });

  it('merges stored values over defaults', () => {
    const s = createSettings(memoryStorage({ 'sakura.settings': '{"musicVolume":0.1}' }), createBus());
    expect(s.get()).toEqual({ ...DEFAULTS, musicVolume: 0.1 });
  });

  it('set persists and emits settings:change once', () => {
    const storage = memoryStorage();
    const bus = createBus();
    const events: Settings[] = [];
    bus.on('settings:change', (p) => events.push(p.settings));
    const s = createSettings(storage, bus);
    s.set({ muted: true });
    expect(s.get().muted).toBe(true);
    expect(JSON.parse(storage.getItem('sakura.settings') ?? '{}').muted).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.muted).toBe(true);
  });
});
