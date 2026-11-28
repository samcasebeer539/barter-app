// components/DeckTrade.tsx: one trade on the barter page (barter and close
// tabs). Who can move, which actions the wheel offers, and what each move
// sends. Card stacks, wheel and logs are stand-ins (helpers/deckRecorders).
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
const mockSeen: Record<string, any> = {};
jest.mock('@/components/QueryAnswer', () => ({ __esModule: true, default: (p: any) => { mockSeen.answer = p; return null; } }));
jest.mock('@/components/StarPicker', () => ({ __esModule: true, default: (p: any) => { mockSeen.stars = p; return null; } }));
jest.mock('@/components/DeckFeed', () => ({ __esModule: true, default: (p: any) => { mockSeen.feedDeck = p; return null; } }));
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));
jest.mock('@/services/feedService', () => ({ getFeedProfile: jest.fn(async () => ({ user: {}, posts: [] })) }));
jest.mock('@/services/tradeService', () => {
  const ok = () => jest.fn(async () => ({}));
  return {
    ...jest.requireActual('@/services/tradeService'),
    acceptTrade: ok(), declineTrade: ok(), stallTrade: ok(), sendGameQuery: ok(),
    proposeLocation: ok(), proposeTime: ok(), subtractPost: ok(), submitReview: ok(),
  };
});

import DeckTrade from '@/components/DeckTrade';
import { BARTER_TAB_ACTIONS, CLOSE_TAB_ACTIONS } from '@/config/tradeConfig';
import { getFeedProfile } from '@/services/feedService';
import * as trade from '@/services/tradeService';
import {
  resetRecorders, wheel, deck, swipeTo, scrollWheelTo, press, confirm, typeQuestion,
} from './helpers/deckRecorders';

// What the barter page passes for the barter and close tabs.
const BARTER_ACTIONS = BARTER_TAB_ACTIONS;
const CLOSE_ACTIONS = CLOSE_TAB_ACTIONS;

const post = (id: string, name: string) => ({ _id: id, name, description: '', photos: [], date_posted: '' });
const me = { _id: 'me', first_name: 'Alice', locations: [{ id: 'loc1', name: 'Library', latitude: 1, longitude: 2 }] } as any;
const bob = { _id: 'bob', first_name: 'Bob', last_name: 'T' } as any;

const types = () => wheel().actions.map((a: any) => a.actionType);

beforeEach(() => { resetRecorders(); Object.keys(mockSeen).forEach(k => delete mockSeen[k]); });

async function open(props: Partial<React.ComponentProps<typeof DeckTrade>> = {}) {
  const handlers = { onActionComplete: jest.fn(), onActionFailed: jest.fn(), onTurnExpired: jest.fn() };
  await render(
    <DeckTrade gameId="g1" expanded partnerUser={bob} partnerPosts={[post('chair', 'Chair'), post('desk', 'Desk')]}
      playerUser={me} playerPosts={[post('lamp', 'Lamp'), post('vase', 'Vase')]}
      actions={BARTER_ACTIONS} turns={[]} rawTurns={[]} phase="barter" isMyTurn {...handlers} {...props} />,
  );
  return handlers;
}

// ── whose move ───────────────────────────────────────────────────────────────

test('your turn in barter: *ACCEPT, ADD, REMOVE, QUERY, STALL, DECLINE (in that order, no WAIT)', async () => {
  await open();
  expect(types()).toEqual(['accept', 'add', 'subtract', 'query', 'stall', 'decline']);
});

test('your turn in close: ACCEPT, WHERE, WHEN, QUERY, DECLINE (in that order)', async () => {
  const rawTurns = [
    { type: 'where', actor_id: 'bob', location: { id: 'x', name: 'Park' } },
    { type: 'when', actor_id: 'me', proposed_time: 'Mon at 3' },
  ];
  await open({ actions: CLOSE_ACTIONS, phase: 'close', rawTurns });
  expect(types()).toEqual(['acceptFinal', 'where', 'when', 'query', 'decline']);
});

