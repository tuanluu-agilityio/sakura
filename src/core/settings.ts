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

const QUALITIES: readonly Settings['quality'][] = ['auto', 'low', 'medium', 'high'];
const LANGS: readonly Settings['lang'][] = ['vi', 'en'];

function volume(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : fallback;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback;
}

/** Stored settings merged over defaults; every field is validated, invalid ones fall back. */
function load(storage: Storage): Settings {
  const d = defaults();
  let raw: unknown;
  try {
    raw = JSON.parse(storage.getItem(KEY) ?? '{}');
  } catch {
    return d;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
  const s = raw as Record<string, unknown>;
  return {
    musicVolume: volume(s.musicVolume, d.musicVolume),
    ambientVolume: volume(s.ambientVolume, d.ambientVolume),
    muted: typeof s.muted === 'boolean' ? s.muted : d.muted,
    quality: oneOf(s.quality, QUALITIES, d.quality),
    lang: oneOf(s.lang, LANGS, d.lang),
  };
}

export function createSettings(storage: Storage, bus: EventBus): SettingsStore {
  let current: Settings = load(storage);
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
