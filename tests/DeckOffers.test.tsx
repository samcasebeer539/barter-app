// components/DeckOffers.tsx: the open tab's MY QUERIES / MY OFFERS /
// DECLINED OFFERS decks. Each card shows its game's whole history.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));
jest.mock('@/services/tradeService', () => ({
  ...jest.requireActual('@/services/tradeService'),
  sendOffer: jest.fn(async () => ({})), sendQuery: jest.fn(async () => ({})), rescindOffer: jest.fn(async () => ({})),
}));

import DeckOffers from '@/components/DeckOffers';
import { Alert } from 'react-native';
import { TRADE_ACTIONS } from '@/config/tradeConfig';
import { sendOffer, sendQuery, rescindOffer } from '@/services/tradeService';
import { ApiError } from '@/lib/apiError';
import {
  resetRecorders, swipeTo, shownTurns, wheel, deck, press, confirm, scrollWheelTo, typeQuestion,
} from './helpers/deckRecorders';

const lamp = { _id: 'lamp', name: 'Lamp', description: '', photos: [], date_posted: '' };
const chair = { _id: 'chair', name: 'Chair', description: '', photos: [], date_posted: '' };

// Alice asked about Bob's lamp (he answered), offered on it, then Bob asked
// about her chair.
const history = [
  { type: 'query', actor_id: 'alice', target_post_id: 'lamp',
    messages: [{ message: 'Dimmable?', sender_id: 'alice' }, { message: 'Yes', sender_id: 'bob' }] },
  { type: 'offer', actor_id: 'alice', target_post_id: 'lamp' },
  { type: 'query', actor_id: 'bob', target_post_id: 'chair', messages: [{ message: 'Scratches?', sender_id: 'bob' }] },
];
const card = (extra: object = {}) => ({
  tradeId: 't1', gameId: 'g1', type: 'offer', post: lamp, actorId: 'alice', messages: [],
  rawTurns: history, myId: 'alice', partnerName: 'Bob', turnPosts: [lamp, chair], ...extra,
});

beforeEach(() => resetRecorders());

test.each(['offers', 'queries', 'declined'] as const)('%s: the whole history, newest first', async deckType => {
  await render(<DeckOffers posts={[card()] as any} deckType={deckType} expanded />);
  await swipeTo(0);
  expect(shownTurns().map(t => [t.type, t.user ?? 'you', t.item])).toEqual([
    ['turnQuery', 'Bob', 'Scratches? (Chair)'],   // their question about my chair
    ['turnOffer', 'you', 'Lamp'],
    ['turnQuery', 'you', 'Dimmable? (Lamp)'],
    ['turnAnswer', 'Bob', 'Yes'],              // answers sit under their question
  ]);
});

test('without a history from the server, MY OFFERS still shows the offer', async () => {
  await render(<DeckOffers posts={[card({ rawTurns: undefined })] as any} deckType="offers" expanded />);
  await swipeTo(0);
  expect(shownTurns()).toEqual([{ type: 'turnOffer', item: 'Lamp', isUser: true }]);
});


// ── the decks' own moves ─────────────────────────────────────────────────────

// What the barter page gives each deck.
const QUERIES_ACTIONS = TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType));
const OFFERS_ACTIONS = TRADE_ACTIONS.filter(a => ['query', 'rescind'].includes(a.actionType));
const two = [card(), card({ tradeId: 't2', gameId: 'g2', post: chair })];

describe('moves', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  test('MY QUERIES: offer on a post you asked about', async () => {
    const onActionComplete = jest.fn();
    await render(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded onActionComplete={onActionComplete} />);
    expect(wheel().actions.map((a: any) => a.actionType)).toEqual(['offer', 'query']);
    await swipeTo(1);
    await press('offer');
    expect(wheel()).toMatchObject({ topCardIsSelected: true, isReady: true });
    await confirm('offer');
    expect(sendOffer).toHaveBeenCalledWith('chair');
    expect(onActionComplete).toHaveBeenCalledWith('offer');
  });

  test('MY QUERIES: ask another question about the post on top', async () => {
    const onActionComplete = jest.fn();
    await render(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded onActionComplete={onActionComplete} />);
    await swipeTo(0);
    await scrollWheelTo('query');
    await press('query');
    expect(wheel().isReady).toBe(false);
    await typeQuestion('And the shade?');
    await confirm('query');
    expect(sendQuery).toHaveBeenCalledWith('lamp', 'And the shade?');
    expect(onActionComplete).toHaveBeenCalledWith('query');
  });

  test('a failed question says why and keeps the box open with your text', async () => {
    (sendQuery as jest.Mock).mockRejectedValueOnce(new ApiError("You can't message this user", 403));
    await render(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded />);
    await swipeTo(0);
    await scrollWheelTo('query');
    await press('query');
    await typeQuestion('Still there?');
    await confirm('query');
    expect(alert).toHaveBeenCalledWith("Your question didn't go through", "You can't message this user");
    expect(wheel()).toMatchObject({ activeActionType: 'query', isReady: true });
  });

  test('MY OFFERS: take an offer back', async () => {
    const onActionComplete = jest.fn();
    await render(<DeckOffers posts={two as any} deckType="offers" actions={OFFERS_ACTIONS} expanded onActionComplete={onActionComplete} />);
    await swipeTo(1);
    await scrollWheelTo('rescind');
    await press('rescind');
    await confirm('rescind');
    expect(rescindOffer).toHaveBeenCalledWith('chair');
    expect(onActionComplete).toHaveBeenCalledWith('rescind');
  });

  test("a failed take-back says why, and the screen isn't told it worked", async () => {
    (rescindOffer as jest.Mock).mockRejectedValueOnce(new ApiError('Offer not found', 404));
    const onActionComplete = jest.fn();
    await render(<DeckOffers posts={two as any} deckType="offers" actions={OFFERS_ACTIONS} expanded onActionComplete={onActionComplete} />);
    await swipeTo(0);
    await scrollWheelTo('rescind');
    await press('rescind');
    await confirm('rescind');
    expect(alert).toHaveBeenCalledWith("Couldn't take back your offer", 'This trade no longer exists. Refresh to see the latest.');
    expect(onActionComplete).not.toHaveBeenCalled();
  });

  test('closing the deck drops a half-made move', async () => {
    const { rerender } = await render(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded />);
    await swipeTo(0);
    await press('offer');
    await rerender(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded={false} />);
    await rerender(<DeckOffers posts={two as any} deckType="queries" actions={QUERIES_ACTIONS} expanded />);
    expect(wheel().activeActionType).toBeNull();
  });

  test('DECLINED OFFERS is read-only: no wheel', async () => {
    await render(<DeckOffers posts={two as any} deckType="declined" expanded />);
    expect(deck()).toBeTruthy();
    expect(() => wheel()).toThrow();
  });

  test("the count shows, and an empty deck can't be opened", async () => {
    const onToggleExpanded = jest.fn();
    const { rerender } = await render(
      <DeckOffers posts={two as any} deckType="offers" actions={OFFERS_ACTIONS} onToggleExpanded={onToggleExpanded} />);
    expect(screen.getByText('02')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('deck-toggle'));
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    await rerender(<DeckOffers posts={[]} deckType="offers" actions={OFFERS_ACTIONS} onToggleExpanded={onToggleExpanded} />);
    expect(screen.getByText('00')).toBeTruthy();
    expect(screen.getByTestId('deck-toggle')).toBeDisabled();
  });
});
