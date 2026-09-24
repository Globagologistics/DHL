import { supabase } from '../../lib/supabase';
import { environment } from '../../config/environment';
import { settingsDefaults } from '../../features/settings/defaults';
import type { SettingsKey, SettingsRecord, SettingsValueMap } from '../../features/settings/types';

/**
 * Storage for NON-SECRET operational settings.
 *
 * - database: the `app_settings` table (migration 20260925000002), protected by RLS.
 * - development: this browser's localStorage, only when VITE_SETTINGS_DEV_ADAPTER=true
 *   in a Vite dev build. Lets the settings UI be exercised before Part Two.
 * - defaults: built-in values when no store is reachable (read-only).
 *
 * Credentials never pass through this module.
 */

type StoredValue = { value: Record<string, unknown> | null; updatedAt: string | null };

interface SettingsAdapter {
  source: 'database' | 'development';
  read(key: SettingsKey): Promise<StoredValue>;
  write(key: SettingsKey, value: Record<string, unknown>): Promise<string>;
}

const DEV_PREFIX = 'dhl-dev-settings:';

const developmentAdapter: SettingsAdapter = {
  source: 'development',
  async read(key) {
    try {
      const raw = localStorage.getItem(DEV_PREFIX + key);
      if (!raw) return { value: null, updatedAt: null };
      const parsed = JSON.parse(raw) as { value: Record<string, unknown>; updatedAt: string };
      return { value: parsed.value, updatedAt: parsed.updatedAt };
    } catch {
      return { value: null, updatedAt: null };
    }
  },
  async write(key, value) {
    const updatedAt = new Date().toISOString();
    localStorage.setItem(DEV_PREFIX + key, JSON.stringify({ value, updatedAt }));
    return updatedAt;
  },
};

const databaseAdapter: SettingsAdapter = {
  source: 'database',
  async read(key) {
    const { data, error } = await supabase.from('app_settings').select('value,updated_at').eq('key', key).limit(1);
    if (error) throw new SettingsStoreUnavailableError();
    const row = (data as { value: Record<string, unknown>; updated_at: string }[] | null)?.[0];
    return { value: row?.value ?? null, updatedAt: row?.updated_at ?? null };
  },
  async write(key, value) {
    if (typeof supabase.from('app_settings').upsert !== 'function') throw new SettingsStoreUnavailableError();
    const { data, error } = await supabase.from('app_settings').upsert({ key, value }).select('updated_at').limit(1);
    if (error) throw new Error(error.code === '42501' ? 'Only the administrator can change settings.' : 'Settings could not be saved. Please try again.');
    return (data as { updated_at: string }[] | null)?.[0]?.updated_at ?? new Date().toISOString();
  },
};

export class SettingsStoreUnavailableError extends Error {
  constructor() {
    super('Settings storage is not available yet. It is created by the app_settings migration during deployment.');
  }
}

const activeAdapter = (): SettingsAdapter => (environment.settingsDevAdapter ? developmentAdapter : databaseAdapter);

/** Merges stored fields over defaults so older rows stay valid when fields are added. */
function merge<K extends SettingsKey>(key: K, stored: Record<string, unknown> | null): SettingsValueMap[K] {
  const defaults = settingsDefaults[key] as unknown as Record<string, unknown>;
  if (!stored) return { ...defaults } as unknown as SettingsValueMap[K];
  const merged: Record<string, unknown> = { ...defaults };
  for (const [field, fallback] of Object.entries(defaults)) {
    const value = stored[field];
    if (value === undefined || value === null) continue;
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && typeof value === 'object') {
      merged[field] = { ...(fallback as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else if (typeof value === typeof fallback) {
      merged[field] = value;
    }
  }
  return merged as unknown as SettingsValueMap[K];
}

const cache = new Map<SettingsKey, Promise<SettingsRecord<SettingsKey>>>();
const listeners = new Set<(key: SettingsKey) => void>();

export function readSettings<K extends SettingsKey>(key: K, options: { fresh?: boolean } = {}): Promise<SettingsRecord<K>> {
  if (options.fresh) cache.delete(key);
  let pending = cache.get(key) as Promise<SettingsRecord<K>> | undefined;
  if (!pending) {
    const adapter = activeAdapter();
    pending = adapter.read(key)
      .then(stored => ({ value: merge(key, stored.value), source: stored.value ? adapter.source : 'defaults', updatedAt: stored.updatedAt, writable: true } as SettingsRecord<K>))
      .catch(() => {
        cache.delete(key);
        return { value: merge(key, null), source: 'defaults', updatedAt: null, writable: false } as SettingsRecord<K>;
      });
    cache.set(key, pending as Promise<SettingsRecord<SettingsKey>>);
  }
  return pending;
}

export async function writeSettings<K extends SettingsKey>(key: K, value: SettingsValueMap[K]): Promise<SettingsRecord<K>> {
  const updatedAt = await activeAdapter().write(key, value as unknown as Record<string, unknown>);
  const record: SettingsRecord<K> = { value, source: activeAdapter().source, updatedAt, writable: true };
  cache.set(key, Promise.resolve(record) as Promise<SettingsRecord<SettingsKey>>);
  listeners.forEach(listener => listener(key));
  return record;
}

/** Notifies same-tab readers (for example the Home WhatsApp action) after a save. */
export function subscribeToSettings(listener: (key: SettingsKey) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const settingsStoreMode = () => activeAdapter().source;
