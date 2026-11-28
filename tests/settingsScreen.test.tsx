// app/settings.tsx: the settings screen. The two toggles (saved on the
// server and remembered in the app), Location Services asking the phone,
// the blocked users list, and logging out.
import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

const mockSeen: { deck?: any; onBlock?: (id: string, blocked: boolean) => void } = {};
jest.mock('@/components/Deck', () => ({ __esModule: true, default: (p: any) => { mockSeen.deck = p; return null; } }));
jest.mock('@expo/vector-icons/FontAwesome6', () => () => null);
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'alice' } } }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn(async () => {}), getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn() }));
jest.mock('@/lib/safety', () => ({
  getBlockedUsers: jest.fn(async () => []),
  onBlockChange: (fn: any) => { mockSeen.onBlock = fn; return () => {}; },
}));
const mockPhone = { status: 'granted', canAskAgain: true };
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: mockPhone.status })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: mockPhone.status, canAskAgain: mockPhone.canAskAgain })),
}));

import Settings from '@/app/settings';
import { apiJson } from '@/lib/api';
import { setSettingsCache } from '@/lib/settingsCache';
import { getBlockedUsers } from '@/lib/safety';
import { signOut } from 'firebase/auth';
import { ApiError } from '@/lib/apiError';

const api = apiJson as jest.Mock;
const flush = () => act(async () => { for (let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0)); });
let alert: jest.SpyInstance;
beforeEach(() => {
  api.mockReset().mockResolvedValue({});
  setSettingsCache({ locationAllowed: true, notificationsEnabled: true });
  Object.assign(mockPhone, { status: 'granted', canAskAgain: true });
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockSeen.deck = undefined;
});

async function open() {
  await render(<Settings />);
  await flush();
}
// [notifications, location services]
const switches = () => screen.getAllByRole('switch');
const values = () => switches().map(s => s.props.value);
const flip = async (i: 0 | 1, value: boolean) => { await fireEvent(switches()[i], 'valueChange', value); await flush(); };

// ── toggles ──────────────────────────────────────────────────────────────────

test('shows your saved settings', async () => {
  setSettingsCache({ locationAllowed: false, notificationsEnabled: false });
  await open();
  expect(values()).toEqual([false, false]);
});

test("Location Services shows off if the phone doesn't allow location, even when it's on in your account", async () => {
  mockPhone.status = 'denied';
  await open();
  expect(values()).toEqual([true, false]);
});

test('notifications: saved on the server, and still off when you come back', async () => {
  await open();
  await flip(0, false);
  expect(api).toHaveBeenCalledWith('/dev/update_user', { method: 'PATCH', body: { is_notifications_allowed: false } });
  await screen.unmount();
  await open();
  expect(values()[0]).toBe(false);
});

test('location: saved on the server, and still off when you come back', async () => {
  await open();
  await flip(1, false);
  expect(api).toHaveBeenCalledWith('/dev/update_user', { method: 'PATCH', body: { is_location_allowed: false } });
  await screen.unmount();
  await open();
  expect(values()[1]).toBe(false);
});

test.each([0, 1] as const)('a failed save says so and flips the toggle back (%s)', async i => {
  await open();
  api.mockRejectedValueOnce(new ApiError('Network request failed', 0));
  await flip(i, false);
  expect(alert).toHaveBeenCalledWith("Couldn't save the setting", 'Check your connection and try again.');
  expect(values()[i]).toBe(true);
  await screen.unmount();
  await open();
  expect(values()[i]).toBe(true);    // and not remembered as off either
});

test('turning Location Services on asks the phone first', async () => {
  setSettingsCache({ locationAllowed: false, notificationsEnabled: true });
  await open();
  await flip(1, true);
  expect(require('expo-location').requestForegroundPermissionsAsync).toHaveBeenCalled();
  expect(api).toHaveBeenCalledWith('/dev/update_user', { method: 'PATCH', body: { is_location_allowed: true } });
  expect(values()[1]).toBe(true);
});

test("if the phone says no, it stays off and says why (with a way to the phone's Settings if needed)", async () => {
  setSettingsCache({ locationAllowed: false, notificationsEnabled: true });
  await open();
  Object.assign(mockPhone, { status: 'denied', canAskAgain: false });
  await flip(1, true);
  expect(values()[1]).toBe(false);
  expect(api).not.toHaveBeenCalled();
  const [title, , buttons] = alert.mock.calls[0];
  expect(title).toBe('Location access is off');
  const open_ = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  buttons.find((b: any) => b.text === 'Open Settings').onPress();
  expect(open_).toHaveBeenCalled();
});

// ── blocked users ────────────────────────────────────────────────────────────

