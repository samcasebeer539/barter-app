// lib/api.ts: every request carries the user's token, errors come back as
// ApiError with the server's own message, and the version check skips
// downloads when nothing changed.
jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { getIdToken: async () => 'tok123', uid: 'u1' } }),
}));

import { apiJson, apiJsonIfChanged, apiRequest, ApiError } from '@/lib/api';

type FakeResponse = { status: number; body?: unknown; headers?: Record<string, string> };

function respond({ status, body, headers = {} }: FakeResponse) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (body === undefined) throw new SyntaxError('no body');
      return body;
    },
    headers: { get: (k: string) => headers[k] ?? null },
  };
}

const fetchMock = jest.fn();
beforeEach(() => {
  (globalThis as any).fetch = fetchMock;
});

test('sends the token, JSON body and method to the server address', async () => {
  fetchMock.mockResolvedValue(respond({ status: 201, body: { ok: 1 } }));
  await expect(apiJson('/dev/posts', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ ok: 1 });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('https://api.test/dev/posts');
  expect(init.method).toBe('POST');
  expect(init.headers).toMatchObject({ Authorization: 'Bearer tok123', 'Content-Type': 'application/json' });
  expect(JSON.parse(init.body)).toEqual({ a: 1 });
});

test('GET has no body or content type', async () => {
  fetchMock.mockResolvedValue(respond({ status: 200, body: [] }));
  await apiJson('/dev/feed');
  const [, init] = fetchMock.mock.calls[0];
  expect(init.body).toBeUndefined();
  expect(init.headers['Content-Type']).toBeUndefined();
});

test("a failed request throws the server's own error message and status", async () => {
  fetchMock.mockResolvedValue(respond({ status: 403, body: { error: "It's not your turn" } }));
  const err = await apiJson('/dev/trades/stall', { method: 'POST', body: {} }).catch(e => e);
  expect(err).toBeInstanceOf(ApiError);
  expect([err.message, err.status]).toEqual(["It's not your turn", 403]);
});

test('an error with no JSON body still gives a readable message', async () => {
  fetchMock.mockResolvedValue(respond({ status: 500 }));
  const err = await apiJson('/dev/feed').catch(e => e);
  expect(err.message).toBe('GET /dev/feed failed with status 500');
});

test('204 No Content resolves to undefined', async () => {
  fetchMock.mockResolvedValue(respond({ status: 204 }));
  await expect(apiJson('/dev/x')).resolves.toBeUndefined();
});

test('offline: ApiError with status 0', async () => {
  fetchMock.mockRejectedValue(new TypeError('Network request failed'));
  const err = await apiRequest('/dev/feed').catch(e => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(0);
  expect(err.message).toContain('Network request failed');
});

test('a request that takes too long is cut off', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation((_url: string, init: any) => new Promise((_res, rej) => {
    init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  const pending = apiRequest('/dev/feed', { timeoutMs: 50 }).catch(e => e);
  await jest.advanceTimersByTimeAsync(60);
  const err = await pending;
  jest.useRealTimers();
  expect(err.message).toBe('GET /dev/feed timed out');
});

describe('apiJsonIfChanged', () => {
  test('sends the known version; 204 means nothing to download', async () => {
    fetchMock.mockResolvedValue(respond({ status: 204 }));
    await expect(apiJsonIfChanged('/dev/trades/close', 'v1')).resolves.toEqual({ changed: false });
    expect(fetchMock.mock.calls[0][1].headers['X-Known-Version']).toBe('v1');
  });

  test('new data comes back with its new version', async () => {
    fetchMock.mockResolvedValue(respond({ status: 200, body: [{ gameId: 'g' }], headers: { 'X-Version': 'v2' } }));
    await expect(apiJsonIfChanged('/dev/trades/close', 'v1')).resolves.toEqual({
      changed: true, data: [{ gameId: 'g' }], version: 'v2',
    });
  });

  test('errors still throw', async () => {
    fetchMock.mockResolvedValue(respond({ status: 404, body: { error: 'User not found' } }));
    await expect(apiJsonIfChanged('/dev/trades/close', 'v1')).rejects.toThrow('User not found');
  });
});
