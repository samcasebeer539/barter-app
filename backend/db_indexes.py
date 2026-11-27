"""The database's indexes, in one place, so the server (backend.py) and the
tests build exactly the same ones. create_index does nothing if an index
already exists."""


def create_indexes(db):
    # One account per Firebase user.
    db.user_data.create_index("firebase_uid", unique=True)
    # Lookups the app makes constantly (barter page lists, turn logs, profiles).
    db.games.create_index([("initiator_user_id", 1), ("phase", 1)])
    db.games.create_index([("receiver_user_id", 1), ("phase", 1)])
    db.games.create_index([("initiator_user_id", 1), ("target_post_id", 1)])
    db.trades.create_index([("game_id", 1), ("created_at", 1)])
    db.trades.create_index([("actor_id", 1), ("type", 1), ("game_id", 1)])
    db.posts.create_index("user_id")
