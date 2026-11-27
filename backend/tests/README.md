# Server tests

Fast tests for the Flask server. They use an in-memory fake Mongo and a
stubbed Firebase, so they never touch the real database, storage or auth,
and need no `.env`.

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

The fake Mongo doesn't know the real Atlas indexes (only the unique
`firebase_uid` one is recreated) and can't reproduce truly simultaneous
requests. Firebase token checks and storage are stubbed, so real sign-in and
real photo uploads/deletes aren't exercised.
