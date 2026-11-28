// components/DeckFeed.tsx: the deck that opens when you tap a feed post.
// The card stack, wheel and question box are stand-ins (helpers/
// deckRecorders); everything the deck decides, and what it sends to the
// server, is real.
import React from 'react';
import { Alert } from 'react-native';
import { render } from '@testing-library/react-native';
import { ApiError } from '@/lib/apiError';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@/services/feedService', () => ({ getFeedProfile: jest.fn() }));
jest.mock('@/services/tradeService', () => ({
  sendOffer: jest.fn(async () => ({})),
  sendQuery: jest.fn(async () => ({})),
  addPost: jest.fn(async () => ({})),
}));

import DeckFeed from '@/components/DeckFeed';
import { sendOffer, sendQuery, addPost } from '@/services/tradeService';
import {
  resetRecorders,
  wheel,
  deck,
  swipeTo,
  scrollWheelTo,
  press,
  confirm,
  typeQuestion,
  shownTurns,
} from './helpers/deckRecorders';

const bob = { _id: 'bob1', first_name: 'Bob', last_name: 'T', locations: [] } as any;
const post = (id: string, name: string) => ({ _id: id, name, description: '', photos: [], date_posted: '' });
const profile = { user: bob, posts: [post('lamp', 'Lamp'), post('chair', 'Chair')], tappedPostId: 'chair' } as any;

let alert: jest.SpyInstance;
beforeEach(() => {
  resetRecorders();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

async function open(props: Partial<React.ComponentProps<typeof DeckFeed>> = {}) {
  await render(<DeckFeed postId="chair" visible onClose={jest.fn()} prefetchedProfile={profile} {...props} />);
}

// ── what the wheel offers ────────────────────────────────────────────────────

test('the wheel has OFFER and QUERY', async () => {
  await open();
  expect(wheel().actions.map((a: any) => a.actionType)).toEqual(['offer', 'query']);
});

test('opens on the post that was tapped', async () => {
  await open();
  expect(deck().jumpToCardIndex).toBe(3); // user card, location card, then posts: Chair is the 2nd post
  expect(deck().groups[0].posts.map((p: any) => p.name)).toEqual(['Lamp', 'Chair']);
});

test('on a post: offer and query can be used', async () => {
  await open();
  await swipeTo(0);
  expect(wheel().queryBlocked).toBe(false);
  expect(wheel().blockedActionTypes).toEqual([]);
});

test('on the user or location card: offer and query are blocked', async () => {
  await open();
  await swipeTo(null);
  expect(wheel().queryBlocked).toBe(true);
  expect(wheel().blockedActionTypes).toEqual(['offer', 'add']);
});

// ── offer ────────────────────────────────────────────────────────────────────

test('offer: pick the post on top, confirm, and it is sent and shown', async () => {
  await open();
  await swipeTo(1);
  await press('offer');
  expect(wheel()).toMatchObject({ activeActionType: 'offer', topCardIsSelected: true, isReady: true });
  expect(deck().isSelectMode).toBe(true);

  await confirm('offer');
  expect(sendOffer).toHaveBeenCalledWith('chair');
  expect(shownTurns()).toEqual([{ type: 'turnOffer', item: 'Chair', isUser: true }]);
  expect(wheel().activeActionType).toBeNull(); // ready for the next move
});

test('offer is one post at a time: picking another replaces it', async () => {
  await open();
  await swipeTo(0);
  await press('offer');
  await swipeTo(1);
  await press('offer');
  expect(wheel().selectedCount).toBe(1);
  await confirm('offer');
  expect(sendOffer).toHaveBeenCalledWith('chair');
  expect(sendOffer).toHaveBeenCalledTimes(1);
});

test('a failed offer says why and is not shown as sent', async () => {
  (sendOffer as jest.Mock).mockRejectedValueOnce(new ApiError('That item has already been traded', 409));
  await open();
  await swipeTo(0);
  await press('offer');
  await confirm('offer');
  expect(alert).toHaveBeenCalledWith("Your offer didn't go through", 'That item has already been traded');
  expect(shownTurns()).toEqual([]);
});

test('a failed question says why and keeps the box open with your text', async () => {
  (sendQuery as jest.Mock).mockRejectedValueOnce(new ApiError('Network request failed', 0));
  await open();
  await swipeTo(0);
  await scrollWheelTo('query');
  await press('query');
  await typeQuestion('Does it work?');
  await confirm('query');
  expect(alert).toHaveBeenCalledWith("Your question didn't go through", 'Check your connection and try again.');
  expect(wheel()).toMatchObject({ activeActionType: 'query', isReady: true });
  expect(shownTurns()).toEqual([]);
});

// ── query ────────────────────────────────────────────────────────────────────

test('query: about the post on top, sendable once something is typed', async () => {
  const onQuerySubmit = jest.fn();
  await open({ onQuerySubmit });
  await swipeTo(0);
  await scrollWheelTo('query');
  await press('query');
  expect(wheel()).toMatchObject({ activeActionType: 'query', isQueryMode: true, isReady: false });
  expect(deck().querySelectedPostIndex).toBe(0);

  await typeQuestion('   ');
  expect(wheel().isReady).toBe(false);
  await typeQuestion('Does it work?');
  expect(wheel().isReady).toBe(true);

  await confirm('query');
  expect(sendQuery).toHaveBeenCalledWith('lamp', 'Does it work?');
  expect(onQuerySubmit).toHaveBeenCalledWith({ postIndex: 0, question: 'Does it work?' });
  expect(shownTurns()).toEqual([{ type: 'turnQuery', item: 'Does it work?', isUser: true }]);
});

test('the question follows the post on top as you swipe', async () => {
  await open();
  await swipeTo(0);
  await scrollWheelTo('query');
  await press('query');
  await swipeTo(1);
  expect(deck().querySelectedPostIndex).toBe(1);
  await typeQuestion('Size?');
  await confirm('query');
  expect(sendQuery).toHaveBeenCalledWith('chair', 'Size?');
});

test("swiping to the user card closes an open question (there's nothing to ask about)", async () => {
  await open();
  await swipeTo(0);
  await scrollWheelTo('query');
  await press('query');
  await swipeTo(null);
  expect(wheel().activeActionType).toBeNull();
});

test('tapping query on the user card does nothing', async () => {
  await open();
  await swipeTo(null);
  await scrollWheelTo('query');
  await press('query');
  expect(wheel().activeActionType).toBeNull();
});

// ── ADD mode (opened from a trade deck) ──────────────────────────────────────

test('add mode: only ADD, posts already in the trade left out, adds then closes', async () => {
  const onAdded = jest.fn();
  await open({ addGameId: 'g1', excludePostIds: ['lamp'], onAdded });
  expect(wheel().actions.map((a: any) => a.actionType)).toEqual(['add']);
  expect(deck().groups[0].posts.map((p: any) => p.name)).toEqual(['Chair']);

  await swipeTo(0);
  await press('add');
  await confirm('add');
  expect(addPost).toHaveBeenCalledWith('g1', 'chair');
  expect(onAdded).toHaveBeenCalled();
});

test('a failed add is reported back to the trade deck', async () => {
  const err = new Error('That item has already been traded');
  (addPost as jest.Mock).mockRejectedValueOnce(err);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const onAdded = jest.fn(),
    onAddFailed = jest.fn();
  await open({ addGameId: 'g1', onAdded, onAddFailed });
  await swipeTo(0);
  await press('add');
  await confirm('add');
  expect(onAddFailed).toHaveBeenCalledWith(err);
  expect(onAdded).not.toHaveBeenCalled();
});
