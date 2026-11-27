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

Mock a module with `jest.mock('path', () => ({...}))` at the top of a file.
Variables used inside the factory must start with `mock` (Jest's rule).
