// lib/api.ts
//
// One place for talking to the Flask server: every request gets the
// signed-in user's Firebase token, a timeout, and the same error handling.
// A failed request throws ApiError with the server's own error message when
// it sent one (e.g. "It's not your turn"), so screens can show it as is.
import { getAuth } from 'firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  /** HTTP status, or 0 if the request never got an answer (offline, timeout). */
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
  /** The version of this data the app already has (see apiJsonIfChanged). */
  knownVersion?: string;
  timeoutMs?: number;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuth().currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** The raw response (any status). Throws ApiError only if there's no
 *  answer at all: offline, server down, or the timeout ran out. */
export async function apiRequest(path: string, options: ApiOptions = {}): Promise<Response> {
  const { method = 'GET', body, knownVersion, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = { ...(await authHeaders()) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (knownVersion) headers['X-Known-Version'] = knownVersion;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    const timedOut = err?.name === 'AbortError';
    throw new ApiError(
      timedOut ? `${method} ${path} timed out` : `${method} ${path} failed: ${err?.message ?? err}`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function errorFrom(res: Response, method: string, path: string): Promise<ApiError> {
  const data = await res.json().catch(() => null);
  const message = data?.error ?? data?.message ?? `${method} ${path} failed with status ${res.status}`;
  return new ApiError(message, res.status);
}

/** The parsed JSON body. Throws ApiError for any non-2xx answer. */
export async function apiJson<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiRequest(path, options);
  if (!res.ok) throw await errorFrom(res, options.method ?? 'GET', path);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type IfChanged<T> = { changed: false } | { changed: true; data: T; version: string };

/** For endpoints that send a version (X-Version): pass the version you have;
 *  if nothing changed the server answers 204 and this returns
 *  { changed: false } without downloading anything. */
export async function apiJsonIfChanged<T = any>(
  path: string,
  knownVersion: string,
  options: Omit<ApiOptions, 'knownVersion'> = {},
): Promise<IfChanged<T>> {
  const res = await apiRequest(path, { ...options, knownVersion });
  if (res.status === 204) return { changed: false };
  if (!res.ok) throw await errorFrom(res, options.method ?? 'GET', path);
  return { changed: true, data: await res.json(), version: res.headers.get('X-Version') ?? '' };
}
