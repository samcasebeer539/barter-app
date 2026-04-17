import { getAuth } from 'firebase/auth';
import { FeedItem, FeedProfile } from '@/types/index';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// ─── Fetch feed ───────────────────────────────────────────────────────────────

export async function getFeedPosts(): Promise<FeedItem[]> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/feed`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return data.map((p: any): FeedItem => ({
      id: p._id,
      title: p.post_title,
      image: p.photos?.[0] ?? '',
      date_posted: p.date_posted ?? '',
    }));
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getFeedPosts error:', err.message);
    throw err;
  }
}

// ─── Fetch profile for a tapped post ─────────────────────────────────────────

export async function getFeedProfile(postId: string): Promise<FeedProfile> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/feed/${postId}`, {
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
      tappedPostId: data.tapped_post_id,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getFeedProfile error:', err.message);
    throw err;
  }
}