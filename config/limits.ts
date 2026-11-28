// config/limits.ts
//
// Caps the app enforces. The server enforces the same numbers
// (backend/helpers.py), so change them in both places.

/** Posts per account. ADD POST turns off at this many. */
export const MAX_POSTS = 99;
