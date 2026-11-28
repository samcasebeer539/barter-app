// lib/format.ts: small display helpers.

/** Counts in the deck bars: two digits, zero-padded (03, 10, 99). */
export const pad2 = (n: number) => String(n).padStart(2, '0');
