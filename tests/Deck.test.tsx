// components/Deck.tsx: the card stack's logic. The order of the cards, which
// card is on top (and what the deck reports to its screen), jumping to a
// card, wrapping round the end, and swiping. Swipes are fed to the deck's
// gesture handler as a recorded drag; the cards are simple stand-ins.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/components/CardUser', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ user }: any) => <Text>{`user:${user.first_name}`}</Text> };
});
jest.mock('@/components/CardItem', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ post, onSelect }: any) => <Text onPress={onSelect}>{`post:${post.name}`}</Text>,
  };
});
jest.mock('@/components/CardMeetingLocation', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ initialLocations, externalLocations }: any) => (
      <Text>{`location:${(initialLocations ?? externalLocations ?? []).length}`}</Text>
    ),
  };
});
jest.mock('@/components/CardDateTime', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>datetime</Text> };
});
jest.mock('@/components/CardBlank', () => ({ __esModule: true, default: () => null }));

import Deck from '@/components/Deck';

const post = (name: string) => ({ _id: name, name, description: '', photos: [], date_posted: '' });
const bob = { _id: 'bob', first_name: 'Bob' } as any;
const cara = { _id: 'cara', first_name: 'Cara' } as any;
const shown = () =>
  screen
    .queryAllByText(/^(user|post|location|datetime)/)
    .map(n => n.props.children)
    .sort();

type Callbacks = { onTopCardChange: jest.Mock; onTopCardTypeChange: jest.Mock; onTopCardGroupChange: jest.Mock };
function setup(props: Partial<React.ComponentProps<typeof Deck>> = {}, keep?: Callbacks) {
  const cb = keep ?? { onTopCardChange: jest.fn(), onTopCardTypeChange: jest.fn(), onTopCardGroupChange: jest.fn() };
  const groups = props.groups ?? [{ user: bob, posts: [post('Lamp'), post('Chair')], locations: [{ id: 'l' } as any] }];
  return { cb, el: <Deck cardWidth={300} {...cb} {...props} groups={groups} /> };
}
const lastTop = (cb: any) => [cb.onTopCardChange.mock.calls.at(-1)[0], cb.onTopCardTypeChange.mock.calls.at(-1)[0]];

// A horizontal drag of dx points across the deck, then let go.
async function swipe(dx: number) {
  const deck = screen.getByTestId('deck');
  const at = (x: number, t: number) => ({
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: t,
      touchBank: [
        {
          touchActive: true,
          startPageX: 0,
          startPageY: 0,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: 0,
          currentTimeStamp: t,
          previousPageX: 0,
          previousPageY: 0,
          previousTimeStamp: 0,
        },
      ],
    },
    nativeEvent: { touches: [{}], changedTouches: [{}], pageX: x, pageY: 0, timestamp: t },
  });
  await act(async () => {
    deck.props.onResponderGrant(at(0, 1));
    deck.props.onResponderMove(at(dx, 2));
    deck.props.onResponderRelease(at(dx, 3));
    jest.advanceTimersByTime(400); // the fly-off animation
  });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// ── order and what's on top ──────────────────────────────────────────────────

test('order: user card, then location, then posts; the user card starts on top', async () => {
  const { cb, el } = setup();
  await render(el);
  expect(shown()).toEqual(['location:1', 'post:Lamp', 'user:Bob']); // the three visible slots
  expect(lastTop(cb)).toEqual([null, 'user']); // not a post: null
  expect(cb.onTopCardGroupChange).toHaveBeenLastCalledWith(0);
});

test('a date card comes between the user and location cards when shown', async () => {
  const { cb, el } = setup({ showDateTime: true, jumpToken: 1, jumpToCardIndex: 1 });
  await render(el);
  expect(lastTop(cb)).toEqual([null, 'datetime']);
});

test('no location card when it is turned off (e.g. blocked users in settings)', async () => {
  const { cb, el } = setup({ showLocation: false, jumpToken: 1, jumpToCardIndex: 1 });
  await render(el);
  expect(lastTop(cb)).toEqual([0, 'post']);
});

