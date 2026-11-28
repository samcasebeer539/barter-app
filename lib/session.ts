// lib/session.ts
//
// Things the app remembers for the signed-in account during a session: its
// settings, who it has blocked, reviews it has looked at. When the account
// changes (sign out, account deleted, someone else signs in) they belong to
// the previous account, so they're all forgotten.
import { clearSettingsCache } from './settingsCache';
import { clearBlockedCache } from './safety';
import { clearReviewsCache } from '@/services/userService';

export function clearSessionCaches() {
  clearSettingsCache();
  clearBlockedCache();
  clearReviewsCache();
}
