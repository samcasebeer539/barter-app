import { OpenTradeItem } from '@/types';
import { getAuth } from 'firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader() {
    const token = await getAuth().currentUser?.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

export async function getOpenTrade(): Promise<OpenTradeItem[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/dev/trades/open`, {headers});

    const text = await res.text()
    console.log(text)
    return JSON.parse(text)

    return res.json();
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

export async function acceptTrade(tradeId: string) {
    const headers = await getAuthHeader();
    return fetch(
        `${BASE_URL}/dev/trades/trade_details/accept/${tradeId}`,
        {
            method: 'POST',
            headers
        }
    );
}

export async function declineTrade(tradeId: string) {
    const headers = await getAuthHeader();
    return fetch(
        `${BASE_URL}/dev/trades/trade_details/decline/${tradeId}`,
        {
            method: 'POST',
            headers
        }
    );
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
        headers
    });

    const text = await res.text()
    console.log(text)
    return JSON.parse(text)


    return res.json();
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