test("their turn: the wheel is only WAIT, and nothing can be armed", async () => {
  await open({ isMyTurn: false });
  expect(types()).toEqual(['wait']);
  await press('stall');
  expect(wheel().activeActionType).toBeNull();
});

test('a question waiting for your answer: WAIT until you answer it', async () => {
  const turns = [{ type: 'turnQuery', user: 'Bob', item: 'Still have it?', isUser: false }] as any;
  await open({ pendingQuery: { tradeId: 'q1', message: 'Still have it?' }, turns });
  expect(types()).toEqual(['wait']);
  expect(mockSeen.answer).toMatchObject({ queryId: 'q1', placeholder: 'Answer to begin your turn' });
});

test('REMOVE (subtract) only when you would still have an item left', async () => {
  await open({ playerPosts: [post('lamp', 'Lamp')] });
  expect(types()).not.toContain('subtract');
});

test('close tab: ACCEPT (the meetup) only once there is a place and a time', async () => {
  await open({ actions: CLOSE_ACTIONS, phase: 'close' });
  expect(types()).not.toContain('acceptFinal');
  resetRecorders();
  const rawTurns = [
    { type: 'where', actor_id: 'bob', location: { id: 'x', name: 'Park' } },
    { type: 'when', actor_id: 'me', proposed_time: 'Mon at 3' },
  ];
  await open({ actions: CLOSE_ACTIONS, phase: 'close', rawTurns });
  expect(types()).toContain('acceptFinal');
});

test('agreed deal: only REVIEW (no clock); after reviewing, WAIT', async () => {
  await open({ phase: 'agreed' });
  expect(types()).toEqual(['review']);
  expect(wheel().noTurnClock).toBe(true);
  resetRecorders();
  await open({ phase: 'agreed', rawTurns: [{ type: 'review', actor_id: 'me', rating: 5 }] });
  expect(types()).toEqual(['wait']);
});

test('finished trades are read-only: no wheel', async () => {
  for (const phase of ['completed', 'declined']) {
    resetRecorders();
    await open({ phase });
    expect(() => wheel()).toThrow();
  }
});

// ── one-tap moves ────────────────────────────────────────────────────────────

test.each([
  ['stall', 'stallTrade'],
  ['accept', 'acceptTrade'],
  ['decline', 'declineTrade'],
] as const)('%s: sent for this game, then the screen refreshes', async (action, call) => {
  const h = await open();
  await scrollWheelTo(action);
  await press(action);
  await confirm(action);
  expect((trade as any)[call]).toHaveBeenCalledWith('g1');
  expect(h.onActionComplete).toHaveBeenCalledWith(action);
});

test('a refused move is reported so the screen reloads the real state', async () => {
  const err = new Error("It's not your turn");
  (trade.stallTrade as jest.Mock).mockRejectedValueOnce(err);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const h = await open();
  await scrollWheelTo('stall');
  await press('stall');
  await confirm('stall');
  expect(h.onActionFailed).toHaveBeenCalledWith('stall', err);
  expect(h.onActionComplete).not.toHaveBeenCalled();
});

// ── query ────────────────────────────────────────────────────────────────────

test("query: needs text; tags their post on top if there is one", async () => {
  const h = await open();
  await swipeTo(1, { deck: 'theirs' });
  await scrollWheelTo('query');
  await press('query');
  expect(wheel().isReady).toBe(false);
  await typeQuestion('Is the desk solid wood?');
  expect(wheel().isReady).toBe(true);
  expect(deck('theirs').querySelectedPostIndex).toBe(1);
  await confirm('query');
  expect(trade.sendGameQuery).toHaveBeenCalledWith('g1', 'Is the desk solid wood?', 'desk');
  expect(h.onActionComplete).toHaveBeenCalledWith('query');
});

test('query with their user card on top: still allowed, just not about a post', async () => {
  await open();
  await swipeTo(null, { deck: 'theirs' });
  expect(wheel().queryBlocked).toBeFalsy();
  await scrollWheelTo('query');
  await press('query');
  await typeQuestion('When are you free?');
  await confirm('query');
  expect(trade.sendGameQuery).toHaveBeenCalledWith('g1', 'When are you free?', undefined);
});

