import { User } from '@/types/index';
import { getAuth } from 'firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getCurrentUser(): Promise<User> {
  console.log('BASE_URL:', BASE_URL);
  console.log('Full URL:', `${BASE_URL}/dev/user_data`);

  const headers = await getAuthHeader();
  console.log('Token present:', !!getAuth().currentUser);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/user_data`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Response data:', JSON.stringify(data));

    return {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      pronouns: data.pronouns,
      bio: data.bio,
      profileImageUrl: data.profile_photo,
      email_visible: data.email_visible ?? false,
      phone_visible: data.phone_visible ?? false,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('Fetch error:', err.message);
    throw err;
  }
}

export async function updateUser(fields: Partial<User>): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/dev/update_user`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}