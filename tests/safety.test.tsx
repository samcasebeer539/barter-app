// Blocking and reporting, end to end in the app: the user card's buttons
// -> the confirm alerts -> the server calls -> the card turning red.
// Only the server (lib/api) and the system alerts are faked.
import React from 'react';
import { Alert, Platform } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/lib/api', () => ({ apiJson: jest.fn() }));
jest.mock('@expo/vector-icons', () => {
  const { Text: MockText } = require('react-native');
  return { FontAwesome6: ({ name, color }: { name: string; color: string }) =>
    <MockText testID={`icon-${name}`} style={{ color }}>{name}</MockText> };
});
jest.mock('expo-image', () => {
  const { View: MockView } = require('react-native');
  return { Image: () => <MockView /> };
});
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/services/userService', () => ({
  uploadProfilePhoto: jest.fn(),
  getUserReviews: jest.fn(async () => []),
  getCachedReviews: () => [],
}));

import { apiJson } from '@/lib/api';
import { getBlockedUsers, startReport } from '@/lib/safety';
import CardUser from '@/components/CardUser';
import { colors } from '@/styles/globalStyles';

const api = apiJson as jest.Mock;
const bob = { _id: 'bob1', first_name: 'Bob', last_name: 'Test', rating: 0, reviewCount: 0 } as any;

// The buttons of the last Alert.alert / Alert.prompt, by label.
let alertSpy: jest.SpyInstance, promptSpy: jest.SpyInstance;
const lastButtons = (spy: jest.SpyInstance) => spy.mock.calls.at(-1)[2] as { text: string; onPress?: (v?: string) => void }[];
const tap = (spy: jest.SpyInstance, label: string, value?: string) =>
  lastButtons(spy).find(b => b.text === label)!.onPress!(value);
const flush = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });

beforeEach(async () => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  promptSpy = jest.spyOn(Alert, 'prompt').mockImplementation(() => {});
  // Start each test with nobody blocked.
  api.mockImplementation(async (path: string) => (path === '/dev/blocked' ? [] : { reportedUserId: 'bob1' }));
  await getBlockedUsers();
  api.mockClear();
});

const banColor = () => screen.getByTestId('icon-ban').props.style.color;

test('block: asks first, then blocks and the button turns red', async () => {
  await render(<CardUser user={bob} />);
  await flush();
  expect(banColor()).toBe(colors.ui.cardsecondary);

  await fireEvent.press(screen.getByTestId('user-block'));
  expect(alertSpy.mock.calls[0][0]).toBe('Block Bob?');
  expect(api).not.toHaveBeenCalled();            // nothing until confirmed

  await act(async () => { tap(alertSpy, 'Block'); });
  await flush();
  expect(api).toHaveBeenCalledWith('/dev/block', { method: 'POST', body: { userId: 'bob1' } });
  expect(banColor()).toBe(colors.actions.decline);
});

test('cancelling the block does nothing', async () => {
  await render(<CardUser user={bob} />);
  await fireEvent.press(screen.getByTestId('user-block'));
  expect(lastButtons(alertSpy).find(b => b.text === 'Cancel')!.onPress).toBeUndefined();
  expect(api).not.toHaveBeenCalled();
});

test('tapping a blocked user offers to unblock', async () => {
  api.mockImplementation(async (path: string) => (path === '/dev/blocked' ? [{ _id: 'bob1', first_name: 'Bob' }] : {}));
  await getBlockedUsers();
  await render(<CardUser user={bob} />);
  await flush();
  expect(banColor()).toBe(colors.actions.decline);

  await fireEvent.press(screen.getByTestId('user-block'));
  expect(alertSpy.mock.calls.at(-1)[0]).toBe('Unblock Bob?');
  await act(async () => { tap(alertSpy, 'Unblock'); });
  await flush();
  expect(api).toHaveBeenCalledWith('/dev/block/bob1', { method: 'DELETE' });
  expect(banColor()).toBe(colors.ui.cardsecondary);
});

test("a failed block says so and the button doesn't turn red", async () => {
  await render(<CardUser user={bob} />);
  await flush();
  api.mockRejectedValueOnce(new Error('User not found'));
  await fireEvent.press(screen.getByTestId('user-block'));
  await act(async () => { tap(alertSpy, 'Block'); });
  await flush();
  expect(alertSpy.mock.calls.at(-1).slice(0, 2)).toEqual(["Couldn't block", 'User not found']);
  expect(banColor()).toBe(colors.ui.cardsecondary);
});

test('your own card has no block or report button', async () => {
  await render(<CardUser user={bob} isUser onEnterEdit={jest.fn()} />);
  expect(screen.queryByTestId('user-block')).toBeNull();
  expect(screen.queryByTestId('user-report')).toBeNull();
  expect(screen.getByTestId('user-edit')).toBeTruthy();
});

// ── reporting ────────────────────────────────────────────────────────────────

describe('report', () => {
  const realOS = Platform.OS;
  afterEach(() => { (Platform as any).OS = realOS; });

  test('from the card: pick a reason, add details, send, then offered a block', async () => {
    (Platform as any).OS = 'ios';
    await render(<CardUser user={bob} />);
    await fireEvent.press(screen.getByTestId('user-report'));
    expect(alertSpy.mock.calls[0][0]).toBe('Report Bob');
    tap(alertSpy, 'Spam');
    expect(lastButtons(promptSpy).map(b => b.text)).toEqual(['Cancel', 'Skip', 'Send']);
    await act(async () => { tap(promptSpy, 'Send', '  keeps messaging  '); });
    await flush();
    expect(api).toHaveBeenCalledWith('/dev/report', {
      method: 'POST', body: { userId: 'bob1', postId: undefined, reason: 'spam', note: 'keeps messaging' },
    });
    expect(alertSpy.mock.calls.at(-1)[0]).toBe('Thanks for reporting');
    expect(lastButtons(alertSpy).map(b => b.text)).toEqual(['Not now', 'Block Bob']);
  });

  test('"Other" needs details: no Skip, but it can be cancelled', () => {
    (Platform as any).OS = 'ios';
    startReport({ userId: 'bob1', name: 'Bob' });
    tap(alertSpy, 'Other');
    expect(promptSpy.mock.calls[0][0]).toBe("What's wrong?");
    expect(lastButtons(promptSpy).map(b => b.text)).toEqual(['Cancel', 'Send']);
  });

  test('every reason, plus a way out', () => {
    startReport({ postId: 'p1', name: 'Bob' });
    expect(alertSpy.mock.calls[0][0]).toBe('Report this post');
    expect(lastButtons(alertSpy).map(b => b.text)).toEqual(
      ['Spam', 'Scam or fraud', 'Inappropriate content', 'Harassment', 'Other', 'Cancel']);
  });

  test('Android has no text prompt: the report goes straight away', async () => {
    (Platform as any).OS = 'android';
    startReport({ postId: 'p1', name: 'Bob' });
    await act(async () => { tap(alertSpy, 'Scam or fraud'); });
    expect(promptSpy).not.toHaveBeenCalled();
    expect(api).toHaveBeenCalledWith('/dev/report', expect.objectContaining({ body: expect.objectContaining({ reason: 'scam', postId: 'p1' }) }));
  });

  test('a failed report says so', async () => {
    (Platform as any).OS = 'android';
    api.mockRejectedValueOnce(new Error('offline'));
    startReport({ userId: 'bob1', name: 'Bob' });
    await act(async () => { tap(alertSpy, 'Spam'); });
    await flush();
    expect(alertSpy.mock.calls.at(-1).slice(0, 2)).toEqual(["Couldn't send the report", 'offline']);
  });
});
