import { User } from '@/types/index';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getCurrentUser(): Promise<User> {
  const headers = await getAuthHeader();

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

  // Map frontend field names → DB field names
  const { profileImageUrl, ...rest } = fields as any;
  const payload = {
    ...rest,
    ...(profileImageUrl !== undefined && { profile_photo: profileImageUrl }),
  };

  const res = await fetch(`${BASE_URL}/dev/update_user`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const uid = getAuth().currentUser?.uid;
  const storageRef = ref(storage, `profile_photos/${uid}`);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}