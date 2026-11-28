// components/DeckProfile.tsx: your profile deck, and the offerers' deck that
// slides out from behind it (people who offered on your posts). The card
// stacks, wheel and turn logs are stand-ins (helpers/deckRecorders).
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@/components/QueryAnswer', () => {
  const { Text: MockText } = require('react-native');
  return { __esModule: true, default: ({ questionTurn }: any) => <MockText>{`asked: ${questionTurn.item}`}</MockText> };
});
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('@/services/postService', () => ({ createPost: jest.fn(), updatePost: jest.fn(), deletePost: jest.fn() }));
jest.mock('@/services/tradeService', () => ({
  ...jest.requireActual('@/services/tradeService'),
  sendGameQuery: jest.fn(async () => ({})),
}));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));

import DeckProfile from '@/components/DeckProfile';
import { sendGameQuery } from '@/services/tradeService';
import {
  resetRecorders,
  wheel,
  deck,
  swipeTo,
  scrollWheelTo,
  press,
  confirm,
  typeQuestion,
  turnLogs,
} from './helpers/deckRecorders';

const post = (id: string, name: string) => ({ _id: id, name, description: '', photos: [], date_posted: '' });
const me = { _id: 'me', first_name: 'Alice', last_name: 'T', locations: [] } as any;
const myPosts = [post('lamp', 'Lamp'), post('vase', 'Vase')];
// Two people offered on my lamp: Bob (posts 0-1) and Cara (post 2).
const offerers = [
  {
    gameId: 'gBob',
    profile: { user: { _id: 'bob', first_name: 'Bob' }, posts: [post('chair', 'Chair'), post('desk', 'Desk')] },
  },
  { gameId: 'gCara', profile: { user: { _id: 'cara', first_name: 'Cara' }, posts: [post('rug', 'Rug')] } },
] as any;
const incomingOffers = [
  {
    gameId: 'gBob',
    targetPostId: 'lamp',
    fromUserId: 'bob',
    fromUserName: 'Bob',
    myQueries: [{ tradeId: 'q1', question: 'Any scratches?', answer: 'None' }],
  },
  { gameId: 'gCara', targetPostId: 'lamp', fromUserId: 'cara', fromUserName: 'Cara', myQueries: [] },
] as any;

beforeEach(() => resetRecorders());

async function open(props: Partial<React.ComponentProps<typeof DeckProfile>> = {}) {
  await render(
    <DeckProfile
      posts={myPosts}
      primaryUser={me}
      secondaryOfferers={offerers}
      incomingOffers={incomingOffers}
      isDeckRevealed
      hasIncomingOffers
      toggleEnabled
      {...props}
    />,
  );
}

test("the offerers' wheel has BARTER, QUERY and DECLINE", async () => {
  await open();
  expect(wheel().actions.map((a: any) => a.actionType)).toEqual(['barter', 'query', 'decline']);
  expect(deck('theirs').groups.map((g: any) => g.user.first_name)).toEqual(['Bob', 'Cara']);
});

test("on an offerer's post: barter and query can be used; on their user card: blocked", async () => {
  await open();
  await swipeTo(0, { deck: 'theirs', group: 0 });
  expect([wheel().queryBlocked, wheel().blockedActionTypes]).toEqual([false, []]);
  await swipeTo(null, { deck: 'theirs', group: 0 });
  expect([wheel().queryBlocked, wheel().blockedActionTypes]).toEqual([true, ['barter']]);
});

test("the offer's history shows under the wheel: your question, their answer, their offer", async () => {
  await open();
  await swipeTo(0, { deck: 'theirs', group: 0 });
  const log = turnLogs().find(t => t.turns?.length)!.turns;
  expect(log.map((t: any) => [t.type, t.item])).toEqual([
    ['turnQuery', 'Any scratches?'],
    ['turnAnswer', 'None'],
    ['turnOffer', 'Lamp'],
  ]);
});

// ── barter ───────────────────────────────────────────────────────────────────

test("barter: pick Bob's posts and it's sent for Bob's game", async () => {
  const onBarterSubmit = jest.fn();
  await open({ onBarterSubmit });
  await swipeTo(0, { deck: 'theirs', group: 0 });
  await press('barter');
  await swipeTo(1, { deck: 'theirs', group: 0 });
  await press('barter');
  expect(wheel()).toMatchObject({ selectedCount: 2, isReady: true, topCardIsSelected: true });
  await confirm('barter');
  expect(onBarterSubmit).toHaveBeenCalledWith('gBob', ['chair', 'desk']);
});

test("picking someone else's post starts over: one person's posts per barter", async () => {
  const onBarterSubmit = jest.fn();
  await open({ onBarterSubmit });
  await swipeTo(0, { deck: 'theirs', group: 0 });
  await press('barter');
  await swipeTo(2, { deck: 'theirs', group: 1 });
  await press('barter');
  expect(wheel().selectedCount).toBe(1);
  await confirm('barter');
  expect(onBarterSubmit).toHaveBeenCalledWith('gCara', ['rug']);
});

