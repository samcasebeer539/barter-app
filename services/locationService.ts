import { Locations } from '@/types/index';
import { getAuth } from 'firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// ─── Fetch the logged-in user's own locations ─────────────────────────────────

export async function getMyLocations(): Promise<Locations[]> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/locations`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getMyLocations error:', err.message);
    throw err;
  }
}

// ─── Fetch another user's locations by their user ID ─────────────────────────

export async function getUserLocations(userId: string): Promise<Locations[]> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/locations/${userId}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getUserLocations error:', err.message);
    throw err;
  }
}

// ─── Save the logged-in user's full locations list ────────────────────────────
// Sends the entire array; backend replaces the stored list.

export async function saveMyLocations(locations: Locations[]): Promise<void> {
  const headers = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/dev/locations`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}