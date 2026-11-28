// Sign-in routing (app/_layout.tsx), the user service (services/userService.ts)
// and photo shrinking (lib/shrinkPhoto.ts).
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';

// ── sign-in routing ──────────────────────────────────────────────────────────

const mockNav: { segments: string[]; replace: jest.Mock; authListener?: (u: any) => void } =
  { segments: [], replace: jest.fn() };
jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Stack: () => <Text>app</Text>,
    useRouter: () => ({ replace: mockNav.replace }),
    useSegments: () => mockNav.segments,
  };
});
jest.mock('@/lib/firebase', () => ({ auth: {}, storage: {} }));
jest.mock('@/lib/session', () => ({ clearSessionCaches: jest.fn() }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: any) => void) => { mockNav.authListener = cb; return () => {}; },
  getAuth: () => ({ currentUser: { uid: 'alice' } }),
}));

import RootLayout from '@/app/_layout';
import { clearSessionCaches } from '@/lib/session';

async function signedIn(user: object | null, segments: string[]) {
  mockNav.segments = segments;
  mockNav.replace.mockClear();
  await render(<RootLayout />);
  await act(async () => { mockNav.authListener?.(user); });
}

test('a spinner until Firebase says whether you are signed in', async () => {
  mockNav.segments = [];
  await render(<RootLayout />);
  expect(screen.queryByText('app')).toBeNull();
  expect(mockNav.replace).not.toHaveBeenCalled();
});

test.each([
  ['signed out, anywhere in the app', null, ['(tabs)', 'feed'], '/login'],
  ['signed out, opening the app', null, [], '/login'],
  ['signed in, on the login screen', { uid: 'a' }, ['(auth)', 'login'], '/feed'],
  ['signed in, opening the app', { uid: 'a' }, [], '/feed'],
])('%s -> %s', async (_label, user, segments, target) => {
  await signedIn(user, segments);
  expect(mockNav.replace).toHaveBeenCalledWith(target);
});

test.each([
  ['signed in, already in the app', { uid: 'a' }, ['(tabs)', 'barter']],
  ['signed out, already on the login screen', null, ['(auth)', 'login']],
])('%s: stays put', async (_label, user, segments) => {
  await signedIn(user, segments);
  expect(mockNav.replace).not.toHaveBeenCalled();
  expect(screen.getByText('app')).toBeTruthy();
});

test("a different account (sign out, account deleted, someone else signs in) forgets the last one's cached data", async () => {
  (clearSessionCaches as jest.Mock).mockClear();
  mockNav.segments = ['(tabs)', 'feed'];
  await render(<RootLayout />);
  await act(async () => { mockNav.authListener?.({ uid: 'alice' }); });   // app opens signed in
  expect(clearSessionCaches).not.toHaveBeenCalled();
  await act(async () => { mockNav.authListener?.({ uid: 'alice' }); });   // same account (token refresh)
  expect(clearSessionCaches).not.toHaveBeenCalled();
  await act(async () => { mockNav.authListener?.(null); });               // signed out
  expect(clearSessionCaches).toHaveBeenCalledTimes(1);
  await act(async () => { mockNav.authListener?.({ uid: 'bob' }); });     // someone else
  expect(clearSessionCaches).toHaveBeenCalledTimes(2);
});

// ── user service ─────────────────────────────────────────────────────────────

const mockStorage: { refs: string[] } = { refs: [] };
jest.mock('firebase/storage', () => ({
  ref: (_s: unknown, path: string) => { mockStorage.refs.push(path); return { path }; },
  uploadBytes: jest.fn(async () => ({})),
  getDownloadURL: async (r: { path: string }) => `https://cdn.test/${r.path}`,
}));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(async () => ({})) }));
const mockShrink = { out: 'file:///small.jpg' };
jest.mock('@/lib/shrinkPhoto', () => ({
  ...jest.requireActual('@/lib/shrinkPhoto'),
  shrinkPhoto: jest.fn(async () => mockShrink.out),
}));

import { toUser, updateUser, uploadProfilePhoto } from '@/services/userService';
import { apiJson } from '@/lib/api';

