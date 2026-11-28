// lib/settingsCache.ts: the server's settings response -> the app's.
jest.mock('@/lib/api', () => ({ apiJson: jest.fn() }));
import { toAppSettings } from '@/lib/settingsCache';

test('reads the fields the server sends (GET /settings)', () => {
  expect(toAppSettings({ is_location_allowed: false, notifications_enabled: false })).toEqual({
    locationAllowed: false,
    notificationsEnabled: false,
  });
});

test('everything defaults to on', () => {
  expect(toAppSettings({})).toEqual({ locationAllowed: true, notificationsEnabled: true });
  expect(toAppSettings(null)).toEqual({ locationAllowed: true, notificationsEnabled: true });
});
