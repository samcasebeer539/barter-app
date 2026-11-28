// lib/session.ts: one call forgets everything cached for the last account.
jest.mock('@/lib/settingsCache', () => ({ clearSettingsCache: jest.fn() }));
jest.mock('@/lib/safety', () => ({ clearBlockedCache: jest.fn() }));
jest.mock('@/services/userService', () => ({ clearReviewsCache: jest.fn() }));

import { clearSessionCaches } from '@/lib/session';
import { clearSettingsCache } from '@/lib/settingsCache';
import { clearBlockedCache } from '@/lib/safety';
import { clearReviewsCache } from '@/services/userService';

test('clears settings, the block list and cached reviews', () => {
  clearSessionCaches();
  expect(
    [clearSettingsCache, clearBlockedCache, clearReviewsCache].map(f => (f as jest.Mock).mock.calls.length),
  ).toEqual([1, 1, 1]);
});
