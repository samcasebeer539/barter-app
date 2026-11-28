// app/(tabs)/barter.tsx: the barter page. Which lists load on each tab, the
// background check while you wait on the other player (and how it backs
// off), history dropdowns, and reloading after a refused move or a block.
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Decks as recorders: the latest props of each, by game / deck type.
const mockSeen: {
  trade: Record<string, any>;
  offer: Record<string, any>;
  bar: any;
  focusCleanup?: () => void;
  onBlock?: () => void;
} = { trade: {}, offer: {}, bar: null };
jest.mock('@/components/DeckTrade', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSeen.trade[p.gameId] = p;
    return null;
  },
}));
jest.mock('@/components/DeckOffers', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSeen.offer[p.deckType] = p;
    return null;
  },
}));
jest.mock('@/components/BarBarter', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSeen.bar = p;
    return null;
  },
}));
jest.mock('@/components/TradeTurns', () => ({ __esModule: true, default: () => null }));
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    // The screen is in view until a test calls mockSeen.focusCleanup().
    useFocusEffect: (cb: () => (() => void) | void) =>
      React.useEffect(() => {
        const cleanup = cb();
        mockSeen.focusCleanup = cleanup ?? undefined;
        return cleanup;
      }, [cb]),
  };
});
jest.mock('@/lib/safety', () => ({
  onBlockChange: (fn: () => void) => {
    mockSeen.onBlock = fn;
    return () => {};
  },
}));
jest.mock('@/services/tradeService', () => ({
  ...jest.requireActual('@/services/tradeService'),
  getOpenTab: jest.fn(),
  getCloseTab: jest.fn(),
  getCloseGamesIfChanged: jest.fn(),
  getBarterGamesIfChanged: jest.fn(),
}));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));

import BarterScreen from '@/app/(tabs)/barter';
import * as trade from '@/services/tradeService';
import { ApiError } from '@/lib/apiError';

const svc = trade as jest.Mocked<typeof trade>;
const game = (id: string, extra: object = {}) =>
  ({
    gameId: id,
    phase: 'barter',
    myTurn: true,
    turnUserId: 'me',
    turnDeadline: null,
    pendingQuery: null,
    turns: [],
    player: { user: { _id: 'me', first_name: 'Alice' }, posts: [] },
    partner: { user: { _id: 'bob', first_name: 'Bob' }, posts: [] },
    ...extra,
  }) as any;
const changed = (data: any[], version: string) => ({ changed: true as const, data, version });
const same = { changed: false as const };
const closeTab = (close: any[], counts = { completed: 0, declined: 0 }, extra: object = {}) =>
  ({ close, closeVersion: `v${close.length}`, counts, ...extra }) as any;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
const wait = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
const goTo = async (tab: 'open' | 'barter' | 'close') => {
  await act(async () => {
    mockSeen.bar[{ open: 'onOffersPress', barter: 'onTradesPress', close: 'onDealsPress' }[tab]]();
  });
  await flush();
};

beforeEach(() => {
  jest.useFakeTimers();
  mockSeen.trade = {};
  mockSeen.offer = {};
  svc.getOpenTab.mockResolvedValue({ queries: [], offers: [], declined: [] });
  svc.getCloseTab.mockResolvedValue(closeTab([]));
  svc.getCloseGamesIfChanged.mockResolvedValue(same);
  svc.getBarterGamesIfChanged.mockResolvedValue(changed([], 'v0'));
});
afterEach(() => jest.useRealTimers());

async function open() {
  await render(<BarterScreen />);
  await flush();
}

// ── open tab ─────────────────────────────────────────────────────────────────

test('opens on the open tab: its three decks from one request', async () => {
  const item = { tradeId: 't', gameId: 'g', type: 'query', post: null, messages: [] };
  svc.getOpenTab.mockResolvedValue({ queries: [item], offers: [], declined: [] } as any);
  await open();
  expect(svc.getOpenTab).toHaveBeenCalledTimes(1);
  expect(Object.keys(mockSeen.offer).sort()).toEqual(['declined', 'offers', 'queries']);
  expect(mockSeen.offer.queries.posts).toEqual([item]);
  expect(svc.getBarterGamesIfChanged).not.toHaveBeenCalled();
});

