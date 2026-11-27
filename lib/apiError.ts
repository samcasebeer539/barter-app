// lib/apiError.ts
//
// The error lib/api throws for a failed request. In its own file (no
// Firebase) so error handling (lib/errors) can use it anywhere.
export class ApiError extends Error {
  /** HTTP status, or 0 if the request never got an answer (offline, timeout). */
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
