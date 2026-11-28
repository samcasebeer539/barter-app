import { OpenTradeItem, Post, User, Locations, QueryMessage } from '@/types';
import { getAuth } from 'firebase/auth';
import { TradeTurn } from '@/components/TradeTurns';

import { apiJson, apiJsonIfChanged, IfChanged } from '@/lib/api';

export interface TradeWriteResult {
    success: boolean;
    gameId: string;
    tradeId?: string;
}

// Every trade write: a JSON POST that throws on a non-2xx answer (with the
// server's message, e.g. "It's not your turn") so callers' catch blocks see
// refused moves.
function postTrade(path: string, body: unknown): Promise<TradeWriteResult> {
    return apiJson<TradeWriteResult>(path, { method: 'POST', body });
}

export function sendOffer(targetPostId: string) {
    return postTrade('/dev/trades/offer', { targetPostId });
}

export function rescindOffer(targetPostId: string) {
    return postTrade('/dev/trades/rescind', { targetPostId });
}

export function sendBarter(gameId: string, selectedPostIds: string[]) {
    return postTrade('/dev/trades/barter', { gameId, selectedPostIds });
}

function normalizePost(raw: any): Post {
    return {
        _id: raw._id,
        name: raw.post_title ?? raw.name,
        description: raw.description,
        photos: raw.photos ?? [],
        date_posted: raw.date_posted,
    };
}

function normalizeMessage(raw: any): QueryMessage {
    return {
        message: raw.message,
        senderId: raw.sender_id,
        createdAt: raw.created_at,
    };
}

function normalizeTradeItem(raw: any): OpenTradeItem {
    return {
        tradeId: raw._id,
        gameId: raw.game_id,
        type: raw.type,
        post: raw.post ? normalizePost(raw.post) : null,
        actorId: raw.actor_id,
        messages: (raw.messages ?? []).map(normalizeMessage),
        rawTurns: raw.turns,
        myId: raw.my_id,
        partnerName: raw.partner_name,
        turnPosts: (raw.turn_posts ?? []).map(normalizePost),
    };
}
export function getCurrentUserId(): string | undefined {
  return getAuth().currentUser?.uid;
}

export function acceptTrade(gameId: string) {
    return postTrade('/dev/trades/trade_details/accept', { gameId });
}

export function declineTrade(gameId: string) {
    return postTrade('/dev/trades/trade_details/decline', { gameId });
}

// Skip your turn: the game stays in its phase and the turn passes to the partner.
export function stallTrade(gameId: string) {
    return postTrade('/dev/trades/stall', { gameId });
}

// Everything the barter page's OPEN tab shows, in one request.
export interface OpenTabData {
    queries: OpenTradeItem[];
    offers: OpenTradeItem[];
    declined: OpenTradeItem[];
}
export async function getOpenTab(): Promise<OpenTabData> {
    const data = await apiJson('/dev/trades/open_tab');
    return {
        queries: groupQueryItems((data.queries ?? []).map(normalizeTradeItem)),
        offers: (data.offers ?? []).map(normalizeTradeItem),
        declined: (data.declined ?? []).map(normalizeTradeItem),
    };
}

// Everything the CLOSE tab shows, in one request: games settling where/when
// (plus agreed deals) and how many ACCEPTED / DECLINED TRADES there are.
// With withHistory (once a history dropdown has been opened), also those
// two lists in full.
export interface CloseTabData {
    close: BarterGame[];
    /** The close list's version, for getCloseGamesIfChanged. */
    closeVersion: string;
    counts: { completed: number; declined: number };
    completed?: BarterGame[];
    declined?: BarterGame[];
}
export async function getCloseTab(withHistory: boolean): Promise<CloseTabData> {
    const data = await apiJson(`/dev/trades/close_tab${withHistory ? '?history=1' : ''}`);
    return {
        close: data.close ?? [],
        closeVersion: data.closeVersion ?? '',
        counts: data.counts ?? { completed: 0, declined: 0 },
        completed: data.completed,
        declined: data.declined,
    };
}

// Background checks: send the version of the list you already have. If it
// hasn't changed the server answers 204 with no body.
export type { IfChanged };

function getGamesIfChanged(path: string, knownVersion: string): Promise<IfChanged<BarterGame[]>> {
    return apiJsonIfChanged<BarterGame[]>(path, knownVersion);
}

/** BARTER tab games, or { changed: false } if you already have this version. */
export function getBarterGamesIfChanged(knownVersion: string) {
    return getGamesIfChanged('/dev/trades/barter', knownVersion);
}

