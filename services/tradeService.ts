import { OpenTradeItem, Post, User } from '@/types';
import { getAuth } from 'firebase/auth';
import { TradeTurn } from '@/components/TradeTurns';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
    const token = await getAuth().currentUser?.getIdToken();
    return { Authorization: `Bearer ${token}` };
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
    };
}
export function getCurrentUserId(): string | undefined {
  return getAuth().currentUser?.uid;
}

export async function getOpenTrade(): Promise<OpenTradeItem[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/dev/trades/open`, { headers });

    const text = await res.text();
    console.log('open trades raw:', text);
    const data = JSON.parse(text);
    return data.map(normalizeTradeItem);
}

export async function getBarterTrade() {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/dev/trades/barter`, {headers});

    return res.json();
}

export async function getClosedTrade() {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/dev/trades/closed`, {headers});

    return res.json();
}

export async function acceptTrade(gameId: string) {
    const headers = await getAuthHeader();
    return fetch(
        `${BASE_URL}/dev/trades/trade_details/accept`,
        {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId }),
        }
    );
}

export async function declineTrade(gameId: string) {
    const headers = await getAuthHeader();
    return fetch(
        `${BASE_URL}/dev/trades/trade_details/decline`,
        {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId }),
        }
    );
}

export async function getGame(gameId: string) {
    const headers = await getAuthHeader();
    const res = await fetch(
        `${BASE_URL}/dev/trades/trade_details/get_trade?gameId=${gameId}`,
        { headers }
    );
    return res.json();
}

export async function sendMessage(tradeId: string, message: string) {
    const headers = await getAuthHeader();
    return fetch(
        `${BASE_URL}/dev/trades/trade_details/message/${tradeId}`,
        {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message }),
        }
    );
}

export async function getQuery(): Promise<OpenTradeItem[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/dev/trades/query`, {
        method: 'GET',
        headers,
    });

    const text = await res.text();
    console.log('queries raw:', text);
    const data = JSON.parse(text);
    return groupQueryItems(data.map(normalizeTradeItem));
}

export async function sendQuery(targetPostId: string, message: string) {
  const headers = await getAuthHeader();
  return fetch(`${BASE_URL}/dev/trades/query`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetPostId, message }),
  });
}

// ── Incoming offers (for ProfileScreen) ─────────────────────────────────────

export interface IncomingOffer {
  gameId: string;
  targetPostId: string;
  fromUserId: string;
  fromUserName: string;
}

export async function getIncomingOffers(): Promise<IncomingOffer[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/dev/trades/incoming`, { headers });
  const text = await res.text();
  return JSON.parse(text);
}

export interface BarterGame {
  gameId: string;
  turnUserId: string;
  myTurn: boolean;
  player: { user: User; posts: Post[] };
  partner: { user: User; posts: Post[] };
  turns: any[];
}

export async function getBarterGames(): Promise<BarterGame[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/dev/trades/barter`, { headers });
  const text = await res.text();
  return JSON.parse(text);
}

function resolvePostName(postId: string | undefined, posts: Post[]): string {
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
    .map((t): TradeTurn | null => {
      const isUser = t.actor_id === currentUserId;
      const user = isUser ? undefined : partnerFirstName;

      switch (t.type) {
        case 'query':
            return {
                type: 'turnQuery',
                user,
                item: t.messages?.[0]?.message ?? '',
                
                isUser,
            };
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

        case 'counter':
          return {
            type: 'turnCounter',
            user,
            item: (t.selected_post_ids ?? [])
              .map((id: string) => resolvePostName(id, allPosts))
              .filter(Boolean)
              .join(', '),
            isUser,
          };

        case 'verify':
          return { type: 'turnVerify', user, isUser };

        case 'stall':
          return { type: 'turnStall', user, isUser };

        case 'accept':
          return { type: 'turnAccept', user, isUser };

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
    .filter((t): t is TradeTurn => t !== null)
    .reverse();
}


export interface IncomingQuery {
  gameId: string;
  targetPostId: string;
  fromUserId: string;
  fromUserName: string;
  itemName: string;
  question: string;
}

export async function getIncomingQueries(): Promise<IncomingQuery[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/dev/trades/incoming_queries`, { headers });
  const text = await res.text();
  return JSON.parse(text);
}

export function buildQueryTurns(item: OpenTradeItem): TradeTurn[] {
  const postName = item.post?.name ?? '';
  const messages = item.messages ?? [];

  return messages.map((m): TradeTurn => ({
    type: 'turnQuery',
    item: m.message,
    question: undefined,
    isUser: m.senderId === item.actorId,
  }))
  .reverse();
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