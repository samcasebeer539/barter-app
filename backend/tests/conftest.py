"""Test setup for the Flask server.

Nothing here touches the real Mongo or Firebase:
- `backend` (the Mongo connection module) is replaced by an in-memory
  mongomock database with the same collections and the unique index on
  firebase_uid.
- `firebase_admin` is replaced by a stub. A request with
  `Authorization: Bearer alice` is logged in as the user whose firebase_uid
  is "alice". Storage calls are recorded in `storage_calls`.

Each test starts with an empty database. Build what it needs with the
factories below (user, post, game, turn), then call the API with `api`.
"""
import os
import sys
import types
from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)


# ── fake Firebase ────────────────────────────────────────────────────────────

storage_calls = []


def _install_fake_firebase():
    fa = types.ModuleType("firebase_admin")
    auth = types.ModuleType("firebase_admin.auth")
    storage = types.ModuleType("firebase_admin.storage")
    credentials = types.ModuleType("firebase_admin.credentials")

    def verify_id_token(token):
        if not token or token == "bad":
            raise ValueError("invalid token")
        return {"uid": token, "email": f"{token}@example.com"}

    class _Bucket:
        def list_blobs(self, prefix=""):
            storage_calls.append(("list_blobs", prefix))
            return []

    auth.verify_id_token = verify_id_token
    storage.bucket = lambda *a, **k: _Bucket()
    credentials.Certificate = lambda *a, **k: None
    fa.auth, fa.storage, fa.credentials = auth, storage, credentials
    fa.get_app = lambda *a, **k: None
    fa.initialize_app = lambda *a, **k: None
    sys.modules.update({
        "firebase_admin": fa,
        "firebase_admin.auth": auth,
        "firebase_admin.storage": storage,
        "firebase_admin.credentials": credentials,
    })


# ── fake Mongo ───────────────────────────────────────────────────────────────

def _install_fake_backend():
    db = mongomock.MongoClient().dev
    backend = types.ModuleType("backend")
    backend.db = db
    backend.user_data_collection = db.user_data
    backend.posts_collection = db.posts
    backend.trades_collection = db.trades
    backend.games_collection = db.games
    backend.reports_collection = db.reports
    db.user_data.create_index("firebase_uid", unique=True)
    sys.modules["backend"] = backend
    return backend


_install_fake_firebase()
B = _install_fake_backend()

import init  # noqa: E402  (must come after the fakes are installed)


@pytest.fixture(autouse=True)
def _clean_db():
    """Empty every collection before each test (indexes stay)."""
    for name in B.db.list_collection_names():
        B.db[name].delete_many({})
    storage_calls.clear()
    yield


@pytest.fixture
def db():
    return B


# ── calling the API ──────────────────────────────────────────────────────────

class Api:
    """`api.post("/dev/trades/offer", as_="bob", json={...})` returns
    (status, body). `as_=None` sends no token."""

    def __init__(self, client):
        self.client = client

    def _call(self, method, path, as_=None, json=None):
        headers = {"Authorization": f"Bearer {as_}"} if as_ else {}
        r = getattr(self.client, method)(path, json=json, headers=headers)
        return r.status_code, r.get_json(silent=True)

    def get(self, path, as_=None):
        return self._call("get", path, as_)

    def post(self, path, as_=None, json=None):
        return self._call("post", path, as_, {} if json is None else json)

    def patch(self, path, as_=None, json=None):
        return self._call("patch", path, as_, {} if json is None else json)

    def put(self, path, as_=None, json=None):
        return self._call("put", path, as_, {} if json is None else json)

    def delete(self, path, as_=None):
        return self._call("delete", path, as_)


@pytest.fixture
def api():
    return Api(init.app.test_client())


# ── factories ────────────────────────────────────────────────────────────────

NOW = lambda: datetime.now(timezone.utc)  # noqa: E731

LOCATION = {"id": "loc1", "latitude": 36.97, "longitude": -122.03, "name": "Library", "description": ""}


@pytest.fixture
def user(db):
    """user("alice") makes a user whose token is "alice"; returns the doc."""
    def make(name, **fields):
        doc = {
            "_id": ObjectId(),
            "firebase_uid": name,
            "first_name": name.capitalize(),
            "last_name": "Test",
            "email": f"{name}@example.com",
            "email_visible": False,
            "phone_visible": False,
            "posts": [],
            "locations": [dict(LOCATION, id=f"{name}-loc")],
            **fields,
        }
        db.user_data_collection.insert_one(doc)
        return doc
    return make


@pytest.fixture
def post(db):
    """post(owner_doc, "Lamp") makes a post; returns its _id."""
    def make(owner, title="Item", **fields):
        doc = {
            "_id": ObjectId(),
            "user_id": owner["_id"],
            "post_title": title,
            "description": "",
            "photos": [],
            "date_posted": NOW(),
            **fields,
        }
        db.posts_collection.insert_one(doc)
        db.user_data_collection.update_one({"_id": owner["_id"]}, {"$push": {"posts": doc["_id"]}})
        return doc["_id"]
    return make


@pytest.fixture
def game(db):
    """game(initiator, receiver, target_post_id, phase=..., ...) inserts a
    game directly (skipping the moves that would get it there); returns its
    _id. initiator_cards / receiver_cards default to [] / [target]."""
    def make(initiator, receiver, target, phase="open", initiator_cards=(), receiver_cards=None,
             turn=None, turn_started_at=None, **fields):
        doc = {
            "_id": ObjectId(),
            "initiator_user_id": initiator["_id"],
            "receiver_user_id": receiver["_id"],
            "target_post_id": target,
            "phase": phase,
            "cards": {
                "initiator": list(initiator_cards),
                "receiver": [target] if receiver_cards is None else list(receiver_cards),
            },
            "turn_user_id": (turn or receiver)["_id"],
            "accepts": {"initiator": False, "receiver": False},
            "created_at": NOW(),
            "updated_at": NOW(),
            "completed_at": None,
            "turn_started_at": turn_started_at or NOW(),
            "rev": 0,
            **fields,
        }
        db.games_collection.insert_one(doc)
        return doc["_id"]
    return make


@pytest.fixture
def turn(db):
    """turn(game_id, "where", actor_doc, location=...) logs a move."""
    def make(game_id, type_, actor, **fields):
        doc = {"game_id": game_id, "type": type_, "actor_id": actor["_id"],
               "created_at": NOW(), "messages": [], **fields}
        db.trades_collection.insert_one(doc)
        return doc["_id"]
    return make


@pytest.fixture
def phase_of(db):
    return lambda game_id: db.games_collection.find_one({"_id": game_id})["phase"]


def future_iso(hours=24):
    return (NOW() + timedelta(hours=hours)).isoformat()
