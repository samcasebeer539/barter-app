# Server tests

Fast tests for the Flask server. They use a test database and a stubbed
Firebase, so they never touch the real Atlas database, storage or auth,
and need no `.env`.

By default the database is an in-memory fake (mongomock). Set
`TEST_MONGO_URI` to run the same tests against a real, throwaway MongoDB
(its `wwtest` database is wiped first; Atlas URIs are refused):

```
docker run -d -p 27017:27017 mongo:8.0
TEST_MONGO_URI=mongodb://localhost:27017 python -m pytest tests -q
```

GitHub Actions runs both on every backend change.

## Run

```
cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests -q
```

## Files

- `conftest.py`: the fakes, plus factories (`user`, `post`, `game`, `turn`)
  and `api` for calling routes. A request `as_="alice"` is logged in as the
  user made with `user("alice")`.
- `test_game_rules.py`: the Game model: every action in every phase, turns,
  accepts, the turn timer, conflict-safe saves.
- `test_trade_flow.py`: whole trades through the API, offer to completed.
- `test_cascades.py`: finalizing a deal and blocking someone.
- `test_rules_and_validation.py`: permissions, bad input, text limits.
- `test_feed_and_search.py`: feed, search, opening a post's owner.
- `test_profile_and_users.py`: sign up, your profile page, other players'
  profiles, reviews, locations, settings.
- `test_safety.py`: block list and reports.
- `test_trade_lists.py`: what each barter tab lists, turn-timer expiry on
  load, 204 caching, answers, post deletion.
- `test_questions.py`: questions from the feed, from a post owner to the
  person who offered, and as turns in barter / close.
- `test_feed_paging.py`: traded posts leaving other people's lists, the
  location block check, and the feed / search a page at a time (each sort,
  unknown distances last, no repeats across pages, bad arguments).
- `test_database.py`: the run is on the database it should be, the
  server's indexes exist, and the unique index keeps one account per user.
- `test_bad_requests.py`: every route given broken requests (missing or
  malformed ids, unknown ids, no JSON, wrong phase, off turn, no profile
  yet) answers with a clear 4xx, never a 500.

A test marked `xfail` documents a known gap: it fails today on purpose,
and the run stays green. When the gap is fixed it starts passing, which
fails the run until the `xfail` mark is removed. (None right now.)

## Coverage

About 89% of the server code (routes, models, helpers) runs under the
tests. Most of the rest is each route's catch-all `except Exception` that
turns an unexpected crash into a 500. To see it:

```
pip install pytest-cov
python -m pytest tests -q --cov=routes --cov=models --cov=helpers.py --cov=init.py --cov-report=term-missing
```

## Not covered

Indexes come from `db_indexes.py`, the same file the server uses. Truly
simultaneous requests can't be reproduced (races are simulated). Firebase token checks and storage are stubbed, so real sign-in and
real photo uploads/deletes aren't exercised.
