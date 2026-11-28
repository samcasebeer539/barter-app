# App tests

Jest tests for the app's logic (jest-expo + React Native Testing Library).
Firebase and the server are mocked, so they need no `.env` or network.

```
npm test             # all of them
npx jest tests/api   # one file
npm run typecheck    # TypeScript (CI fails on any error)
```

Tests run in Los Angeles time (`tests/globalSetup.js`) on every machine, so
date tests behave the same locally and in CI.

Tests live here, not next to the code, because anything under `app/`
becomes a screen in expo-router.

| File | Covers |
|---|---|
| `api.test.ts` | `lib/api`: token on every request, server error messages, offline / timeout, the 204 "nothing changed" check |
| `tradeHistory.test.ts` | Building the trade history from the server's turn log; parsing the open / close tab responses |
| `useTradeAction.test.ts` | The action buttons' state: arming, picking posts, typed text, confirm |
| `postService.test.ts` | Photos upload before a post is created, unique photo names, failed uploads create nothing |
| `settings.test.ts` | Reading the server's settings response |
| `errors.test.ts` | What people see when something fails: server messages as is, offline / crash / internal messages reworded |
| `DeckOffers.test.tsx` | MY QUERIES / MY OFFERS / DECLINED OFFERS: each card shows its game's whole history |
| `barterScreen.test.tsx` | Barter page: each tab's loads, the background check while waiting (every 5s backing off to a minute, only while waiting, stops when you leave), history dropdowns, reloads after a refused move or a block |
| `profileScreen.test.tsx` | Profile screen: one-request load, the quiet refresh on return (locks, rating, offers; keeps an unsaved post), barter / decline removing the offerer, saves and their failures |
| `CardMeetingLocation.test.tsx` | Location card: adding / removing (3 max, name required), WHERE picking, proposed spot, someone else's spots, where the map starts |
| `settingsScreen.test.tsx` | Settings: the toggles (saved on the server, remembered in the app, flipped back with a message on failure), Location Services asking the phone, blocked users, log out |
| `TradeTurns.test.tsx` | The turn log's sentences, and the question box (limit, cleared on close, Done key, focuses itself) |
| `routingAndServices.test.tsx` | Sign-in routing (login vs feed), the user service (field names, profile photo path), photo shrinking |
| `Deck.test.tsx` | The card stack's logic: card order, what's on top (and reported), jumps, wrapping, swipes (fed in as a recorded drag), several players' cards |
| `smallComponents.test.tsx` | Review stars, the feed's search / sort bar, the OPEN / BARTER / CLOSE bar |
| `CardUser.test.tsx` | User card: visible contacts, editing (eyes, dots per character, the hidden phone field, save / cancel), reviews |
| `CardDateTime.test.tsx` | Time card: date then time, the exact moment sent for WHEN (phone's time zone), clearing, a proposed time |
| `useKeyboardLift.test.tsx` | Keeping the focused field above the keyboard, only on the screen that owns it |
| `servicesMore.test.ts` | Settings cache (fetched once, shared), profile page and offerer profiles |
| `login.test.tsx` | Sign in / sign up, name check, failures, field limits |
| `feedPaging.test.tsx` | Feed pages: first page, the next one near the bottom (once, until there are no more, no repeats), sort and search starting over |
| `QueryAnswer.test.tsx` | Answering a question; a failed answer keeps your text (alert in the QUERIES drawer, the trade deck's handling in a trade) |
| `TradeActions.test.tsx` | The action wheel: query / offer / barter / add hidden and untappable on non-post cards, barter's count, the confirm arrow (only when ready, once per tap), turn timers |
| `CardItem.test.tsx` | Post card: report vs edit buttons, locked posts, save needs a title and photo, cancel discards a new post, the 10-photo cap, the title limit |
| `safety.test.tsx` | Block / unblock / report through the real alerts flow: confirm first, the button turning red, failures shown, "Other" needing details, Android without the text prompt |

| `DeckFeed.test.tsx` | Feed deck: offer / query only on posts, an open question closes when you swipe to the user card, offers one post at a time, sent turns shown, ADD mode from a trade |
| `DeckProfile.test.tsx` | Profile deck: barter / query / decline to offerers, one offerer's posts per barter, failed questions keep your text, the offer's history, the QUERIES drawer, counts |
| `DeckTrade.test.tsx` | A trade: WAIT when it's not your turn or a question needs answering, which moves the wheel offers (subtract, final accept, review), every move sent for the right game, refused moves reported, ADD, where / when, review, the turn timer |

Component tests find buttons by `testID` (e.g. `action-query`,
`post-save`, `user-block`). The action wheel repeats every action, so use
the first match: `getAllByTestId('action-query')[0]`. Icons are mocked to
render their name as text (`icon:circle`) so a test can tell which one shows.

Mock a module with `jest.mock('path', () => ({...}))` at the top of a file.
Variables used inside the factory must start with `mock` (Jest's rule).

## Deck tests

The decks are mostly gestures and animation, so their tests swap the card
stack, wheel and turn log for stand-ins (`helpers/deckRecorders.tsx`) and
test the deck's own decisions: what it tells the wheel, and what it sends.
A test acts like a person:

```ts
await swipeTo(0, { deck: 'theirs' });   // their first post comes to the top
await scrollWheelTo('query');           // scroll the wheel to QUERY
await press('query');                   // tap its button
await typeQuestion('Still have it?');
await confirm('query');                 // tap the arrow
expect(sendGameQuery).toHaveBeenCalledWith('g1', 'Still have it?', 'chair');
expect(wheel().activeActionType).toBeNull();
```
