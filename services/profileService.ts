// services/profileService.ts
//
// Everything the profile screen shows, in one request (GET /dev/profile_page),
// instead of separate requests for your user, posts, saved locations,
// incoming offers, incoming questions and the offerers' profiles.
import { getAuth } from 'firebase/auth';
import { User, Post, Locations, FeedProfile } from '@/types/index';
import { toUser } from './userService';
import { toPost } from './postService';
import { toFeedProfile } from './offererService';
import type { IncomingOffer, IncomingQuery } from './tradeService';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ProfilePage {
  user: User;
  posts: Post[];
  locations: Locations[];
  incomingOffers: IncomingOffer[];
  incomingQueries: IncomingQuery[];
  /** Everyone with a pending offer on your posts, keyed by user id. */
  offererProfiles: Record<string, FeedProfile>;
}

export async function getProfilePage(): Promise<ProfilePage> {
  const token = await getAuth().currentUser?.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE_URL}/dev/profile_page`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      user: toUser(data.user),
      posts: (data.posts ?? []).map(toPost),
      locations: data.locations ?? [],
      incomingOffers: data.incomingOffers ?? [],
      incomingQueries: data.incomingQueries ?? [],
      offererProfiles: Object.fromEntries(
        Object.entries(data.offererProfiles ?? {}).map(([id, p]) => [id, toFeedProfile(p)]),
      ),
    };
  } finally {
    clearTimeout(timeout);
  }
}
