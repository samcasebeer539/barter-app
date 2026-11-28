// Post cap, deck counts, and the meetup time card's first date.
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@/components/QueryAnswer', () => ({ __esModule: true, default: () => null }));
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('@/services/postService', () => ({ createPost: jest.fn(), updatePost: jest.fn(), deletePost: jest.fn() }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));

import DeckProfile from '@/components/DeckProfile';
import { getUpcomingDates } from '@/components/CardDateTime';
import { MAX_POSTS } from '@/config/limits';
import { pad2 } from '@/lib/format';
import { resetRecorders } from './helpers/deckRecorders';

beforeEach(() => resetRecorders());

test('counts are two digits: 09, 10, 99 (not 010)', () => {
  expect([0, 9, 10, 42, 99].map(pad2)).toEqual(['00', '09', '10', '42', '99']);
});

// ── your posts ───────────────────────────────────────────────────────────────

const me = {
  _id: 'me',
  first_name: 'Alice',
  locations: [{ id: 'l', name: 'Library', latitude: 1, longitude: 2 }],
} as any;
const posts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    _id: `p${i}`,
    name: `Item ${i}`,
    description: '',
    photos: [],
    date_posted: '',
  }));
const showProfile = (n: number) => render(<DeckProfile posts={posts(n)} primaryUser={me} />);

test('your post count reads 10 with ten posts', async () => {
  await showProfile(10);
  expect(screen.getByText('10')).toBeTruthy();
});

test(`ADD POST works below ${MAX_POSTS} posts and turns off at ${MAX_POSTS}`, async () => {
  await showProfile(MAX_POSTS - 1);
  expect(screen.getByTestId('add-post')).toBeEnabled();
  await screen.unmount();
  await showProfile(MAX_POSTS);
  expect(screen.getByTestId('add-post')).toBeDisabled();
  expect(screen.getByText('99')).toBeTruthy();
});

// ── meetup time card ─────────────────────────────────────────────────────────

test("the next two days can't be picked: the first date is three days out", () => {
  const dates = getUpcomingDates(20, new Date(2026, 10, 27, 17, 0)); // Fri Nov 27, 5 PM
  expect(dates).toHaveLength(20);
  expect(dates[0]).toMatchObject({ year: 2026, month: 10, day: 30 }); // Mon Nov 30
  expect(dates[0].label).toBe('Mon, Nov 30');
  expect(dates[1]).toMatchObject({ month: 11, day: 1 }); // then every day after
});

test('every time offered is at least two days away (the server requires it)', () => {
  const now = new Date(2026, 10, 27, 23, 59); // the latest moment of a day
  const first = getUpcomingDates(1, now)[0];
  const earliest = new Date(first.year, first.month, first.day, 7, 0); // 7:00 AM, the first time slot
  expect(earliest.getTime() - now.getTime()).toBeGreaterThanOrEqual(48 * 3600 * 1000);
});
