// lib/safety.ts
//
// Blocking and reporting other players. A block hides each of you from the
// other (feed, search, profiles), stops offers and questions between you,
// and declines your ongoing trades; reports are saved for review.
import { Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { apiJson } from './api';
import { toFeedProfile } from '@/services/offererService';
import { User } from '@/types/index';

export type ReportReason = 'spam' | 'scam' | 'inappropriate' | 'harassment' | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'scam', label: 'Scam or fraud' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'other', label: 'Other' },
];

// ── Who you've blocked, cached for the session ───────────────────────────
// Loaded once (the first time a card asks), then kept up to date by
// blockUser / unblockUser. Screens that show other players listen for
// changes and reload.
let blockedIds: Set<string> | null = null;
let loading: Promise<void> | null = null;
type BlockListener = (userId: string, blocked: boolean) => void;
const blockListeners = new Set<BlockListener>();

/** Forget who's blocked (signing out: that was someone else's list). */
export function clearBlockedCache() {
  blockedIds = null;
  loading = null;
}

/** Called after any block or unblock (screens reload their lists). */
export function onBlockChange(listener: BlockListener): () => void {
  blockListeners.add(listener);
  return () => {
    blockListeners.delete(listener);
  };
}

function setBlocked(userId: string, blocked: boolean) {
  if (blockedIds) {
    if (blocked) blockedIds.add(userId);
    else blockedIds.delete(userId);
  }
  blockListeners.forEach(listener => listener(userId, blocked));
}

/** The people you've blocked, as users (for their cards). */
export async function getBlockedUsers(): Promise<User[]> {
  const data = await apiJson<any[]>('/dev/blocked');
  const users = data.map(u => toFeedProfile({ user: u, posts: [] }).user as User);
  blockedIds = new Set(users.map(u => u._id!).filter(Boolean));
  return users;
}

function ensureBlockedLoaded(): Promise<void> {
  if (blockedIds) return Promise.resolve();
  if (!loading) {
    loading = getBlockedUsers()
      .then(() => undefined)
      .catch(err => {
        console.warn('Failed to load blocked users:', err);
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

/** Whether you've blocked this user; updates when you block / unblock. */
export function useIsBlocked(userId?: string): boolean {
  const [blocked, setBlockedState] = useState(() => !!userId && !!blockedIds?.has(userId));
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    ensureBlockedLoaded().then(() => {
      if (alive) setBlockedState(!!blockedIds?.has(userId));
    });
    const off = onBlockChange((id, isBlocked) => {
      if (id === userId) setBlockedState(isBlocked);
    });
    return () => {
      alive = false;
      off();
    };
  }, [userId]);
  return blocked;
}

export async function blockUser(userId: string): Promise<void> {
  await apiJson('/dev/block', { method: 'POST', body: { userId } });
  setBlocked(userId, true);
}

export async function unblockUser(userId: string): Promise<void> {
  await apiJson(`/dev/block/${userId}`, { method: 'DELETE' });
  setBlocked(userId, false);
}

/** Saves a report; resolves to the reported user's id. */
export async function report(params: {
  userId?: string;
  postId?: string;
  reason: ReportReason;
  note?: string;
}): Promise<string> {
  const res = await apiJson<{ reportedUserId: string }>('/dev/report', { method: 'POST', body: params });
  return res.reportedUserId;
}

/** Asks first, then unblocks. */
export function confirmUnblock(userId: string, name: string, onUnblocked?: () => void) {
  Alert.alert(
    `Unblock ${name}?`,
    "You'll see each other's posts again and can trade. Trades declined when you blocked them stay declined.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => {
          unblockUser(userId)
            .then(() => onUnblocked?.())
            .catch(err => Alert.alert("Couldn't unblock", err instanceof Error ? err.message : String(err)));
        },
      },
    ],
  );
}

/** Asks first, then blocks. `name` is how the user is shown ("Sam"). */
export function confirmBlock(userId: string, name: string, onBlocked?: () => void) {
  Alert.alert(
    `Block ${name}?`,
    "You won't see each other's posts or be able to send each other offers or questions. " +
      'Any trades between you will be declined. You can unblock them in Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          blockUser(userId)
            .then(() => onBlocked?.())
            .catch(err => Alert.alert("Couldn't block", err instanceof Error ? err.message : String(err)));
        },
      },
    ],
  );
}

/** Report a user or one of their posts with the system alerts (like
 *  blocking): pick a reason, optionally add details (iOS), then it offers
 *  to block them too. `name` is how they're shown ("Sam"). */
export function startReport(target: { userId?: string; postId?: string; name?: string }) {
  const who = target.name || 'this user';

  const send = (reason: ReportReason, note?: string) => {
    report({ userId: target.userId, postId: target.postId, reason, note: note?.trim() || undefined })
      .then(reportedUserId => {
        Alert.alert('Thanks for reporting', "We'll review it. Do you also want to block them?", [
          { text: 'Not now', style: 'cancel' },
          { text: `Block ${who}`, style: 'destructive', onPress: () => confirmBlock(reportedUserId, who) },
        ]);
      })
      .catch(err => Alert.alert("Couldn't send the report", err instanceof Error ? err.message : String(err)));
  };

  // Details: iOS has a text-entry alert; Android sends without. Cancel
  // drops the report. For "Other" the details are the point, so there's no
  // Skip.
  const askForDetails = (reason: ReportReason) => {
    if (Platform.OS !== 'ios') return send(reason);
    const isOther = reason === 'other';
    Alert.prompt(
      isOther ? "What's wrong?" : 'Add details?',
      isOther ? 'Tell us what happened.' : 'Optional. Anything that would help us review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(isOther ? [] : [{ text: 'Skip', onPress: () => send(reason) }]),
        { text: 'Send', onPress: (note?: string) => send(reason, note) },
      ],
      'plain-text',
    );
  };

  Alert.alert(target.postId ? 'Report this post' : `Report ${who}`, 'Why are you reporting this?', [
    ...REPORT_REASONS.map(r => ({ text: r.label, onPress: () => askForDetails(r.key) })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}
