// hooks/useStableCallback.ts
//
// A function whose identity never changes but always runs the latest `fn`.
// Passing these instead of inline arrow functions lets a memoized child
// (Deck) skip re-rendering when only the parent's state changed, without
// ever calling an out-of-date callback.
import { useCallback, useRef } from 'react';

export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R;
export function useStableCallback<A extends unknown[], R>(
  fn: ((...args: A) => R) | undefined,
): ((...args: A) => R) | undefined;
export function useStableCallback<A extends unknown[], R>(fn: ((...args: A) => R) | undefined) {
  const ref = useRef(fn);
  ref.current = fn;
  const stable = useCallback((...args: A) => ref.current!(...args), []);
  // Stays undefined when no function is given (some cards check for one).
  return fn ? stable : undefined;
}
