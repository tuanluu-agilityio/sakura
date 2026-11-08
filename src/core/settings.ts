import type { EventBus, Settings, SettingsStore } from './types';

const KEY = 'sakura.settings';

function defaults(): Settings {
  return {
    musicVolume: 0.4,
    ambientVolume: 0.6,
    muted: false,
    quality: 'auto',
    lang: navigator.language.startsWith('vi') ? 'vi' : 'en',
  };
}

function load(storage: Storage): Partial<Settings> {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Partial<Settings>) : {};
  } catch {
    return {};
  }
}

export function createSettings(storage: Storage, bus: EventBus): SettingsStore {
  let current: Settings = { ...defaults(), ...load(storage) };
  return {
    get: () => ({ ...current }),
    set(patch) {
      current = { ...current, ...patch };
      try {
        storage.setItem(KEY, JSON.stringify(current));
      } catch {
        // Storage may be full or blocked (private mode); keep in-memory value.
      }
      bus.emit('settings:change', { settings: { ...current } });
    },
  };
}
