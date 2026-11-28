// app/(tabs)/profile.tsx: the profile screen. The first load, the quiet
// refresh when you come back to it, and what happens after you save, barter
// or decline (including failures).
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';

const mockSeen: { deck?: any; focus?: () => void; onBlock?: () => void } = {};
jest.mock('@/components/DeckProfile', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSeen.deck = p;
    return null;
  },
}));
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  const Image = (p: any) => <View {...p} />;
  Image.prefetch = async () => true;
  return { Image };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
  };
});
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn() }),
    // Runs on mount; mockSeen.focus() runs it again (coming back to the tab).
    useFocusEffect: (cb: () => void) => {
      mockSeen.focus = cb;
      React.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});
jest.mock('@/lib/safety', () => ({
  onBlockChange: (fn: () => void) => {
    mockSeen.onBlock = fn;
    return () => {};
  },
}));
jest.mock('@/lib/settingsCache', () => ({ setSettingsCache: jest.fn() }));
jest.mock('@/services/profileService', () => ({ getProfilePage: jest.fn() }));
jest.mock('@/services/userService', () => ({ updateUser: jest.fn(async () => {}) }));
jest.mock('@/services/locationService', () => ({
  saveMyLocations: jest.fn(async () => {}),
  getUserLocations: jest.fn(),
}));
jest.mock('@/services/offererService', () => ({ getOffererProfiles: jest.fn(async () => ({})) }));
jest.mock('@/services/tradeService', () => ({
  getIncomingOffers: jest.fn(async () => []),
  getIncomingQueries: jest.fn(async () => []),
  sendBarter: jest.fn(async () => ({})),
  declineTrade: jest.fn(async () => ({})),
}));

import ProfileScreen from '@/app/(tabs)/profile';
import { getProfilePage } from '@/services/profileService';
import { updateUser } from '@/services/userService';
import { saveMyLocations } from '@/services/locationService';
import { sendBarter, declineTrade } from '@/services/tradeService';
import { setSettingsCache } from '@/lib/settingsCache';
import { ApiError } from '@/lib/apiError';

const page = getProfilePage as jest.Mock;
const post = (id: string, extra: object = {}) => ({
  _id: id,
  name: id,
  description: '',
  photos: [],
  date_posted: '',
  ...extra,
});
const me = { _id: 'me', first_name: 'Alice', last_name: 'T', rating: 4, reviewCount: 2 } as any;
const offerer = (id: string) => ({ user: { _id: id, first_name: id }, posts: [post(`${id}-item`)] });
const fullPage = (extra: object = {}) => ({
  user: me,
  posts: [post('lamp'), post('vase')],
  locations: [{ id: 'l1', name: 'Library' }],
  incomingOffers: [
    { gameId: 'gBob', targetPostId: 'lamp', fromUserId: 'bob', fromUserName: 'bob', myQueries: [] },
    { gameId: 'gCara', targetPostId: 'lamp', fromUserId: 'cara', fromUserName: 'cara', myQueries: [] },
    { gameId: 'gDan', targetPostId: 'vase', fromUserId: 'dan', fromUserName: 'dan', myQueries: [] },
  ],
  incomingQueries: [],
  offererProfiles: { bob: offerer('bob'), cara: offerer('cara'), dan: offerer('dan') },
  settings: { locationAllowed: true, notificationsEnabled: true },
  version: 'v1',
  ...extra,
});

const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0));
  });
