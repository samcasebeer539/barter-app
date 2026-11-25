import { FeedProfile } from '@/types/index';
import { apiJson } from '@/lib/api';

// Server profile ({ user, posts }) -> FeedProfile.
export function toFeedProfile(data: any): FeedProfile {
  return {
    user: {
      _id: data.user._id,
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
      rating: data.user.rating ?? 0,
      reviewCount: data.user.reviewCount ?? 0,
    },
    posts: (data.posts ?? []).map((p: any) => ({
      _id: p._id,
      name: p.post_title,
      description: p.description,
      photos: p.photos ?? [],
      date_posted: p.date_posted ?? '',
    })),
    tappedPostId: '',
  };
}

/** Several users' profiles in one request, keyed by user id. */
export async function getOffererProfiles(userIds: string[]): Promise<Record<string, FeedProfile>> {
  if (userIds.length === 0) return {};
  const data = await apiJson<Record<string, any>>(`/dev/profiles?ids=${userIds.map(encodeURIComponent).join(',')}`);
  return Object.fromEntries(Object.entries(data).map(([id, profile]) => [id, toFeedProfile(profile)]));
}

export async function getOffererProfile(userId: string): Promise<FeedProfile> {
  return toFeedProfile(await apiJson(`/dev/users/${userId}`));
}