test('an offer / question / rescind from a deck reloads the open tab', async () => {
  await open();
  await act(async () => {
    mockSeen.offer.offers.onActionComplete('rescind');
  });
  expect(svc.getOpenTab).toHaveBeenCalledTimes(2);
});

test('only one deck is open at a time', async () => {
  await open();
  await act(async () => {
    mockSeen.offer.queries.onToggleExpanded();
  });
  expect([mockSeen.offer.queries.expanded, mockSeen.offer.offers.expanded]).toEqual([true, false]);
  await act(async () => {
    mockSeen.offer.offers.onToggleExpanded();
  });
  expect([mockSeen.offer.queries.expanded, mockSeen.offer.offers.expanded]).toEqual([false, true]);
  await act(async () => {
    mockSeen.offer.offers.onToggleExpanded();
  });
  expect(mockSeen.offer.offers.expanded).toBe(false);
});

// ── barter tab ───────────────────────────────────────────────────────────────

test('barter tab: one deck per game; "no active trades" only once it has loaded', async () => {
  let release!: (v: any) => void;
  svc.getBarterGamesIfChanged.mockImplementationOnce(
    () =>
      new Promise(r => {
        release = r;
      }),
  );
  await open();
  await goTo('barter');
  expect(screen.queryByText(/NO ACTIVE TRADES/)).toBeNull(); // still loading
  await act(async () => {
    release(changed([], 'v0'));
  });
  expect(screen.getByText(/NO ACTIVE TRADES/)).toBeTruthy();
});

test('barter tab shows each game', async () => {
  svc.getBarterGamesIfChanged.mockResolvedValue(changed([game('g1'), game('g2')], 'v1'));
  await open();
  await goTo('barter');
  expect(Object.keys(mockSeen.trade).sort()).toEqual(['g1', 'g2']);
  expect(screen.queryByText(/NO ACTIVE TRADES/)).toBeNull();
});

test('on your own turn in every game, nothing is rechecked (only you can move)', async () => {
  svc.getBarterGamesIfChanged.mockResolvedValue(changed([game('g1', { myTurn: true })], 'v1'));
  await open();
  await goTo('barter');
  await wait(120_000);
  expect(svc.getBarterGamesIfChanged).toHaveBeenCalledTimes(1);
});

test('waiting on the other player: rechecks every 5s, backing off to once a minute while nothing changes', async () => {
  svc.getBarterGamesIfChanged
    .mockResolvedValueOnce(changed([game('g1', { myTurn: false })], 'v1'))
    .mockResolvedValue(same);
  await open();
  await goTo('barter');
  const calls = () => svc.getBarterGamesIfChanged.mock.calls.length;
  const gaps = [5_000, 10_000, 20_000, 40_000, 60_000, 60_000];
  for (const gap of gaps) {
    const before = calls();
    await wait(gap - 1);
    expect(calls()).toBe(before); // not yet
    await wait(1);
    expect(calls()).toBe(before + 1); // now
  }
  expect(svc.getBarterGamesIfChanged).toHaveBeenLastCalledWith('v1'); // "only if changed since v1"
});

test('a change (their move) goes back to checking every 5s', async () => {
  const waiting = [game('g1', { myTurn: false })];
  svc.getBarterGamesIfChanged
    .mockResolvedValueOnce(changed(waiting, 'v1'))
    .mockResolvedValueOnce(same)
    .mockResolvedValueOnce(same) // 5s, then 10s: nothing
    .mockResolvedValueOnce(changed(waiting, 'v2')) // 20s: they moved
    .mockResolvedValue(same);
  await open();
  await goTo('barter');
  await wait(5_000);
  await wait(10_000);
  await wait(20_000);
  const before = svc.getBarterGamesIfChanged.mock.calls.length;
  await wait(5_000);
  expect(svc.getBarterGamesIfChanged.mock.calls.length).toBe(before + 1);
  expect(svc.getBarterGamesIfChanged).toHaveBeenLastCalledWith('v2');
});

