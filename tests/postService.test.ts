// services/postService.ts: a new post's photos upload BEFORE the post is
// created, each upload gets its own file name, and a failed upload creates
// nothing.
const mockUploads: string[] = [];
let mockFailUploads = false;

jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: { uid: 'alice' } }) }));
jest.mock('@/lib/firebase', () => ({ storage: {} }));
jest.mock('@/lib/shrinkPhoto', () => ({ shrinkPhoto: async (uri: string) => uri + '#small' }));
jest.mock('firebase/storage', () => ({
  ref: (_s: unknown, path: string) => ({ path }),
  uploadBytes: async (r: { path: string }) => {
    if (mockFailUploads) throw new Error('storage/unauthorized');
    mockUploads.push(r.path);
  },
  getDownloadURL: async (r: { path: string }) => `https://cdn.test/${r.path}`,
}));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn() }));

import { apiJson } from '@/lib/api';
import { createPost, updatePost, toPost } from '@/services/postService';

const api = apiJson as jest.Mock;
beforeEach(() => {
  mockUploads.length = 0;
  mockFailUploads = false;
  (globalThis as any).fetch = jest.fn(async () => ({ blob: async () => 'blob' }));
  api.mockImplementation(async (_path: string, opts: any) => ({ ...opts?.body, date_posted: 'now' }));
});

const draft = (photos: string[]) => ({ name: 'Lamp', description: 'Bright', photos, date_posted: '' });

test('mockUploads first, then creates the post once with the final photo URLs and its id', async () => {
  const created = await createPost(draft(['file:///a.jpg', 'https://cdn.test/kept.jpg']));
  expect(api).toHaveBeenCalledTimes(1);
  const [path, { method, body }] = api.mock.calls[0];
  expect([path, method]).toEqual(['/dev/posts', 'POST']);
  expect(body._id).toMatch(/^[0-9a-f]{24}$/);
  expect(mockUploads).toHaveLength(1);
  expect(mockUploads[0]).toMatch(new RegExp(`^post_photos/alice/${body._id}/\\d+_0$`));
  expect(body.photos).toEqual([`https://cdn.test/${mockUploads[0]}`, 'https://cdn.test/kept.jpg']);
  expect(body.post_title).toBe('Lamp');
  expect(created.photos).toEqual(body.photos);
});

test('no photo on the phone ever reaches the server', async () => {
  await createPost(draft(['file:///a.jpg', 'content://b']));
  expect(api.mock.calls[0][1].body.photos.every((p: string) => p.startsWith('https://'))).toBe(true);
});

test('a failed upload creates nothing', async () => {
  mockFailUploads = true;
  await expect(createPost(draft(['file:///a.jpg']))).rejects.toThrow('storage/unauthorized');
  expect(api).not.toHaveBeenCalled();
});

test('each new post gets a different id', async () => {
  await createPost(draft([]));
  await createPost(draft([]));
  expect(api.mock.calls[0][1].body._id).not.toBe(api.mock.calls[1][1].body._id);
});

test("editing: a new photo can't overwrite one the post still uses", async () => {
  // Photo 0 was removed, so the remaining photo is now first and the new
  // one is second (index 1). Its file must not be the old ".../1".
  await updatePost('p1', { photos: ['https://cdn.test/post_photos/alice/p1/1', 'file:///new.jpg'] });
  expect(mockUploads).toHaveLength(1);
  expect(mockUploads[0]).not.toBe('post_photos/alice/p1/1');
  const body = api.mock.calls[0][1].body;
  expect(body.photos[0]).toBe('https://cdn.test/post_photos/alice/p1/1');
});

test('server post -> app post', () => {
  expect(toPost({ _id: 'p', post_title: 'Lamp', description: 'd', date_posted: 'x', in_trade: true } as any)).toEqual({
    _id: 'p',
    name: 'Lamp',
    description: 'd',
    photos: [],
    date_posted: 'x',
    inTrade: true,
  });
});
