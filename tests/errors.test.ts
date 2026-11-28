// lib/errors.ts: what a person sees when something fails.
import { Alert } from 'react-native';
import { ApiError } from '@/lib/apiError';
import { errorMessage, showError, OFFLINE_MESSAGE, SERVER_DOWN_MESSAGE, GENERIC_MESSAGE } from '@/lib/errors';

const api = (message: string, status = 400) => new ApiError(message, status);

test("the server's own (readable) messages are shown as they are", () => {
  for (const m of [
    'That item has already been traded',
    'Bio is too long (max 300 characters)',
    'Maximum 3 locations allowed',
    'Turn time ran out; the trade was declined',
    'This trade just changed. Refresh and try again.',
  ]) {
    expect(errorMessage(api(m, 409))).toBe(m);
  }
});

test('no connection, or a timeout', () => {
  expect(errorMessage(api('POST /dev/trades/offer failed: Network request failed', 0))).toBe(OFFLINE_MESSAGE);
  expect(errorMessage(api('GET /dev/feed timed out', 0))).toBe(OFFLINE_MESSAGE);
  expect(errorMessage(new TypeError('Network request failed'))).toBe(OFFLINE_MESSAGE);
});

test('server crashes get a generic message, not the crash text', () => {
  expect(errorMessage(api("'NoneType' object is not subscriptable", 500))).toBe(SERVER_DOWN_MESSAGE);
  expect(errorMessage(api('GET /dev/feed failed with status 502', 502))).toBe(SERVER_DOWN_MESSAGE);
});

test('messages that name internals are reworded', () => {
  expect(errorMessage(api("It's not your turn (action 'stall' in phase 'barter')", 403))).toBe(
    "It's not your turn anymore. Refresh to see the latest.",
  );
  expect(errorMessage(api("Action 'barter' is not valid in phase 'open'"))).toBe(
    'This trade has moved on. Refresh to see the latest.',
  );
  expect(errorMessage(api('Game not found', 404))).toBe('This trade no longer exists. Refresh to see the latest.');
  expect(errorMessage(api('Unauthorized', 403))).toBe("You're not part of this trade.");
  expect(errorMessage(api('Invalid or expired token', 401))).toBe('Please sign in again.');
});

test("bad requests the person can't fix get the generic message", () => {
  for (const m of [
    'Missing gameId',
    'Invalid id',
    'Invalid gameId or postId',
    'No valid fields to update',
    "reason must be one of ['other', 'spam']",
    'proposedAt needs a time zone',
  ]) {
    expect(errorMessage(api(m))).toBe(GENERIC_MESSAGE);
  }
});

test('but readable "must" messages stay', () => {
  expect(errorMessage(api('Rating must be a whole number from 1 to 5'))).toBe(
    'Rating must be a whole number from 1 to 5',
  );
});

test('photo upload (Firebase Storage) errors', () => {
  expect(errorMessage({ code: 'storage/unauthorized', message: 'Firebase Storage: ...' })).toBe(
    "The photo couldn't be uploaded. Try again.",
  );
  expect(errorMessage({ code: 'storage/retry-limit-exceeded' })).toBe(OFFLINE_MESSAGE);
});

test('anything else: its message, or the generic one', () => {
  expect(errorMessage(new Error('Picker unavailable'))).toBe('Picker unavailable');
  expect(errorMessage(undefined)).toBe(GENERIC_MESSAGE);
});

test('showError shows a title and the friendly message', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  showError("Your offer didn't go through", api('x', 0));
  expect(alert).toHaveBeenCalledWith("Your offer didn't go through", OFFLINE_MESSAGE);
});