test('agreed deals have no turns, so they are not rechecked', async () => {
  svc.getBarterGamesIfChanged.mockResolvedValue(changed([game('g1', { myTurn: false, phase: 'agreed' })], 'v1'));
  await open();
  await goTo('barter');
  await wait(60_000);
  expect(svc.getBarterGamesIfChanged).toHaveBeenCalledTimes(1);
});

test('leaving the screen stops the checks', async () => {
  svc.getBarterGamesIfChanged
    .mockResolvedValueOnce(changed([game('g1', { myTurn: false })], 'v1'))
    .mockResolvedValue(same);
  await open();
  await goTo('barter');
  await act(async () => {
    mockSeen.focusCleanup?.();
  });
  await wait(120_000);
  expect(svc.getBarterGamesIfChanged).toHaveBeenCalledTimes(1);
});

test('a refused move says why, then reloads so the deck matches the server', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  svc.getBarterGamesIfChanged.mockResolvedValue(changed([game('g1')], 'v1'));
  await open();
  await goTo('barter');
  await act(async () => {
    mockSeen.trade.g1.onActionFailed(
      'stall',
      new ApiError("It's not your turn (action 'stall' in phase 'barter')", 403),
    );
  });
  expect(alert).toHaveBeenCalledWith(
    "That move didn't go through",
    "It's not your turn anymore. Refresh to see the latest.",
  );
  expect(svc.getBarterGamesIfChanged).toHaveBeenCalledTimes(2);
});

// ── close tab ────────────────────────────────────────────────────────────────

test('close tab: games and history counts; history lists load on first open only', async () => {
  svc.getCloseTab.mockResolvedValue(
    closeTab(
      [game('c1', { phase: 'close' })],
      { completed: 2, declined: 0 },
      { completed: [game('h1', { phase: 'completed' }), game('h2', { phase: 'completed' })], declined: [] },
    ),
  );
  await open();
  await goTo('close');
  expect(svc.getCloseTab).toHaveBeenLastCalledWith(false);
  expect(Object.keys(mockSeen.trade)).toEqual(['c1']);
  expect(screen.getByText('02')).toBeTruthy();

  await fireEvent.press(screen.getByText('ACCEPTED TRADES'));
  await flush();
  expect(svc.getCloseTab).toHaveBeenLastCalledWith(true);
  expect(Object.keys(mockSeen.trade).sort()).toEqual(['c1', 'h1', 'h2']);
  expect(mockSeen.trade.h1).toMatchObject({ isMyTurn: false, actions: [] }); // read-only

  const loads = svc.getCloseTab.mock.calls.length;
  await fireEvent.press(screen.getByText('ACCEPTED TRADES')); // close
  await fireEvent.press(screen.getByText('ACCEPTED TRADES')); // reopen: already loaded
  expect(svc.getCloseTab.mock.calls.length).toBe(loads);
});

test('the close check reloads the whole tab when a game leaves the list (history counts change)', async () => {
  svc.getCloseTab
    .mockResolvedValueOnce(closeTab([game('c1', { myTurn: false, phase: 'close' }), game('c2', { phase: 'close' })]))
    .mockResolvedValue(closeTab([game('c2', { phase: 'close' })], { completed: 0, declined: 1 }));
  svc.getCloseGamesIfChanged.mockResolvedValueOnce(changed([game('c2', { phase: 'close' })], 'v1'));
  await open();
  await goTo('close');
  await wait(5_000);
  expect(svc.getCloseGamesIfChanged).toHaveBeenCalledWith('v2');
  expect(svc.getCloseTab).toHaveBeenCalledTimes(2); // the full reload
  expect(Object.keys(mockSeen.trade)).toContain('c2');
});

test('blocking someone reloads every tab', async () => {
  await open();
  await act(async () => {
    mockSeen.onBlock?.();
  });
  expect([
    svc.getOpenTab.mock.calls.length,
    svc.getBarterGamesIfChanged.mock.calls.length,
    svc.getCloseTab.mock.calls.length,
  ]).toEqual([2, 1, 1]);
});