/** CLOSE tab games (no history), or { changed: false } if unchanged. */
export function getCloseGamesIfChanged(knownVersion: string) {
    return getGamesIfChanged('/dev/trades/close', knownVersion);
}

export function sendQuery(targetPostId: string, message: string) {
  return postTrade('/dev/trades/query', { targetPostId, message });
}

// Answer a question the other player asked. For an in-game question this
// unlocks your turn (it doesn't use it up).
export function answerQuery(queryId: string, message: string) {
  return postTrade('/dev/trades/answer', { queryId, message });
}

// REVIEW: rate the other player 1-5 stars (text optional) once the deal is
// agreed. When both players have reviewed, the trade is completed.
export function submitReview(gameId: string, rating: number, text: string) {
  return postTrade('/dev/trades/review', { gameId, rating, text });
}

// ADD: bring one of the partner's posts into the trade (barter phase).
// Passes the turn to the partner.
export function addPost(gameId: string, postId: string) {
  return postTrade('/dev/trades/add', { gameId, postId });
}

// SUBTRACT: take one of your own items out of the trade (barter phase).
// Passes the turn to the partner.
export function subtractPost(gameId: string, postId: string) {
  return postTrade('/dev/trades/subtract', { gameId, postId });
}

// WHEN: propose a meetup date and time (close phase). proposedAt is an ISO
// timestamp; label is how it reads, e.g. "Mon, Nov 24 at 3:00 PM". Passes
// the turn to the partner.
export function proposeTime(gameId: string, proposedAt: string, label: string) {
  return postTrade('/dev/trades/when', { gameId, proposedAt, label });
}

// WHERE: propose one of your saved locations as the meeting spot (close
// phase). Passes the turn to the partner.
export function proposeLocation(gameId: string, locationId: string) {
  return postTrade('/dev/trades/where', { gameId, locationId });
}

// A query played as a turn inside a game (trade deck). Passes the turn to the
// partner. targetPostId, if given, must be one of the partner's cards.
export function sendGameQuery(gameId: string, message: string, targetPostId?: string) {
  return postTrade('/dev/trades/query', { gameId, message, targetPostId });
}

// ── Incoming offers (for ProfileScreen) ─────────────────────────────────────

/** A question and its answer (null until answered). */
export interface QueryThread {
  tradeId: string;
  question: string;
  answer: string | null;
}

export interface IncomingOffer {
  gameId: string;
  targetPostId: string;
  fromUserId: string;
  fromUserName: string;
  /** Your own questions to the offerer, oldest first. */
  myQueries?: QueryThread[];
}

export function getIncomingOffers(): Promise<IncomingOffer[]> {
  return apiJson('/dev/trades/incoming');
}

export interface BarterGame {
  gameId: string;
  /** 'barter', 'close', 'agreed' (both accepted the meetup), or finished: 'completed' / 'declined'. */
  phase: string;
  turnUserId: string;
  myTurn: boolean;
  /** ISO timestamp the active player's turn runs out; the game auto-declines after. */
  turnDeadline: string | null;
  /** A question the partner asked that you must answer before your turn begins. */
  pendingQuery: { tradeId: string; message: string } | null;
  player: { user: User; posts: Post[] };
  partner: { user: User; posts: Post[] };
  turns: any[];
}

// The standing WHERE / WHEN proposals in a game: only the latest of each
// counts, whoever made it. A newer proposal replaces the older one.
export interface LatestProposals {
  where: { isUser: boolean; location: Locations } | null;
  when: { isUser: boolean; label: string } | null;
}

export function getLatestProposals(rawTurns: any[], currentUserId: string): LatestProposals {
  const latest: LatestProposals = { where: null, when: null };
  for (const t of rawTurns) {   // oldest first, so later ones overwrite
    const isUser = t.actor_id === currentUserId;
    if (t.type === 'where' && t.location) latest.where = { isUser, location: t.location };
    if (t.type === 'when' && t.proposed_time) latest.when = { isUser, label: t.proposed_time };
  }
  return latest;
}

export function resolvePostName(postId: string | undefined, posts: Post[]): string {
  if (!postId) return '';
  return posts.find(p => p._id === postId)?.name ?? '';
}