test("server user -> app user (photo renamed, missing values defaulted)", () => {
  expect(toUser({ _id: 'u', first_name: 'Ana', last_name: 'R', profile_photo: 'https://x/p.jpg', rating: 4.5, reviewCount: 2 }))
    .toEqual({
      _id: 'u', first_name: 'Ana', last_name: 'R', email: undefined, phone: undefined, pronouns: undefined, bio: undefined,
      profileImageUrl: 'https://x/p.jpg', email_visible: false, phone_visible: false, locations: [], rating: 4.5, reviewCount: 2,
    });
  expect(toUser({ _id: 'u' })).toMatchObject({ rating: 0, reviewCount: 0, locations: [] });
});

test('saving your profile sends the photo under the name the server uses', async () => {
  await updateUser({ bio: 'Hi', profileImageUrl: 'https://x/p.jpg' } as any);
  expect(apiJson).toHaveBeenCalledWith('/dev/update_user', { method: 'PATCH', body: { bio: 'Hi', profile_photo: 'https://x/p.jpg' } });
  await updateUser({ bio: 'No photo change' } as any);
  expect((apiJson as jest.Mock).mock.calls.at(-1)[1].body).toEqual({ bio: 'No photo change' });
});

test.each([
  ['file:///small.jpg', 'profile_photos/alice.jpg'],
  ['file:///photo.PNG', 'profile_photos/alice.png'],
  ['file:///photo.heic?x=1', 'profile_photos/alice.heic'],
  ['file:///no-extension', 'profile_photos/alice.jpg'],
])('profile photo %s is stored at %s (the only path the storage rules allow)', async (shrunk, path) => {
  mockShrink.out = shrunk;
  mockStorage.refs.length = 0;
  (globalThis as any).fetch = jest.fn(async () => ({ blob: async () => 'blob' }));
  await expect(uploadProfilePhoto('file:///picked.jpg')).resolves.toBe(`https://cdn.test/${path}`);
  expect(mockStorage.refs).toEqual([path]);
});

// ── shrinking photos ─────────────────────────────────────────────────────────

const mockManip = { size: { width: 4000, height: 3000 }, fail: false, resized: [] as object[], released: 0 };
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      renderAsync: async () => {
        if (mockManip.fail) throw new Error('decode failed');
        const resized = mockManip.resized.at(-1) as any;
        const { width, height } = mockManip.size;
        const scaled = resized
          ? (resized.width ? { width: resized.width, height: Math.round(height * resized.width / width) }
                           : { width: Math.round(width * resized.height / height), height: resized.height })
          : { width, height };
        return { ...scaled, release: () => { mockManip.released++; },
                 saveAsync: async (opts: any) => ({ uri: `file:///out-${scaled.width}x${scaled.height}.jpg`, opts }) };
      },
      resize: (s: object) => { mockManip.resized.push(s); },
      release: () => { mockManip.released++; },
    }),
  },
}));

const { shrinkPhoto: realShrink } = jest.requireActual('@/lib/shrinkPhoto');

beforeEach(() => Object.assign(mockManip, { fail: false, resized: [], released: 0 }));

test('a big landscape photo is scaled so its longer side is 1080', async () => {
  mockManip.size = { width: 4000, height: 3000 };
  await expect(realShrink('file:///in.jpg')).resolves.toBe('file:///out-1080x810.jpg');
  expect(mockManip.resized).toEqual([{ width: 1080 }]);
});

test('a big portrait photo scales by its height', async () => {
  mockManip.size = { width: 3000, height: 4000 };
  await expect(realShrink('file:///in.jpg')).resolves.toBe('file:///out-810x1080.jpg');
  expect(mockManip.resized).toEqual([{ height: 1080 }]);
});

test('a small photo keeps its size (just recompressed as JPEG)', async () => {
  mockManip.size = { width: 800, height: 600 };
  await expect(realShrink('file:///in.jpg')).resolves.toBe('file:///out-800x600.jpg');
  expect(mockManip.resized).toEqual([]);
});

test("if shrinking fails, the original is used (an upload never breaks because of it)", async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockManip.fail = true;
  await expect(realShrink('file:///in.jpg')).resolves.toBe('file:///in.jpg');
  expect(mockManip.released).toBeGreaterThan(0);  // still cleaned up
});
