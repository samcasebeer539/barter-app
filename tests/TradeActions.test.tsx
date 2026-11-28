// components/TradeActions.tsx: the action wheel every deck uses. Which
// buttons can be tapped, what they show, and the confirm arrow.
import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react-native';

// Icons render as text ("icon:circle") so tests can see which one shows.
jest.mock('@expo/vector-icons', () => {
  const { Text: MockText } = require('react-native');
  return { FontAwesome6: ({ name }: { name: string }) => <MockText>{`icon:${name}`}</MockText> };
});

import TradeActions from '@/components/TradeActions';
import { getActionConfig, TradeActionType } from '@/config/tradeConfig';

const config = (...types: TradeActionType[]) => types.map(t => getActionConfig(t)!);

async function setup(props: Partial<React.ComponentProps<typeof TradeActions>> = {}) {
  const handlers = {
    onActionSelected: jest.fn(),
    onQueryPostSelect: jest.fn(),
    onQueryPostDeselect: jest.fn(),
  };
  await render(
    <TradeActions
      actions={config('query', 'offer')}
      activeActionType={null}
      isReady={false}
      selectedCount={0}
      topCardIsSelected={false}
      isQueryMode={false}
      queryPostSelected={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

// The wheel repeats every action; the first copy of the action on top is
// the live one.
const button = (type: string) => screen.getAllByTestId(`action-${type}`)[0];
const icons = (type: string) =>
  within(button(type)).queryAllByText(/^icon:/).map(n => (n.props.children as string).slice(5));

afterEach(() => jest.useRealTimers());

// ── QUERY ────────────────────────────────────────────────────────────────────

test('query: tap arms it and tags the post on top', async () => {
  const h = await setup();
  expect(icons('query')).toEqual(['circle']);
  await fireEvent.press(button('query'));
  expect(h.onActionSelected).toHaveBeenCalledWith({ actionType: 'query', subAction: 'write' });
  expect(h.onQueryPostSelect).toHaveBeenCalled();
});

test('query while armed: shows the question icon, tap closes it', async () => {
  const h = await setup({ activeActionType: 'query' });
  expect(icons('query')).toEqual(['circle-question']);
  await fireEvent.press(button('query'));
  expect(h.onQueryPostDeselect).toHaveBeenCalled();
  expect(h.onActionSelected).toHaveBeenCalledWith({ actionType: 'query', subAction: 'write' });
});

test('query with no post on top: no icon, and tapping does nothing', async () => {
  const h = await setup({ queryBlocked: true });
  expect(icons('query')).toEqual([]);
  await fireEvent.press(button('query'));
  expect(h.onActionSelected).not.toHaveBeenCalled();
});

test('an open question box can still be closed after the top card stops being a post', async () => {
  const h = await setup({ queryBlocked: true, activeActionType: 'query' });
  expect(icons('query')).toEqual(['circle-question']);
  await fireEvent.press(button('query'));
  expect(h.onQueryPostDeselect).toHaveBeenCalled();
});

// ── select actions ───────────────────────────────────────────────────────────

test('offer: a circle that turns into a check once the top card is picked', async () => {
  await setup({ actions: config('offer'), activeActionType: 'offer', topCardIsSelected: false });
  expect(icons('offer')).toEqual(['circle']);
  await screen.unmount();
  await setup({ actions: config('offer'), activeActionType: 'offer', topCardIsSelected: true });
  expect(icons('offer')).toEqual(['circle-check']);
});

test('offer on a user or location card: no icon, no tap', async () => {
  const h = await setup({ actions: config('offer'), blockedActionTypes: ['offer'] });
  expect(icons('offer')).toEqual([]);
  await fireEvent.press(button('offer'));
  expect(h.onActionSelected).not.toHaveBeenCalled();
});

test('barter shows how many posts are picked; blocked hides the count too', async () => {
  await setup({ actions: config('barter'), selectedCount: 3 });
  expect(within(button('barter')).getByText('03')).toBeTruthy();
  await screen.unmount();
  await setup({ actions: config('barter'), selectedCount: 3, blockedActionTypes: ['barter'] });
  expect(within(button('barter')).queryByText('03')).toBeNull();
  expect(icons('barter')).toEqual([]);
});

test('add / subtract: plus / minus icons, blocked when the top card is not a post', async () => {
  await setup({ actions: config('add', 'subtract') });
  expect(icons('add')).toEqual(['circle-plus']);
  await screen.unmount();
  const h = await setup({ actions: config('add'), blockedActionTypes: ['add'] });
  expect(icons('add')).toEqual([]);
  await fireEvent.press(button('add'));
  expect(h.onActionSelected).not.toHaveBeenCalled();
});

test('only the action on top of the wheel can be tapped', async () => {
  const h = await setup({ actions: config('query', 'stall') });
  await fireEvent.press(button('stall'));  // stall is second: not on top
  expect(h.onActionSelected).not.toHaveBeenCalled();
});

// ── confirm arrow ────────────────────────────────────────────────────────────

test('the arrow is off until the action on top is armed and ready', async () => {
  const h = await setup({ actions: config('stall'), activeActionType: 'stall', isReady: false });
  await fireEvent.press(screen.getByTestId('confirm-arrow'));
  expect(h.onActionSelected).not.toHaveBeenCalled();
});

test('the arrow sends the move once, even on a double tap', async () => {
  const h = await setup({ actions: config('stall'), activeActionType: 'stall', isReady: true });
  await fireEvent.press(screen.getByTestId('confirm-arrow'));
  await fireEvent.press(screen.getByTestId('confirm-arrow'));
  expect(h.onActionSelected).toHaveBeenCalledTimes(1);
  expect(h.onActionSelected).toHaveBeenCalledWith({ actionType: 'stall', subAction: 'select' });
});

// ── timers ───────────────────────────────────────────────────────────────────

test("decline counts down to the server's turn deadline", async () => {
  jest.useFakeTimers({ now: new Date('2026-11-27T12:00:00Z') });
  await setup({ actions: config('decline'), turnDeadline: '2026-11-27T13:30:05Z' });
  expect(within(button('decline')).getByText('01:30:05')).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(within(button('decline')).getByText('01:30:00')).toBeTruthy();
});

test('wait shows just the clock when there is no turn clock (agreed deals)', async () => {
  await setup({ actions: config('wait'), noTurnClock: true });
  expect(within(button('wait')).queryByText(/\d\d:\d\d:\d\d/)).toBeNull();
  expect(icons('wait')).toEqual(['clock']);
});