// ── jumping ──────────────────────────────────────────────────────────────────

test('jumping to a card puts it on top and reports its post number', async () => {
  const { cb, el } = setup({ jumpToken: 1, jumpToCardIndex: 3 }); // user, location, Lamp, *Chair*
  await render(el);
  expect(lastTop(cb)).toEqual([1, 'post']);
});

test('jumps past the end wrap round to the start', async () => {
  const { cb, el } = setup({ jumpToken: 1, jumpToCardIndex: 5 }); // 4 cards: 5 -> 1 (location)
  await render(el);
  expect(lastTop(cb)).toEqual([null, 'location']);
});

test('the same jump token only jumps once (later renders leave the deck where you swiped it)', async () => {
  const { cb, el } = setup({ jumpToken: 1, jumpToCardIndex: 2 });
  const { rerender } = await render(el);
  await swipe(-120);
  expect(lastTop(cb)).toEqual([1, 'post']);
  await rerender(setup({ jumpToken: 1, jumpToCardIndex: 2 }, cb).el);
  expect(lastTop(cb)[0]).not.toBe(0);
});

// ── swiping ──────────────────────────────────────────────────────────────────

test('swiping either way brings the next card up, round and round', async () => {
  const { cb, el } = setup();
  await render(el);
  const tops: unknown[] = [];
  for (const dx of [-120, 120, -120, 120]) {
    await swipe(dx);
    tops.push(lastTop(cb));
  }
  expect(tops).toEqual([
    [null, 'location'],
    [0, 'post'],
    [1, 'post'],
    [null, 'user'],
  ]);
});

test('a small drag springs back (no card change)', async () => {
  const { cb, el } = setup();
  await render(el);
  const calls = cb.onTopCardTypeChange.mock.calls.length;
  await swipe(5);
  expect(cb.onTopCardTypeChange.mock.calls.length).toBe(calls);
});

test('a disabled deck ignores swipes', async () => {
  const { cb, el } = setup({ enabled: false });
  await render(el);
  expect(screen.getByTestId('deck').props.onResponderRelease).toBeUndefined(); // no swipe handling at all
  expect(lastTop(cb)).toEqual([null, 'user']);
});

// ── several players in one deck (the offerers' deck) ─────────────────────────

test('with several players, post numbers run across all of them and the group says whose card it is', async () => {
  const groups = [
    { user: bob, posts: [post('Lamp'), post('Chair')], locations: [] },
    { user: cara, posts: [post('Rug')], locations: [] },
  ];
  const { cb, el } = setup({ groups, jumpToken: 1, jumpToCardIndex: 6 }); // bob: u,l,0,1  cara: u,l,*2*
  await render(el);
  expect(lastTop(cb)).toEqual([2, 'post']);
  expect(cb.onTopCardGroupChange).toHaveBeenLastCalledWith(1);
});

test('when cards go away (an offerer leaves), the deck still reports a real top card', async () => {
  const two = [
    { user: bob, posts: [post('Lamp')], locations: [] },
    { user: cara, posts: [post('Rug')], locations: [] },
  ];
  const { cb, el } = setup({ groups: two, jumpToken: 1, jumpToCardIndex: 5 }); // cara's Rug
  const { rerender } = await render(el);
  expect(lastTop(cb)).toEqual([1, 'post']);
  // Cara's offer is gone: 3 cards left, and index 5 wraps to 2 (Bob's Lamp).
  await rerender(setup({ groups: [two[0]], jumpToken: 1, jumpToCardIndex: 5 }, cb).el);
  expect(lastTop(cb)).toEqual([0, 'post']);
  expect(cb.onTopCardGroupChange).toHaveBeenLastCalledWith(0);
});

test('tapping the post on top selects it', async () => {
  const onSelectPost = jest.fn();
  const { el } = setup({ jumpToken: 1, jumpToCardIndex: 2, onSelectPost });
  await render(el);
  await fireEvent.press(screen.getByText('post:Lamp'));
  expect(onSelectPost).toHaveBeenCalledWith(0);
});
