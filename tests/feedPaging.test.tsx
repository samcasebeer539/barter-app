// Feed paging: the feed service asks the server for pages; the feed screen
// shows the first page, adds the next as you near the bottom, and starts
// over when the sort or search changes.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/lib/api', () => ({ apiJson: jest.fn() }));
jest.mock('@/lib/safety', () => ({ onBlockChange: () => () => {} }));
jest.mock('@/components/DeckFeed', () => ({ __esModule: true, default: () => null }));
const mockBar: Record<string, any> = {};
jest.mock('@/components/BarFeed', () => ({
  __esModule: true,
  default: (p: any) => {
    Object.assign(mockBar, p);
    return null;
  },
}));
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  const Image = (props: any) => <View {...props} />;
  Image.prefetch = async () => true;
  Image.loadAsync = async () => ({ width: 100, height: 100, release() {} });
  return { Image };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons', () => ({ FontAwesome6: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));

import { apiJson } from '@/lib/api';
import { getFeedPage, FEED_PAGE_SIZE } from '@/services/feedService';
import FeedScreen from '@/app/(tabs)/feed';

const api = apiJson as jest.Mock;
const serverPost = (n: number) => ({
  _id: `p${n}`,
  post_title: `Post ${n}`,
  photos: [],
  date_posted: '',
  distance_mi: n,
});
const serverPage = (from: number, count: number, nextOffset: number | null) => ({
  posts: Array.from({ length: count }, (_, i) => serverPost(from + i)),
  nextOffset,
});

beforeEach(() => api.mockReset());

// ── the service ──────────────────────────────────────────────────────────────

test('asks for a sorted page and reads the answer', async () => {
  api.mockResolvedValue(serverPage(0, 2, 24));
  const page = await getFeedPage({ sort: 'nearest' });
  expect(api).toHaveBeenCalledWith(`/dev/feed?sort=nearest&limit=${FEED_PAGE_SIZE}&offset=0`);
  expect(page.nextOffset).toBe(24);
  expect(page.items[0]).toEqual({ id: 'p0', title: 'Post 0', image: '', date_posted: '', distanceMi: 0 });
});

test('a search is paged the same way', async () => {
  api.mockResolvedValue(serverPage(0, 0, null));
  await getFeedPage({ sort: 'oldest', offset: 48, query: 'desk lamp' });
  expect(api).toHaveBeenCalledWith(`/dev/feed/search?q=desk%20lamp&sort=oldest&limit=${FEED_PAGE_SIZE}&offset=48`);
});

// ── the screen ───────────────────────────────────────────────────────────────

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0));
  });
const scrollToBottom = async () => {
  await fireEvent.scroll(screen.getByTestId('feed-scroll'), {
    nativeEvent: { contentOffset: { y: 2000 }, layoutMeasurement: { height: 800 }, contentSize: { height: 2400 } },
  });
  await flush();
};
const shown = () => screen.queryAllByText(/^Post \d+$/).map(n => n.props.children);

test('shows the first page, nearest first', async () => {
  api.mockResolvedValueOnce(serverPage(0, 24, 24));
  await render(<FeedScreen />);
  await flush();
  expect(api).toHaveBeenCalledWith(expect.stringContaining('sort=nearest&limit=24&offset=0'));
  expect(shown()).toHaveLength(24);
});

test('near the bottom it adds the next page, once, until there are no more', async () => {
  api.mockResolvedValueOnce(serverPage(0, 24, 24)).mockResolvedValueOnce(serverPage(24, 10, null));
  await render(<FeedScreen />);
  await flush();
  await scrollToBottom();
  expect(api).toHaveBeenLastCalledWith(expect.stringContaining('offset=24'));
  expect(shown()).toHaveLength(34);
  await scrollToBottom(); // that was the last page: nothing more to ask for
  expect(api).toHaveBeenCalledTimes(2);
});

test('scrolling while a page is loading asks for it only once', async () => {
  let release!: (v: unknown) => void;
  api.mockResolvedValueOnce(serverPage(0, 24, 24)).mockImplementationOnce(
    () =>
      new Promise(r => {
        release = r;
      }),
  );
  await render(<FeedScreen />);
  await flush();
  await scrollToBottom();
  await scrollToBottom();
  expect(api).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('feed-loading-more')).toBeTruthy();
  await act(async () => {
    release(serverPage(24, 3, null));
  });
  await flush();
  expect(screen.queryByTestId('feed-loading-more')).toBeNull();
  expect(shown()).toHaveLength(27);
});

test("a post that shifted onto the next page isn't shown twice", async () => {
  api.mockResolvedValueOnce(serverPage(0, 24, 24)).mockResolvedValueOnce(serverPage(23, 3, null)); // p23 again
  await render(<FeedScreen />);
  await flush();
  await scrollToBottom();
  expect(shown()).toHaveLength(26);
  expect(shown().filter(t => t === 'Post 23')).toHaveLength(1);
});

test('changing the sort starts over from the first page', async () => {
  api
    .mockResolvedValueOnce(serverPage(0, 24, 24))
    .mockResolvedValueOnce(serverPage(24, 24, 48))
    .mockResolvedValueOnce(serverPage(100, 24, 24));
  await render(<FeedScreen />);
  await flush();
  await scrollToBottom();
  await act(async () => {
    mockBar.onSortPress();
  });
  await fireEvent.press(screen.getByText('Newest'));
  await flush();
  expect(api).toHaveBeenLastCalledWith(expect.stringContaining('sort=newest&limit=24&offset=0'));
  expect(shown()).toHaveLength(24);
  expect(shown()[0]).toBe('Post 100');
});

test('a search starts over too, and its next page stays in the search', async () => {
  api
    .mockResolvedValueOnce(serverPage(0, 24, 24))
    .mockResolvedValueOnce(serverPage(50, 24, 24))
    .mockResolvedValueOnce(serverPage(74, 2, null));
  await render(<FeedScreen />);
  await flush();
  await act(async () => {
    await mockBar.onSearchSubmit('lamp');
  });
  await flush();
  expect(api).toHaveBeenLastCalledWith(
    expect.stringMatching(/^\/dev\/feed\/search\?q=lamp&sort=nearest&limit=24&offset=0$/),
  );
  await scrollToBottom();
  expect(api).toHaveBeenLastCalledWith(expect.stringMatching(/^\/dev\/feed\/search\?q=lamp&.*offset=24$/));
  expect(shown()).toHaveLength(26);
});
