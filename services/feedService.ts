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

export async function getFeedPosts(): Promise<FeedItem[]> {
  const data = await apiJson<any[]>('/dev/feed');
  return data.map(toFeedItem);
}

export async function searchFeedPosts(query: string): Promise<FeedItem[]> {
  const data = await apiJson<any[]>(`/dev/feed/search?q=${encodeURIComponent(query)}`);
  return data.map(toFeedItem);
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
