import { User } from '@/types/index';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { shrinkPhoto } from '@/lib/shrinkPhoto';

import { apiJson } from '@/lib/api';

/** Your user record from the server -> User. */
export function toUser(data: any): User {
  return {
    _id: data._id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    pronouns: data.pronouns,
    bio: data.bio,
    profileImageUrl: data.profile_photo,
    email_visible: data.email_visible ?? false,
    phone_visible: data.phone_visible ?? false,
    locations: data.locations ?? [],
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
  };
}

export async function getCurrentUser(): Promise<User> {
  return toUser(await apiJson('/dev/user_data'));
}

export async function updateUser(fields: Partial<User>): Promise<void> {
  // Map frontend field names → DB field names
  const { profileImageUrl, ...rest } = fields as any;
  const payload = {
    ...rest,
    ...(profileImageUrl !== undefined && { profile_photo: profileImageUrl }),
  };

  await apiJson('/dev/update_user', { method: 'PATCH', body: payload });
}

export async function uploadProfilePhoto(pickedUri: string): Promise<string> {
  // Upload a smaller JPEG copy (see lib/shrinkPhoto).
  const localUri = await shrinkPhoto(pickedUri);
  const response = await fetch(localUri);
  const blob = await response.blob();

  const uid = getAuth().currentUser?.uid;
  // Storage rules only allow profile_photos/<uid>.<extension>, so keep the
  // picked file's extension (jpg if it has none).
  const ext = localUri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() ?? 'jpg';
  const storageRef = ref(storage, `profile_photos/${uid}.${ext}`);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}
// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface UserReview {
  _id: string;
  rating: number;
  text: string;
  /** The reviewer's full name. */
  reviewerName: string;
  /** ISO timestamp (UTC). */
  createdAt: string | null;
}

/** Reviews other players left for this user, newest first. */
// Reviews already fetched this session, by user and review count. A new
// review changes the count, so it's fetched fresh; otherwise reopening a
// user's reviews (on any card, anywhere in the app) is instant.
const reviewsCache = new Map<string, UserReview[]>();

/** Forget cached reviews (signing out). */
export function clearReviewsCache() {
  reviewsCache.clear();
}
const reviewsKey = (userId: string, reviewCount: number) => `${userId}:${reviewCount}`;

/** This user's reviews if already fetched at this review count. */
export function getCachedReviews(userId: string, reviewCount: number): UserReview[] | undefined {
  return reviewsCache.get(reviewsKey(userId, reviewCount));
}

export async function getUserReviews(userId: string, reviewCount?: number): Promise<UserReview[]> {
  const reviews = await apiJson<UserReview[]>(`/dev/users/${userId}/reviews`);
  if (reviewCount != null) reviewsCache.set(reviewsKey(userId, reviewCount), reviews);
  return reviews;
}
