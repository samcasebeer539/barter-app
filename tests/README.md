# App tests

Jest tests for the app's logic (jest-expo + React Native Testing Library).
Firebase and the server are mocked, so they need no `.env` or network.

```
npm test             # all of them
npx jest tests/api   # one file
```

Tests live here, not next to the code, because anything under `app/`
becomes a screen in expo-router.

| File | Covers |
|---|---|
| `api.test.ts` | `lib/api`: token on every request, server error messages, offline / timeout, the 204 "nothing changed" check |
| `tradeTurns.test.ts` | Building the trade history from the server's turn log; parsing the open / close tab responses |
| `useTradeAction.test.ts` | The action buttons' state: arming, picking posts, typed text, confirm |
| `postService.test.ts` | Photos upload before a post is created, unique photo names, failed uploads create nothing |
| `settings.test.ts` | Reading the server's settings response |
| `TradeActions.test.tsx` | The action wheel: query / offer / barter / add hidden and untappable on non-post cards, barter's count, the confirm arrow (only when ready, once per tap), turn timers |
| `CardItem.test.tsx` | Post card: report vs edit buttons, locked posts, save needs a title and photo, cancel discards a new post, the 10-photo cap, the title limit |
| `safety.test.tsx` | Block / unblock / report through the real alerts flow: confirm first, the button turning red, failures shown, "Other" needing details, Android without the text prompt |

Component tests find buttons by `testID` (e.g. `action-query`,
`post-save`, `user-block`). The action wheel repeats every action, so use
the first match: `getAllByTestId('action-query')[0]`. Icons are mocked to
render their name as text (`icon:circle`) so a test can tell which one shows.

Mock a module with `jest.mock('path', () => ({...}))` at the top of a file.
Variables used inside the factory must start with `mock` (Jest's rule).