// ── subtract / add ───────────────────────────────────────────────────────────

test('subtract: takes your post on top out of the trade', async () => {
  await open();
  await swipeTo(1, { deck: 'mine' });
  await scrollWheelTo('subtract');
  await press('subtract');
  expect(wheel()).toMatchObject({ topCardIsSelected: true, isReady: true });
  expect(deck('mine').isSelectMode).toBe(true);
  await confirm('subtract');
  expect(trade.subtractPost).toHaveBeenCalledWith('g1', 'vase');
});

test('subtract is blocked while your own user / location card is on top', async () => {
  await open();
  await swipeTo(null, { deck: 'mine' });
  expect(wheel().blockedActionTypes).toEqual(['subtract']);
});

test("add: opens Bob's posts (minus ones already in the trade); the button stays filled", async () => {
  await open();
  await scrollWheelTo('add');
  await press('add');
  expect(getFeedProfile).toHaveBeenCalledWith('chair');
  expect(mockSeen.feedDeck).toMatchObject({ visible: true, addGameId: 'g1', excludePostIds: ['chair', 'desk'] });
  expect(wheel().filledActionType).toBe('add');
});

// ── close tab: where / when ──────────────────────────────────────────────────

test('where: shows your saved locations; picking one and confirming proposes it', async () => {
  const h = await open({ actions: CLOSE_ACTIONS, phase: 'close', showLocation: true, showDateTime: true });
  await scrollWheelTo('where');
  await press('where');
  expect(deck('mine').isLocationSelectMode).toBe(true);
  expect(wheel().isReady).toBe(false);
  const { act } = require('@testing-library/react-native');
  await act(async () => { deck('mine').onProposeLocation(me.locations[0]); });
  expect(wheel().isReady).toBe(true);
  await confirm('where');
  expect(trade.proposeLocation).toHaveBeenCalledWith('g1', 'loc1');
  expect(h.onActionComplete).toHaveBeenCalledWith('where');
});

test('when: picking a time and confirming proposes it', async () => {
  await open({ actions: CLOSE_ACTIONS, phase: 'close', showLocation: true, showDateTime: true });
  await scrollWheelTo('when');
  await press('when');
  expect(deck('mine').isTimeSelectMode).toBe(true);
  const { act } = require('@testing-library/react-native');
  await act(async () => { deck('mine').onProposeTime({ proposedAt: '2026-12-01T23:00:00Z', label: 'Mon at 3' }); });
  await confirm('when');
  expect(trade.proposeTime).toHaveBeenCalledWith('g1', '2026-12-01T23:00:00Z', 'Mon at 3');
});

// ── review ───────────────────────────────────────────────────────────────────

test('review: stars are required, the text is optional', async () => {
  await open({ phase: 'agreed' });
  await press('review');
  expect(wheel().isReady).toBe(false);
  const { act } = require('@testing-library/react-native');
  await act(async () => { mockSeen.stars.onChange(4); });
  expect(wheel().isReady).toBe(true);
  await typeQuestion('Smooth trade');
  await confirm('review');
  expect(trade.submitReview).toHaveBeenCalledWith('g1', 4, 'Smooth trade');
});

// ── turn timer ───────────────────────────────────────────────────────────────

test('when the turn runs out, the screen is told to reload (after a short grace)', async () => {
  jest.useFakeTimers({ now: new Date('2026-11-27T12:00:00Z') });
  const h = await open({ turnDeadline: '2026-11-27T12:00:10Z' });
  const { act } = require('@testing-library/react-native');
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(h.onTurnExpired).not.toHaveBeenCalled();       // grace period
  await act(async () => { jest.advanceTimersByTime(3_000); });
  expect(h.onTurnExpired).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(h.onTurnExpired).toHaveBeenCalledTimes(1);     // only once
  jest.useRealTimers();
});
