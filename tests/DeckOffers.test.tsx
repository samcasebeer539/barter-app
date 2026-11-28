// components/DeckOffers.tsx: the open tab's MY QUERIES / MY OFFERS /
// DECLINED OFFERS decks. Each card shows its game's whole history.
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));

import DeckOffers from '@/components/DeckOffers';
import { resetRecorders, swipeTo, shownTurns } from './helpers/deckRecorders';

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
