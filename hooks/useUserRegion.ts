// hooks/useUserRegion.ts
//
// The "Location Services" setting, and the area around the device for maps.
// The setting is saved on the server (is_location_allowed) and cached in
// lib/settingsCache (filled by the profile request, or fetched once).
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getSettings, updateSettingsCache } from '@/lib/settingsCache';

/** Whether the user has Location Services turned on in settings. */
export async function getLocationAllowed(): Promise<boolean> {
  try {
    return (await getSettings()).locationAllowed;
  } catch (err) {
    console.error('Failed to load location setting:', err);
    return false;
  }
}

/** Called by the settings screen whenever the toggle changes. */
export function setLocationAllowedCache(value: boolean) {
  updateSettingsCache({ locationAllowed: value });
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * The area around the device, or null if Location Services is off in settings,
 * the phone hasn't granted location access, or no position is available.
 * Never asks for permission itself (the settings toggle does that).
 */
export function useUserRegion(enabled = true): Region | null {
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        if (!(await getLocationAllowed())) return;
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        // A recent cached fix is instant; fall back to a fresh one.
        const pos =
          (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && pos) {
          setRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (err) {
        console.error('Failed to get device location:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  return region;
}
