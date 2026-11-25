import { Locations } from '@/types/index';
import { apiJson } from '@/lib/api';

// ─── The logged-in user's own locations ──────────────────────────────────────

export function getMyLocations(): Promise<Locations[]> {
  return apiJson('/dev/locations');
}

// ─── Another user's locations by their user ID ───────────────────────────────

export function getUserLocations(userId: string): Promise<Locations[]> {
  return apiJson(`/dev/locations/${userId}`);
}

// ─── Save the logged-in user's full locations list ───────────────────────────
// Sends the entire array; backend replaces the stored list.

export async function saveMyLocations(locations: Locations[]): Promise<void> {
  await apiJson('/dev/locations', { method: 'PUT', body: { locations } });
}