let alert: jest.SpyInstance;
beforeEach(() => {
  mockSeen.deck = undefined;
  page.mockReset().mockResolvedValue(fullPage());
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

async function open() {
  await render(<ProfileScreen />);
  await flush();
}
const topPostIs = (index: number) =>
  act(async () => {
    mockSeen.deck.onTopPrimaryPostChange(index);
  });

// ── loading ──────────────────────────────────────────────────────────────────

test('loads everything in one request and hands it to the deck', async () => {
  await open();
  expect(page).toHaveBeenCalledTimes(1); // not again for the first focus
  expect(mockSeen.deck).toMatchObject({ primaryUser: me, initialLocations: [{ id: 'l1', name: 'Library' }] });
  expect(mockSeen.deck.posts.map((p: any) => p._id)).toEqual(['lamp', 'vase']);
  expect(setSettingsCache).toHaveBeenCalledWith({ locationAllowed: true, notificationsEnabled: true });
});

test('if the profile fails to load, says so', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  page.mockRejectedValue(new Error('offline'));
  await open();
  expect(screen.getByText('Error: offline')).toBeTruthy();
  expect(mockSeen.deck).toBeUndefined();
});

test("the offerers' deck shows only offers on the post on top", async () => {
  await open();
  await topPostIs(0);
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gBob', 'gCara']);
  await topPostIs(1);
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gDan']);
});

// ── coming back to the profile ───────────────────────────────────────────────

test('coming back: asks only for changes since the version it has', async () => {
  await open();
  page.mockResolvedValue(null); // nothing changed
  await act(async () => {
    mockSeen.focus?.();
  });
  await flush();
  expect(page).toHaveBeenLastCalledWith('v1');
  expect(mockSeen.deck.posts.map((p: any) => p._id)).toEqual(['lamp', 'vase']);
});

test('coming back: picks up locks, your new rating and new offers, but keeps your unsaved post', async () => {
  await open();
  const draft = { name: '', description: '', photos: [], date_posted: '' };
  await act(async () => {
    mockSeen.deck.onPostsChange([draft, ...mockSeen.deck.posts]);
  });
  page.mockResolvedValue(
    fullPage({
      version: 'v2',
      user: { ...me, rating: 5, reviewCount: 3 },
      posts: [post('lamp', { inTrade: true }), post('vase')],
      incomingOffers: [{ gameId: 'gEve', targetPostId: 'lamp', fromUserId: 'eve', fromUserName: 'eve', myQueries: [] }],
      offererProfiles: { eve: offerer('eve') },
    }),
  );
  await act(async () => {
    mockSeen.focus?.();
  });
  await flush();
  const posts = mockSeen.deck.posts;
  expect(posts.map((p: any) => p._id ?? 'draft')).toEqual(['draft', 'lamp', 'vase']);
  expect(posts[1].inTrade).toBe(true);
  expect([mockSeen.deck.primaryUser.rating, mockSeen.deck.primaryUser.reviewCount]).toEqual([5, 3]);
  await topPostIs(1); // the lamp (the draft is first)
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gEve']);
  expect(mockSeen.deck.totalOfferCount).toBe(1);
});

test('blocking someone reloads the profile (their offers are gone)', async () => {
  await open();
  expect(mockSeen.deck.totalOfferCount).toBe(3);
  page.mockResolvedValue(fullPage({ version: 'v2', incomingOffers: [] }));
  await act(async () => {
    mockSeen.onBlock?.();
  });
  await flush();
  expect(page).toHaveBeenLastCalledWith('v1');
  expect(mockSeen.deck.totalOfferCount).toBe(0);
});

// ── barter / decline ─────────────────────────────────────────────────────────

test('barter: sent, then that offerer leaves the deck (it stays open for the others)', async () => {
  await open();
  await topPostIs(0);
  await act(async () => {
    mockSeen.deck.onToggleReveal?.();
  });
  await act(async () => {
    await mockSeen.deck.onBarterSubmit('gBob', ['bob-item']);
  });
  expect(sendBarter).toHaveBeenCalledWith('gBob', ['bob-item']);
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gCara']);
});

test("declining the last offer on a post closes the offerers' deck", async () => {
  await open();
  await topPostIs(1);
  await act(async () => {
    mockSeen.deck.onToggleReveal?.();
  });
  expect(mockSeen.deck.isDeckRevealed).toBe(true);
  await act(async () => {
    await mockSeen.deck.onDeclineSubmit('gDan');
  });
  expect(declineTrade).toHaveBeenCalledWith('gDan');
  expect(mockSeen.deck.secondaryOfferers).toEqual([]);
  expect(mockSeen.deck.isDeckRevealed).toBe(false);
});

test('a failed barter says why and keeps the offer', async () => {
  (sendBarter as jest.Mock).mockRejectedValueOnce(new ApiError('One of those items has already been traded', 409));
  await open();
  await topPostIs(0);
  await act(async () => {
    await mockSeen.deck.onBarterSubmit('gBob', ['bob-item']);
  });
  expect(alert).toHaveBeenCalledWith("That barter didn't go through", 'One of those items has already been traded');
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gBob', 'gCara']);
});

test('a failed decline says why and keeps the offer', async () => {
  (declineTrade as jest.Mock).mockRejectedValueOnce(new ApiError('Network request failed', 0));
  await open();
  await topPostIs(1);
  await act(async () => {
    await mockSeen.deck.onDeclineSubmit('gDan');
  });
  expect(alert).toHaveBeenCalledWith("Couldn't decline the offer", 'Check your connection and try again.');
  expect(mockSeen.deck.secondaryOfferers.map((o: any) => o.gameId)).toEqual(['gDan']);
});

// ── saving ───────────────────────────────────────────────────────────────────

test('saving your profile: kept on success; on failure says why and keeps the old one', async () => {
  await open();
  await act(async () => {
    await mockSeen.deck.onSaveUser({ ...me, bio: 'Hi' });
  });
  expect(updateUser).toHaveBeenCalledWith({ ...me, bio: 'Hi' });
  expect(mockSeen.deck.primaryUser.bio).toBe('Hi');

  (updateUser as jest.Mock).mockRejectedValueOnce(new ApiError('Bio is too long (max 300 characters)', 400));
  await act(async () => {
    await mockSeen.deck.onSaveUser({ ...me, bio: 'x'.repeat(301) });
  });
  expect(alert).toHaveBeenCalledWith("Couldn't save your profile", 'Bio is too long (max 300 characters)');
  expect(mockSeen.deck.primaryUser.bio).toBe('Hi');
});

test('saving locations shows them at once; a failure puts the old ones back', async () => {
  await open();
  let reject!: (e: unknown) => void;
  (saveMyLocations as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((_, r) => {
        reject = r;
      }),
  );
  const four = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  await act(async () => {
    mockSeen.deck.onConfirmLocations(four);
  });
  expect(mockSeen.deck.initialLocations).toEqual(four); // shown right away
  await act(async () => {
    reject(new ApiError('Maximum 3 locations allowed', 400));
  });
  await flush();
  expect(alert).toHaveBeenCalledWith("Couldn't save your locations", 'Maximum 3 locations allowed');
  expect(mockSeen.deck.initialLocations).toEqual([{ id: 'l1', name: 'Library' }]);
});
