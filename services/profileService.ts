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
import { AppSettings, toAppSettings } from '@/lib/settingsCache';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ProfilePage {
  user: User;
  posts: Post[];
  locations: Locations[];
  incomingOffers: IncomingOffer[];
  incomingQueries: IncomingQuery[];
  /** Everyone with a pending offer on your posts, keyed by user id. */
  offererProfiles: Record<string, FeedProfile>;
  settings: AppSettings;
  /** Pass back as knownVersion to get null if nothing has changed. */
  version: string;
}

/** The whole profile, or null if knownVersion is given and nothing has
 *  changed since (the server answers 204 with no body). */
export async function getProfilePage(knownVersion = ''): Promise<ProfilePage | null> {
  const token = await getAuth().currentUser?.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE_URL}/dev/profile_page`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(knownVersion ? { 'X-Known-Version': knownVersion } : {}),
      },
      signal: controller.signal,
    });
    if (res.status === 204) return null;
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
      settings: toAppSettings(data.settings),
      version: res.headers.get('X-Version') ?? '',
    };
  } finally {
    clearTimeout(timeout);
  }
}
