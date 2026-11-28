import { FeedItem, FeedProfile } from '@/types/index';
import { apiJson } from '@/lib/api';
import { toFeedProfile } from './offererService';

// Server post (with distance_mi) -> feed tile.
function toFeedItem(p: any): FeedItem {
  return {
    id: p._id,
    title: p.post_title,
    image: p.photos?.[0] ?? '',
    date_posted: p.date_posted ?? '',
    distanceMi: typeof p.distance_mi === 'number' ? p.distance_mi : null,
  };
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export type FeedSort = 'nearest' | 'farthest' | 'newest' | 'oldest';

/** Posts per page (the feed loads the next page as you near the bottom). */
export const FEED_PAGE_SIZE = 24;

export interface FeedPage {
  items: FeedItem[];
  /** Where the next page starts, or null if this was the last one. */
  nextOffset: number | null;
}

/** A page of the feed (or of a search, with `query`), sorted on the server. */
export async function getFeedPage(
  { sort, offset = 0, query = '' }: { sort: FeedSort; offset?: number; query?: string },
): Promise<FeedPage> {
  const params = `sort=${sort}&limit=${FEED_PAGE_SIZE}&offset=${offset}`;
  const path = query
    ? `/dev/feed/search?q=${encodeURIComponent(query)}&${params}`
    : `/dev/feed?${params}`;
  const data = await apiJson<{ posts: any[]; nextOffset: number | null }>(path);
  return { items: (data.posts ?? []).map(toFeedItem), nextOffset: data.nextOffset ?? null };
}

// ─── Profile for a tapped post ───────────────────────────────────────────────

export async function getFeedProfile(postId: string): Promise<FeedProfile> {
  const data = await apiJson(`/dev/feed/${postId}`);
  return { ...toFeedProfile(data), tappedPostId: data.tapped_post_id };
}

// for profile deck offerer
export async function getOffererProfile(offeredPostId: string): Promise<FeedProfile> {
  return getFeedProfile(offeredPostId);
}