test("tapping cards directly works the same: one offerer's posts per barter", async () => {
  const { act } = require('@testing-library/react-native');
  const onBarterSubmit = jest.fn();
  await open({ onBarterSubmit });
  await act(async () => {
    deck('theirs').onSelectPost(0);
  }); // Bob's chair
  await act(async () => {
    deck('theirs').onSelectPost(1);
  }); // Bob's desk
  expect(wheel()).toMatchObject({ activeActionType: 'barter', selectedCount: 2 });
  await act(async () => {
    deck('theirs').onSelectPost(2);
  }); // Cara's rug: starts over
  expect(wheel().selectedCount).toBe(1);
  await act(async () => {
    deck('theirs').onSelectPost(2);
  }); // tap again: unpicked
  expect(wheel().selectedCount).toBe(0);
});

// ── query ────────────────────────────────────────────────────────────────────

test("query: asks the offerer about their post on top, in that offer's game", async () => {
  const onQueryAsked = jest.fn();
  await open({ onQueryAsked });
  await swipeTo(1, { deck: 'theirs', group: 0 });
  await scrollWheelTo('query');
  await press('query');
  expect(deck('theirs').querySelectedPostIndex).toBe(1);
  await typeQuestion('Is the desk solid wood?');
  await confirm('query');
  expect(sendGameQuery).toHaveBeenCalledWith('gBob', 'Is the desk solid wood?', 'desk');
  expect(onQueryAsked).toHaveBeenCalled();
});

test('a failed question says so and keeps the box open with what you typed', async () => {
  const { ApiError } = jest.requireActual('@/lib/apiError');
  (sendGameQuery as jest.Mock).mockRejectedValueOnce(new ApiError('That item has already been traded', 409));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await open();
  await swipeTo(0, { deck: 'theirs', group: 0 });
  await scrollWheelTo('query');
  await press('query');
  await typeQuestion('Still have it?');
  await confirm('query');
  expect(alert).toHaveBeenCalledWith("Your question didn't go through", 'That item has already been traded');
  expect(wheel()).toMatchObject({ activeActionType: 'query', isReady: true });
});

test("swiping to an offerer's user card closes an open question", async () => {
  await open();
  await swipeTo(0, { deck: 'theirs', group: 0 });
  await scrollWheelTo('query');
  await press('query');
  await swipeTo(null, { deck: 'theirs', group: 0 });
  expect(wheel().activeActionType).toBeNull();
});

// ── decline ──────────────────────────────────────────────────────────────────

test('decline: turns down the offer of whoever is on top', async () => {
  const onDeclineSubmit = jest.fn();
  await open({ onDeclineSubmit });
  await swipeTo(null, { deck: 'theirs', group: 1 }); // Cara's user card: decline still works
  await scrollWheelTo('decline');
  await press('decline');
  await confirm('decline');
  expect(onDeclineSubmit).toHaveBeenCalledWith('gCara');
});

// ── the QUERIES / OFFERS buttons ─────────────────────────────────────────────

test('QUERIES opens the questions people asked you, and closes again', async () => {
  const q = {
    tradeId: 't1',
    gameId: 'g9',
    targetPostId: 'lamp',
    fromUserId: 'dan',
    fromUserName: 'Dan',
    itemName: 'Lamp',
    question: 'Is it dimmable?',
  };
  await open({ incomingQueries: [q] });
  expect(screen.queryByText('asked: Is it dimmable?')).toBeNull();
  await fireEvent.press(screen.getByText('QUERIES'));
  expect(screen.getByText('asked: Is it dimmable?')).toBeTruthy();
  await fireEvent.press(screen.getByText('QUERIES'));
  expect(screen.queryByText('asked: Is it dimmable?')).toBeNull();
});

test('with no questions, QUERIES does nothing', async () => {
  await open({ incomingQueries: [] });
  await fireEvent.press(screen.getByText('QUERIES'));
  expect(screen.queryByText(/^asked:/)).toBeNull();
});

test('OFFERS shows counts as on-this-post / total', async () => {
  await open({ totalOfferCount: 5, totalQueryCount: 0, incomingQueries: [] });
  expect(screen.getByText(/^02\//)).toBeTruthy(); // 2 offerers on this post
  expect(screen.getByText('05')).toBeTruthy();
});

test("with no offers, the offerers' deck isn't shown", async () => {
  await open({ secondaryOfferers: [], isDeckRevealed: false });
  expect(() => deck('theirs')).toThrow();
});

// ── your own posts ───────────────────────────────────────────────────────────

test('a post that fails to save says why', async () => {
  const { act } = require('@testing-library/react-native');
  const { ApiError } = jest.requireActual('@/lib/apiError');
  const { updatePost } = require('@/services/postService');
  updatePost.mockRejectedValueOnce(new ApiError("This item is in an active trade and can't be edited", 409));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await open();
  await act(async () => {
    await deck('mine').onSavePost({ ...myPosts[0], name: 'Desk lamp' });
  });
  expect(alert).toHaveBeenCalledWith("Couldn't save your post", "This item is in an active trade and can't be edited");
});
