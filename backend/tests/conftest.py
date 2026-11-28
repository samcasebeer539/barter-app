"""Test setup for the Flask server.

Nothing here touches the real Atlas database or Firebase:
- `backend` (the Mongo connection module) is replaced by a test database
  with the same collections and indexes (db_indexes.py): in-memory
  mongomock by default, or a local MongoDB if TEST_MONGO_URI is set.
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

# Photo URLs must come from this bucket (helpers.storage_path).
os.environ["FIREBASE_STORAGE_BUCKET"] = "test-bucket"

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)


# ── fake Firebase ────────────────────────────────────────────────────────────

storage_calls = []
# Files in the fake storage bucket (paths), and sign-ins deleted.
storage_files = set()
deleted_sign_ins = []
fail_sign_in_delete = []   # put True in it to make delete_user fail


def _install_fake_firebase():
    fa = types.ModuleType("firebase_admin")
    auth = types.ModuleType("firebase_admin.auth")
    storage = types.ModuleType("firebase_admin.storage")
    credentials = types.ModuleType("firebase_admin.credentials")

    def verify_id_token(token):
        if not token or token == "bad":
            raise ValueError("invalid token")
        return {"uid": token, "email": f"{token}@example.com"}

    class _Blob:
        def __init__(self, name):
            self.name = name

        def delete(self):
            storage_calls.append(("delete", self.name))
            storage_files.discard(self.name)

    class _Bucket:
        def list_blobs(self, prefix=""):
            storage_calls.append(("list_blobs", prefix))
            return [_Blob(n) for n in sorted(storage_files) if n.startswith(prefix)]

    def delete_user(uid):
        if fail_sign_in_delete:
            raise RuntimeError("firebase unavailable")
        deleted_sign_ins.append(uid)

    auth.verify_id_token = verify_id_token
    auth.delete_user = delete_user
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


# ── Mongo: in-memory fake, or a real server ─────────────────────────────────
#
# By default the tests use mongomock (fast, nothing to install). Set
# TEST_MONGO_URI (e.g. mongodb://localhost:27017) to run the same tests
# against a real MongoDB instead; CI does both. The test database is
# dropped first, so never point this at the real Atlas database.

TEST_DB_NAME = "wwtest"


def _test_db():
    uri = os.environ.get("TEST_MONGO_URI")
    if not uri:
        return mongomock.MongoClient()[TEST_DB_NAME]
    if "mongodb.net" in uri:
        raise RuntimeError("TEST_MONGO_URI points at Atlas; use a throwaway local MongoDB")
    from pymongo import MongoClient
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.drop_database(TEST_DB_NAME)
    return client[TEST_DB_NAME]


def _install_fake_backend():
    from db_indexes import create_indexes
    db = _test_db()
    backend = types.ModuleType("backend")
    backend.db = db
    backend.user_data_collection = db.user_data
    backend.posts_collection = db.posts
    backend.trades_collection = db.trades
    backend.games_collection = db.games
    backend.reports_collection = db.reports
    create_indexes(db)  # the same indexes as the real server
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
    storage_files.clear()
    deleted_sign_ins.clear()
    fail_sign_in_delete.clear()
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

    def _call(self, method, path, as_=None, json=None, headers=None):
        headers = {**({"Authorization": f"Bearer {as_}"} if as_ else {}), **(headers or {})}
        r = getattr(self.client, method)(path, json=json, headers=headers)
        self.last = r  # the raw response, for headers
        return r.status_code, r.get_json(silent=True)

    def get(self, path, as_=None, headers=None):
        return self._call("get", path, as_, headers=headers)

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

def photo_url(path, bucket="test-bucket"):
    """A Firebase download URL for a Storage path, like the app saves."""
    from urllib.parse import quote
    return f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{quote(path, safe='')}?alt=media&token=t"


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


def future_iso(hours=72):
    return (NOW() + timedelta(hours=hours)).isoformat()
