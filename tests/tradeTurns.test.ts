// services/tradeService.ts: turning the server's turn log into the trade
// history the decks show, and parsing the tab responses.
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));

import { apiJson } from '@/lib/api';
import {
  buildTradeTurns, buildQueryTurns, getLatestProposals, getOpenTab, getCloseTab,
} from '@/services/tradeService';

const ME = 'me', THEM = 'them';
const posts = [
  { _id: 'lamp', name: 'Lamp', description: '', photos: [], date_posted: '' },
  { _id: 'chair', name: 'Chair', description: '', photos: [], date_posted: '' },
];
const build = (turns: any[]) => buildTradeTurns(turns, ME, 'Bob', posts);

test('newest move first, with who made it', () => {
  const turns = build([
    { type: 'offer', actor_id: THEM, target_post_id: 'lamp' },
    { type: 'barter', actor_id: ME, selected_post_ids: ['chair', 'gone'] },
    { type: 'stall', actor_id: THEM },
  ]);
  expect(turns.map(t => [t.type, t.user, t.item, t.isUser])).toEqual([
    ['turnStall', 'Bob', undefined, false],
    ['turnBarter', undefined, 'Chair', true],   // deleted posts are left out
    ['turnOffer', 'Bob', 'Lamp', false],
  ]);
});

test('an answered question shows its answer directly under it', () => {
  const turns = build([
    { type: 'query', actor_id: ME, target_post_id: 'chair', messages: [
      { message: 'Scratches?', sender_id: ME }, { message: 'None', sender_id: THEM },
    ] },
    { type: 'stall', actor_id: THEM },
  ]);
  expect(turns.map(t => [t.type, t.item])).toEqual([
    ['turnStall', undefined],
    ['turnQuery', 'Scratches? (Chair)'],
    ['turnAnswer', 'None'],
  ]);
  expect(turns[2]).toMatchObject({ user: 'Bob', isUser: false });
});

test('an unanswered question is just the question', () => {
  const turns = build([{ type: 'query', actor_id: THEM, messages: [{ message: 'Size?', sender_id: THEM }] }]);
  expect(turns).toEqual([{ type: 'turnQuery', user: 'Bob', item: 'Size?', isUser: false }]);
});

test("the close-phase accept is the final one; barter's isn't", () => {
  const turns = build([
    { type: 'accept', actor_id: ME, final: false },
    { type: 'accept', actor_id: ME, final: true },
  ]);
  expect(turns.map(t => t.type)).toEqual(['turnAcceptFinal', 'turnAccept']);
});

test('reviews show stars and the text', () => {
  expect(build([{ type: 'review', actor_id: THEM, rating: 4, text: 'Great' }])[0].item).toBe('★★★★☆ "Great"');
  expect(build([{ type: 'review', actor_id: THEM, rating: 2 }])[0].item).toBe('★★☆☆☆');
});

test('where, when, add and subtract use the names saved on the turn', () => {
  const turns = build([
    { type: 'where', actor_id: ME, location_name: 'Library' },
    { type: 'when', actor_id: THEM, proposed_time: 'Mon at 3' },
    { type: 'add', actor_id: ME, post_name: 'Vase' },
    { type: 'subtract', actor_id: THEM, post_name: 'Rug' },
  ]);
  expect(turns.map(t => t.item)).toEqual(['Rug', 'Vase', 'Mon at 3', 'Library']);
});

test('moves the app does not know are skipped, not shown blank', () => {
  expect(build([{ type: 'something_new', actor_id: ME }, { type: 'decline', actor_id: THEM }]))
    .toEqual([{ type: 'turnDecline', user: 'Bob', isUser: false }]);
});

test('latest place and time proposals win', () => {
  const p = getLatestProposals([
    { type: 'where', actor_id: ME, location: { id: 'a', name: 'Park' } },
    { type: 'when', actor_id: THEM, proposed_time: 'Mon' },
    { type: 'where', actor_id: THEM, location: { id: 'b', name: 'Library' } },
  ], ME);
  expect(p.where).toEqual({ isUser: false, location: { id: 'b', name: 'Library' } });
  expect(p.when).toEqual({ isUser: false, label: 'Mon' });
  expect(getLatestProposals([], ME)).toEqual({ where: null, when: null });
});

test('QUERIES deck: each question with its answer, newest question first', () => {
  const turns = buildQueryTurns({
    actorId: ME, post: null, messages: [
      { message: 'Q1', senderId: ME }, { message: 'A1', senderId: THEM }, { message: 'Q2', senderId: ME },
    ],
  } as any);
  expect(turns.map(t => [t.type, t.item])).toEqual([['turnQuery', 'Q2'], ['turnQuery', 'Q1'], ['turnAnswer', 'A1']]);
});

// ── parsing the tab responses (the shapes the server's tests check) ─────────

test('open tab: server fields map to app fields; questions in one game are merged', async () => {
  (apiJson as jest.Mock).mockResolvedValue({
    queries: [
      { _id: 'q1', game_id: 'g1', type: 'query', actor_id: ME, post: { _id: 'lamp', post_title: 'Lamp' },
        messages: [{ message: 'Later', sender_id: ME, created_at: '2026-01-02T00:00:00Z' }] },
      { _id: 'q2', game_id: 'g1', type: 'query', actor_id: ME, post: { _id: 'lamp', post_title: 'Lamp' },
        messages: [{ message: 'First', sender_id: ME, created_at: '2026-01-01T00:00:00Z' }] },
    ],
    offers: [{ _id: 'o1', game_id: 'g2', type: 'offer', actor_id: ME }],
    declined: [{ _id: 'g3:lamp', game_id: 'g3', type: 'declined', partner_name: 'Bob', my_id: ME, turns: [] }],
  });
  const tab = await getOpenTab();
  expect(tab.queries).toHaveLength(1);
  expect(tab.queries[0].post?.name).toBe('Lamp');
  expect(tab.queries[0].messages!.map(m => m.message)).toEqual(['First', 'Later']);
  expect(tab.offers[0]).toMatchObject({ tradeId: 'o1', gameId: 'g2', post: null });
  expect(tab.declined[0]).toMatchObject({ partnerName: 'Bob', myId: ME, rawTurns: [] });
});

test('open tab: missing lists are empty, not a crash', async () => {
  (apiJson as jest.Mock).mockResolvedValue({});
  await expect(getOpenTab()).resolves.toEqual({ queries: [], offers: [], declined: [] });
});

test('close tab: asks for history only when wanted, defaults the rest', async () => {
  (apiJson as jest.Mock).mockResolvedValue({});
  const tab = await getCloseTab(false);
  expect((apiJson as jest.Mock).mock.calls[0][0]).toBe('/dev/trades/close_tab');
  expect(tab).toEqual({ close: [], closeVersion: '', counts: { completed: 0, declined: 0 },
                        completed: undefined, declined: undefined });
  await getCloseTab(true);
  expect((apiJson as jest.Mock).mock.calls[1][0]).toBe('/dev/trades/close_tab?history=1');
});
