import { Post, PostRecord } from '@/types/index';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPost(record: PostRecord): Post {
  return {
    name: record.post_title,
    description: record.description,
    photos: record.photos ?? [],
    _id: record._id,
    date_posted: record.date_posted,
  };
}

function toPayload(post: Partial<Post>): Record<string, any> {
  const { name, _id, ...rest } = post as any;
  return {
    ...rest,
    ...(name !== undefined && { post_title: name }),
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserPosts(): Promise<Post[]> {
  const headers = await getAuthHeader();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE_URL}/dev/posts`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PostRecord[] = await res.json();
    return data.map(toPost);
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('getUserPosts error:', err.message);
    throw err;
  }
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
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `post_photos/${uid}/${postId}/${index}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    })
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPost(post: Omit<Post, '_id'>): Promise<Post> {
  const headers = await getAuthHeader();

  // Create the post first to get an _id, with photos as-is
  const res = await fetch(`${BASE_URL}/dev/posts`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(post)),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const created: PostRecord = await res.json();

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
  const headers = await getAuthHeader();

  // Upload any local photos before patching
  let resolvedFields = fields;
  if (fields.photos?.some(isLocalUri)) {
    const remotePhotos = await resolvePhotos(fields.photos, postId);
    resolvedFields = { ...fields, photos: remotePhotos };
  }

  const res = await fetch(`${BASE_URL}/dev/posts/${postId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(resolvedFields)),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<void> {
  const headers = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/dev/posts/${postId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}