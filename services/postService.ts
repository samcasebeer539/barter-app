import { Post, PostRecord } from '@/types/index';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { shrinkPhoto } from '@/lib/shrinkPhoto';

import { apiJson } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toPost(record: PostRecord): Post {
  return {
    name: record.post_title,
    description: record.description,
    photos: record.photos ?? [],
    _id: record._id,
    date_posted: record.date_posted,
    incoming_offers: record.incoming_offers ?? [],
    inTrade: record.in_trade ?? false,
  };
}

function toPayload(post: Partial<Post>): Record<string, any> {
  const { name, _id, inTrade, ...rest } = post as any;
  return {
    ...rest,
    ...(name !== undefined && { post_title: name }),
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserPosts(): Promise<Post[]> {
  const data = await apiJson<PostRecord[]>('/dev/posts');
  return data.map(toPost);
}

// ─── Photo Upload ─────────────────────────────────────────────────────────────

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

// A new Mongo-style id (8 hex chars of seconds + 16 random), made here so a
// new post's photos can be uploaded under its id before the post exists.
function newObjectId(): string {
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return Math.floor(Date.now() / 1000).toString(16).padStart(8, '0') + hex(16);
}

// Uploads any local photos and returns a new array of all remote URLs.
// Each upload gets its own file name, so a new photo never overwrites one
// that's still in the post (e.g. after removing an earlier photo).
async function resolvePhotos(photos: string[], postId: string): Promise<string[]> {
  const uid = getAuth().currentUser?.uid;
  const batch = Date.now();
  return Promise.all(
    photos.map(async (uri, index) => {
      if (!isLocalUri(uri)) return uri; // already a remote URL, keep as-is
      // Upload a smaller JPEG copy (see lib/shrinkPhoto).
      const response = await fetch(await shrinkPhoto(uri));
      const blob = await response.blob();
      const storageRef = ref(storage, `post_photos/${uid}/${postId}/${batch}_${index}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    })
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPost(post: Omit<Post, '_id'>): Promise<Post> {
  // Upload the photos first, under an id made here, then create the post
  // with them. If an upload fails, nothing is created, so saving again
  // just retries (no half-made post with broken photos).
  const postId = newObjectId();
  const photos = await resolvePhotos(post.photos, postId);
  const created = await apiJson<PostRecord>('/dev/posts', {
    method: 'POST',
    body: { ...toPayload({ ...post, photos }), _id: postId },
  });
  return toPost(created);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePost(postId: string, fields: Partial<Post>): Promise<void> {
  // Upload any local photos before patching
  let resolvedFields = fields;
  if (fields.photos?.some(isLocalUri)) {
    const remotePhotos = await resolvePhotos(fields.photos, postId);
    resolvedFields = { ...fields, photos: remotePhotos };
  }

  await apiJson(`/dev/posts/${postId}`, { method: 'PATCH', body: toPayload(resolvedFields) });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<void> {
  await apiJson(`/dev/posts/${postId}`, { method: 'DELETE' });
}