// lib/settingsCache.ts
//
// Your Location Services / notifications settings, cached for the session.
// The profile request brings them along (so usually nothing is fetched), the
// settings screen updates them when you toggle, and only if nothing has
// filled the cache yet is GET /settings called.
import { getAuth } from 'firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface AppSettings {
  locationAllowed: boolean;
  notificationsEnabled: boolean;
}

let cached: AppSettings | null = null;
let pending: Promise<AppSettings> | null = null;

/** Server settings ({ is_location_allowed, notifications_enabled }) -> AppSettings. */
export function toAppSettings(data: any): AppSettings {
  return {
    locationAllowed: data?.is_location_allowed !== false,
    notificationsEnabled: data?.notifications_enabled !== false,
  };
}

export function setSettingsCache(settings: AppSettings) {
  cached = settings;
}

export function updateSettingsCache(changes: Partial<AppSettings>) {
  if (cached) cached = { ...cached, ...changes };
}

/** The cached settings, fetching them once if nothing has cached them yet. */
export async function getSettings(): Promise<AppSettings> {
  if (cached) return cached;
  if (!pending) {
    pending = (async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cached = toAppSettings(await res.json());
        return cached;
      } finally {
        pending = null;
      }
    })();
  }
  return pending;
}
