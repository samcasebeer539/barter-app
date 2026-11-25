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

// Uploads any local photos and returns a new array of all remote URLs.
async function resolvePhotos(photos: string[], postId: string): Promise<string[]> {
  const uid = getAuth().currentUser?.uid;
  return Promise.all(
    photos.map(async (uri, index) => {
      if (!isLocalUri(uri)) return uri; // already a remote URL, keep as-is
      // Upload a smaller JPEG copy (see lib/shrinkPhoto).
      const response = await fetch(await shrinkPhoto(uri));
      const blob = await response.blob();
      const storageRef = ref(storage, `post_photos/${uid}/${postId}/${index}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    })
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPost(post: Omit<Post, '_id'>): Promise<Post> {
  // Create the post first to get an _id, with photos as-is
  const created = await apiJson<PostRecord>('/dev/posts', { method: 'POST', body: toPayload(post) });

  // If there are local photos, upload them now that we have an _id
  const hasLocalPhotos = post.photos.some(isLocalUri);
  if (hasLocalPhotos) {
    const remotePhotos = await resolvePhotos(post.photos, created._id);
    await updatePost(created._id, { photos: remotePhotos });
    return toPost({ ...created, photos: remotePhotos });
  }

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