export function buildTradeTurns(
  rawTurns: any[],
  currentUserId: string,
  partnerFirstName: string,
  allPosts: Post[]
): TradeTurn[] {
  return rawTurns
    .map((t): TradeTurn | TradeTurn[] | null => {
      const isUser = t.actor_id === currentUserId;
      const user = isUser ? undefined : partnerFirstName;

      switch (t.type) {
        case 'query': {
            const question = t.messages?.[0]?.message ?? '';
            const about = resolvePostName(t.target_post_id, allPosts);
            const asked: TradeTurn = {
                type: 'turnQuery',
                user,
                item: about ? `${question} (${about})` : question,
                isUser,
            };
            // The answer, if any, is the next message in the thread, from
            // the other player.
            const answer = (t.messages ?? []).slice(1).find((m: any) => m.sender_id !== t.actor_id);
            if (!answer) return asked;
            const answeredByUser = answer.sender_id === currentUserId;
            // Listed answer-first because the log is reversed to newest-first
            // below; this keeps the answer directly under its question.
            return [{
                type: 'turnAnswer',
                user: answeredByUser ? undefined : partnerFirstName,
                item: answer.message,
                isUser: answeredByUser,
            }, asked];
        }
        case 'offer':
          return {
            type: 'turnOffer',
            user,
            item: resolvePostName(t.target_post_id, allPosts),
            isUser,
          };

        case 'barter':
            return {
                type: 'turnBarter',
                user,
                item: (t.selected_post_ids ?? [])
                .map((id: string) => resolvePostName(id, allPosts))
                .filter(Boolean)
                .join(', '),
                isUser,
            };

        case 'stall':
          return { type: 'turnStall', user, isUser };

        case 'subtract':
          return { type: 'turnSubtract', user, item: t.post_name ?? '', isUser };

        case 'add':
          return { type: 'turnAdd', user, item: t.post_name ?? '', isUser };

        case 'review': {
          const stars = '★'.repeat(t.rating ?? 0) + '☆'.repeat(5 - (t.rating ?? 0));
          return { type: 'turnReview', user, item: t.text ? `${stars} "${t.text}"` : stars, isUser };
        }

        case 'accept':
          // The close-phase ACCEPT is marked final; barter's is *ACCEPT.
          return { type: t.final ? 'turnAcceptFinal' : 'turnAccept', user, isUser };

        case 'acceptFinal':
          return { type: 'turnAcceptFinal', user, isUser };

        case 'decline':
          return { type: 'turnDecline', user, isUser };

        case 'where':
          return { type: 'turnWhere', user, item: t.location_name ?? '', isUser };

        case 'when':
          return { type: 'turnWhen', user, item: t.proposed_time ?? '', isUser };

        default:
          return null;
      }
    })
    .flat()
    .filter((t): t is TradeTurn => t !== null)
    .reverse();
}


export interface IncomingQuery {
  /** The query's id; pass to answerQuery. */
  tradeId: string;
  gameId: string;
  targetPostId: string;
  fromUserId: string;
  fromUserName: string;
  itemName: string;
  question: string;
}

export function getIncomingQueries(): Promise<IncomingQuery[]> {
  return apiJson('/dev/trades/incoming_queries');
}

export function buildQueryTurns(item: OpenTradeItem): TradeTurn[] {
  const postName = item.post?.name ?? '';
  const messages = item.messages ?? [];

  // Group each question with the answer that follows it, then put the
  // newest question first. The answer stays directly under its question.
  const groups: TradeTurn[][] = [];
  for (const m of messages) {
    if (m.senderId === item.actorId) {
      groups.push([{ type: 'turnQuery', item: m.message, isUser: true }]);
    } else if (groups.length > 0) {
      groups[groups.length - 1].push({ type: 'turnAnswer', user: 'They', item: m.message, isUser: false });
    }
  }
  return groups.reverse().flat();
}

function groupQueryItems(items: OpenTradeItem[]): OpenTradeItem[] {
  const byGameId = new Map<string, OpenTradeItem>();

  for (const item of items) {
    const existing = byGameId.get(item.gameId);
    if (!existing) {
      byGameId.set(item.gameId, { ...item, messages: [...(item.messages ?? [])] });
    } else {
      existing.messages = [...(existing.messages ?? []), ...(item.messages ?? [])];
    }
  }

  return Array.from(byGameId.values()).map(item => ({
    ...item,
    messages: [...(item.messages ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }));
}

export function buildOfferTurns(item: OpenTradeItem): TradeTurn[] {
  const postName = item.post?.name ?? '';
  return [{
    type: 'turnOffer',
    item: postName,
    isUser: true,
  }];
}