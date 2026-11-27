// lib/safety.ts
//
// Blocking and reporting other players. A block hides each of you from the
// other (feed, search, profiles), stops offers and questions between you,
// and declines your ongoing trades; reports are saved for review.
import { Alert, Platform } from 'react-native';
import { apiJson } from './api';

export type ReportReason = 'spam' | 'scam' | 'inappropriate' | 'harassment' | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'scam', label: 'Scam or fraud' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'other', label: 'Other' },
];

export interface BlockedUser {
  _id: string;
  first_name: string;
  last_name: string;
  profile_photo: string;
}

// ── Screens that show other players listen here and reload after a block ──
type BlockListener = (userId: string) => void;
const blockListeners = new Set<BlockListener>();
export function onUserBlocked(listener: BlockListener): () => void {
  blockListeners.add(listener);
  return () => { blockListeners.delete(listener); };
}

export async function blockUser(userId: string): Promise<void> {
  await apiJson('/dev/block', { method: 'POST', body: { userId } });
  blockListeners.forEach(listener => listener(userId));
}

export async function unblockUser(userId: string): Promise<void> {
  await apiJson(`/dev/block/${userId}`, { method: 'DELETE' });
}

export function getBlockedUsers(): Promise<BlockedUser[]> {
  return apiJson('/dev/blocked');
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

  // Optional details: iOS has a text-entry alert; Android sends without.
  const askForDetails = (reason: ReportReason) => {
    if (Platform.OS !== 'ios') return send(reason);
    Alert.prompt(
      'Add details?',
      'Optional. Anything that would help us review it.',
      [
        { text: 'Skip', onPress: () => send(reason) },
        { text: 'Send', onPress: (note?: string) => send(reason, note) },
      ],
      'plain-text',
    );
  };

  Alert.alert(
    target.postId ? 'Report this post' : `Report ${who}`,
    'Why are you reporting this?',
    [
      ...REPORT_REASONS.map(r => ({ text: r.label, onPress: () => askForDetails(r.key) })),
      { text: 'Cancel', style: 'cancel' as const },
    ],
  );
}
