import { getAuth } from 'firebase/auth';
import { FeedProfile } from '@/types/index';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getOffererProfile(userId: string): Promise<FeedProfile> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/users/${userId}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return {
      user: {
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        pronouns: data.user.pronouns,
        email: data.user.email,
        phone: data.user.phone,
        bio: data.user.bio,
        profileImageUrl: data.user.profile_photo,
        email_visible: data.user.email_visible ?? false,
        phone_visible: data.user.phone_visible ?? false,
        locations: data.user.locations ?? [],
      },
      posts: data.posts.map((p: any) => ({
        _id: p._id,
        name: p.post_title,
        description: p.description,
        photos: p.photos ?? [],
        date_posted: p.date_posted ?? '',
      })),
      tappedPostId: '',
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getOffererProfile error:', err.message);
    throw err;
  }
}