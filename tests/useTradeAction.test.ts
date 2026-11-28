// hooks/useTradeAction.ts: the state behind every deck's action buttons
// (arming an action, picking posts, typed text, confirm).
import { act, renderHook } from '@testing-library/react-native';
import { useTradeAction } from '@/hooks/useTradeAction';

async function setup() {
  return (await renderHook(() => useTradeAction())).result;
}

test('starts idle with nothing picked', async () => {
  const r = await setup();
  expect([r.current.activeAction, r.current.phase, r.current.selectedPosts]).toEqual([null, 'idle', []]);
});

test('one-tap actions arm on the first tap and disarm on the second', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('stall'));
  expect([r.current.activeAction, r.current.isReady]).toEqual(['stall', true]);
  await act(() => r.current.selectAction('stall'));
  expect([r.current.activeAction, r.current.phase]).toEqual([null, 'idle']);
});

test('switching to another action starts fresh', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('barter', 0));
  await act(() => r.current.selectAction('decline'));
  expect([r.current.activeAction, r.current.selectedPosts, r.current.isReady]).toEqual(['decline', [], true]);
});

test('offer picks one post at a time: a new one replaces the old', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('offer', 2));
  expect([r.current.selectedPosts, r.current.isReady]).toEqual([[2], true]);
  await act(() => r.current.togglePost(5));
  expect(r.current.selectedPosts).toEqual([5]);
});

test('barter can pick several posts, and tapping again unpicks the top one', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('barter', 0));
  await act(() => r.current.togglePost(3));
  expect(r.current.selectedPosts).toEqual([0, 3]);
  await act(() => r.current.selectAction('barter', 3)); // the button toggles the top card
  expect([r.current.activeAction, r.current.selectedPosts]).toEqual(['barter', [0]]);
  await act(() => r.current.togglePost(0));
  expect([r.current.selectedPosts, r.current.phase]).toEqual([[], 'idle']);
});

test('a select action with no post on top arms but is not ready', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('offer', null));
  expect([r.current.activeAction, r.current.isReady]).toEqual(['offer', false]);
});

test('query needs text before it can be sent; tapping again dismisses it', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('query'));
  expect(r.current.isSubflow).toBe(true);
  await act(() => r.current.setSubflowData(''));
  expect(r.current.isReady).toBe(false);
  await act(() => r.current.setSubflowData('Still available?'));
  expect(r.current.isReady).toBe(true);
  await act(() => r.current.selectAction('query'));
  expect([r.current.activeAction, r.current.subflowData]).toEqual([null, null]);
});

test('typed text only counts for text actions', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('stall'));
  await act(() => r.current.setSubflowData('ignored'));
  expect(r.current.subflowData).toBeNull();
  await act(() => r.current.togglePost(1)); // and posts only for select actions
  expect(r.current.selectedPosts).toEqual([]);
});

test('confirm only works once ready, and reset clears everything', async () => {
  const r = await setup();
  await act(() => r.current.selectAction('query'));
  await act(() => r.current.confirm());
  expect(r.current.isConfirmed).toBe(false);
  await act(() => r.current.setSubflowData('hi'));
  await act(() => r.current.confirm());
  expect(r.current.isConfirmed).toBe(true);
  await act(() => r.current.reset());
  expect([r.current.activeAction, r.current.phase, r.current.subflowData]).toEqual([null, 'idle', null]);
});
