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

A test marked `xfail` documents a known gap: it fails today on purpose,
and the run stays green. When the gap is fixed it starts passing, which
fails the run until the `xfail` mark is removed.

## Not covered

The fake Mongo doesn't know the real Atlas indexes (only the unique
`firebase_uid` one is recreated) and can't reproduce truly simultaneous
requests. Firebase token checks and storage are stubbed, so real sign-in and
real photo uploads/deletes aren't exercised.
