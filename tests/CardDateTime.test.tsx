// components/CardDateTime.tsx: the meetup time card. Picking a date, then a
// time; what's sent for WHEN (the exact moment, in the phone's time zone);
// clearing it; and showing a proposed time.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { FontAwesome6: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text> };
});

import CardDateTime from '@/components/CardDateTime';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 27, 17, 0) });
}); // Fri Nov 27, 5 PM local
afterEach(() => jest.useRealTimers());

async function pickMondayAt(time: string) {
  await fireEvent.press(screen.getByText('Date'));
  expect(screen.getByText('Pick a Date')).toBeTruthy();
  await fireEvent.press(screen.getByText('Mon, Nov 30'));
  expect(screen.getByText('Time on Mon, Nov 30')).toBeTruthy();
  await fireEvent.press(screen.getByText(time));
}

test('pick a date (three days out at the earliest), then a time', async () => {
  await render(<CardDateTime />);
  expect(screen.getByText('Propose a Meetup Time')).toBeTruthy();
  await fireEvent.press(screen.getByText('Date'));
  expect(screen.queryByText('Sat, Nov 28')).toBeNull();
  expect(screen.queryByText('Sun, Nov 29')).toBeNull();
  await fireEvent.press(screen.getByText('Mon, Nov 30'));
  await fireEvent.press(screen.getByText('3:00 PM'));
  expect(screen.getByText('Mon, Nov 30 at 3:00 PM')).toBeTruthy();
});

test.each([
  ['7:00 AM', 7],
  ['11:00 AM', 11],
  ['12:00 PM', 12],
  ['3:00 PM', 15],
  ['8:00 PM', 20],
])("WHEN sends %s as that moment on that day, in the phone's time zone", async (time, hour) => {
  const onProposeTime = jest.fn();
  await render(<CardDateTime isSelectMode onProposeTime={onProposeTime} />);
  await pickMondayAt(time);
  expect(onProposeTime).toHaveBeenLastCalledWith({
    proposedAt: new Date(2026, 10, 30, hour, 0).toISOString(),
    label: `Mon, Nov 30 at ${time}`,
  });
});

test('nothing is sent until both a date and a time are picked', async () => {
  const onProposeTime = jest.fn();
  await render(<CardDateTime isSelectMode onProposeTime={onProposeTime} />);
  expect(onProposeTime).toHaveBeenLastCalledWith(null);
  await fireEvent.press(screen.getByText('Date'));
  await fireEvent.press(screen.getByText('Mon, Nov 30'));
  expect(onProposeTime).toHaveBeenLastCalledWith(null);
});

test('backing out of either list picks nothing', async () => {
  await render(<CardDateTime />);
  await fireEvent.press(screen.getByText('Date'));
  await fireEvent.press(screen.getByText('icon:circle-xmark'));
  expect(screen.getByText('Propose a Meetup Time')).toBeTruthy();
  await fireEvent.press(screen.getByText('Date'));
  await fireEvent.press(screen.getByText('Mon, Nov 30'));
  await fireEvent.press(screen.getByText('icon:circle-xmark'));
  expect(screen.getByText('Date')).toBeTruthy();
});

test('X clears a picked time (and WHEN is told)', async () => {
  const onProposeTime = jest.fn();
  await render(<CardDateTime isSelectMode onProposeTime={onProposeTime} />);
  await pickMondayAt('3:00 PM');
  await fireEvent.press(screen.getByText('icon:circle-xmark'));
  expect(screen.getByText('Date')).toBeTruthy();
  expect(onProposeTime).toHaveBeenLastCalledWith(null);
});

test('a time picked before WHEN was tapped is sent as soon as WHEN arms', async () => {
  const onProposeTime = jest.fn();
  const { rerender } = await render(<CardDateTime onProposeTime={onProposeTime} />);
  await pickMondayAt('3:00 PM');
  expect(onProposeTime).not.toHaveBeenCalled();
  await rerender(<CardDateTime isSelectMode onProposeTime={onProposeTime} />);
  expect(onProposeTime).toHaveBeenLastCalledWith(expect.objectContaining({ label: 'Mon, Nov 30 at 3:00 PM' }));
});

test('a proposed time shows read-only with a check', async () => {
  await render(<CardDateTime proposedTime="Tue, Dec 1 at 2:00 PM" />);
  expect(screen.getByText('Meetup Time')).toBeTruthy();
  expect(screen.getByText('Tue, Dec 1 at 2:00 PM')).toBeTruthy();
  expect(screen.queryByText('Date')).toBeNull();
});

test("the other player's card, before they propose: says so, nothing to pick", async () => {
  await render(<CardDateTime isUser={false} />);
  expect(screen.getByText('No time proposed yet')).toBeTruthy();
  expect(screen.queryByText('Date')).toBeNull();
});