test('blocked users: loaded fresh each time it opens, shown as a deck of their cards', async () => {
  (getBlockedUsers as jest.Mock).mockResolvedValue([{ _id: 'bob', first_name: 'Bob' }, { _id: 'eve', first_name: 'Eve' }]);
  await open();
  await fireEvent.press(screen.getByText('Blocked Users'));
  await flush();
  expect(mockSeen.deck.groups.map((g: any) => g.user.first_name)).toEqual(['Bob', 'Eve']);
  await fireEvent.press(screen.getByText('Blocked Users'));   // close
  await fireEvent.press(screen.getByText('Blocked Users'));   // reopen
  await flush();
  expect(getBlockedUsers).toHaveBeenCalledTimes(2);
});

test('unblocking someone takes their card out', async () => {
  (getBlockedUsers as jest.Mock).mockResolvedValue([{ _id: 'bob', first_name: 'Bob' }, { _id: 'eve', first_name: 'Eve' }]);
  await open();
  await fireEvent.press(screen.getByText('Blocked Users'));
  await flush();
  await act(async () => { mockSeen.onBlock?.('bob', false); });
  expect(mockSeen.deck.groups.map((g: any) => g.user.first_name)).toEqual(['Eve']);
});

test("with nobody blocked, says so", async () => {
  (getBlockedUsers as jest.Mock).mockResolvedValue([]);
  await open();
  await fireEvent.press(screen.getByText('Blocked Users'));
  await flush();
  expect(screen.getByText("You haven't blocked anyone.")).toBeTruthy();
});

// ── logging out ──────────────────────────────────────────────────────────────

test('log out signs you out; a failure says so', async () => {
  await open();
  await fireEvent.press(screen.getByText('Log Out'));
  await flush();
  expect(signOut).toHaveBeenCalled();
  (signOut as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
  await fireEvent.press(screen.getByText('Log Out'));
  await flush();
  expect(alert).toHaveBeenCalledWith("Couldn't log out", 'Check your connection and try again.');
});

// ── deleting your account ────────────────────────────────────────────────────

test('delete account: asks first; Cancel does nothing', async () => {
  await open();
  await fireEvent.press(screen.getByText('Delete Account'));
  const [title, message, buttons] = alert.mock.calls[0];
  expect(title).toBe('Delete your account?');
  expect(message).toMatch(/permanently deletes your profile, posts and photos/);
  expect(buttons.map((b: any) => [b.text, b.style])).toEqual([['Cancel', 'cancel'], ['Delete Account', 'destructive']]);
  expect(api).not.toHaveBeenCalledWith('/dev/account', expect.anything());
});

test('confirming deletes it on the server, then signs out', async () => {
  await open();
  await fireEvent.press(screen.getByText('Delete Account'));
  const confirm = alert.mock.calls[0][2].find((b: any) => b.text === 'Delete Account');
  await act(async () => { await confirm.onPress(); });
  expect(api).toHaveBeenCalledWith('/dev/account', { method: 'DELETE' });
  expect(signOut).toHaveBeenCalled();
});

test("if it can't be deleted, says why and stays signed in", async () => {
  await open();
  (signOut as jest.Mock).mockClear();
  api.mockImplementation(async (path: string) => {
    if (path === '/dev/account') throw new ApiError("Couldn't delete your sign-in. Nothing was deleted; try again.", 502);
    return {};
  });
  await fireEvent.press(screen.getByText('Delete Account'));
  const confirm = alert.mock.calls[0][2].find((b: any) => b.text === 'Delete Account');
  await act(async () => { await confirm.onPress(); });
  expect(alert).toHaveBeenLastCalledWith("Couldn't delete your account", 'Something went wrong on our end. Try again in a moment.');
  expect(signOut).not.toHaveBeenCalled();
  expect(screen.getByText('Delete Account')).toBeTruthy();   // usable again
});

// ── help, terms and privacy ──────────────────────────────────────────────────

test('Help Center: no fake address while the support email is unset', async () => {
  await open();
  await fireEvent.press(screen.getByText('Help Center'));
  expect(screen.getByText('Support email coming soon.')).toBeTruthy();
  expect(screen.queryByText(/example@gmail\.com/)).toBeNull();
});

test('Terms and Privacy Policy open to their full text', async () => {
  const legal = require('@/config/legal.json');
  await open();
  await fireEvent.press(screen.getByText('Terms and Conditions'));
  for (const s of legal.terms) expect(screen.getByText(s.heading)).toBeTruthy();
  await fireEvent.press(screen.getByText('Privacy Policy'));
  for (const s of legal.privacy) expect(screen.getByText(s.heading)).toBeTruthy();
  expect(screen.getAllByText(`Effective ${legal.effectiveDate}`)).toHaveLength(2);
});
