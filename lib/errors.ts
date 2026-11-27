// lib/errors.ts
//
// Turning a failed request into something a person can read, and showing
// it. The server's own messages are mostly written for people already
// ("That item has already been traded"), so those are shown as they are.
// What gets reworded: no connection, server crashes, and the few messages
// that name internals (actions, phases, ids) or only happen if the app
// itself sent something wrong.
import { Alert } from 'react-native';
import { ApiError } from './apiError';

export const OFFLINE_MESSAGE = 'Check your connection and try again.';
export const SERVER_DOWN_MESSAGE = 'Something went wrong on our end. Try again in a moment.';
export const GENERIC_MESSAGE = 'Something went wrong. Refresh and try again.';

// [pattern the server's message matches, what to show instead]
const REWORDS: [RegExp, string][] = [
  [/^It's not your turn/, "It's not your turn anymore. Refresh to see the latest."],
  [/is not valid in phase/, 'This trade has moved on. Refresh to see the latest.'],
  [/^(Game|Offer|Question) not found$/, 'This trade no longer exists. Refresh to see the latest.'],
  [/^(Unauthorized|Not a participant in this game)$/, "You're not part of this trade."],
  [/^(Missing token|Invalid or expired token)$/, 'Please sign in again.'],
  // Only happen if the app sends a malformed request: nothing the person
  // can fix, so don't show the technical detail.
  [/^(Missing|Invalid)\b|must be one of|requires:|needs a time zone|^status must be|^No valid fields/, GENERIC_MESSAGE],
];

/** A message to show for this error. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return OFFLINE_MESSAGE;
    if (err.status >= 500) return SERVER_DOWN_MESSAGE;
    for (const [pattern, friendly] of REWORDS) if (pattern.test(err.message)) return friendly;
    return err.message;
  }
  // Firebase Storage (photo uploads): codes like "storage/unauthorized".
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === 'string' && code.startsWith('storage/')) {
    return code === 'storage/retry-limit-exceeded' ? OFFLINE_MESSAGE : "The photo couldn't be uploaded. Try again.";
  }
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (/network request failed|network error|timed out/i.test(message)) return OFFLINE_MESSAGE;
  return message || GENERIC_MESSAGE;
}

/** Show a failure: what didn't happen (the title), and why. Also logs it. */
export function showError(title: string, err: unknown) {
  console.warn(`${title}:`, err);
  Alert.alert(title, errorMessage(err));
}
