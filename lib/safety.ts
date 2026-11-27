// lib/safety.ts
//
// Blocking and reporting other players. A block hides each of you from the
// other (feed, search, profiles), stops offers and questions between you,
// and declines your ongoing trades; reports are saved for review.
import { Alert } from 'react-native';
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
