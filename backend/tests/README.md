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

## Not covered

The fake Mongo doesn't know the real Atlas indexes (only the unique
`firebase_uid` one is recreated) and can't reproduce truly simultaneous
requests. Firebase token checks and storage are stubbed. The profile page,
feed search, report and user routes have little or no coverage yet.
