"""Checks on the test database itself, so a real-mongo run can't quietly
fall back to the fake, and the indexes the server relies on exist."""
import os

import pytest
from pymongo.errors import DuplicateKeyError


def test_using_the_database_ci_asked_for(db):
    real = bool(os.environ.get("TEST_MONGO_URI"))
    is_mongomock = type(db.db).__module__.startswith("mongomock")
    assert is_mongomock is not real


def test_server_indexes_exist(db):
    keys = [list(ix["key"].keys()) for ix in db.games_collection.list_indexes()]
    for wanted in (["initiator_user_id", "phase"], ["receiver_user_id", "phase"],
                   ["initiator_user_id", "target_post_id"]):
        assert wanted in keys


def test_one_account_per_firebase_user(db):
    db.user_data_collection.insert_one({"firebase_uid": "same"})
    with pytest.raises(DuplicateKeyError):
        db.user_data_collection.insert_one({"firebase_uid": "same"})


def test_racing_sign_ups_make_one_account(api, db, monkeypatch):
    """Two sign-up requests at once both get past the "already exists?"
    check; the unique index makes the second insert fail cleanly."""
    import routes.dev.create_user.route as route
    monkeypatch.setattr(route, "current_user", lambda: None)  # both think they're first
    first = api.post("/dev/create_user", as_="newbie", json={"firstName": "A", "lastName": "B"})
    second = api.post("/dev/create_user", as_="newbie", json={"firstName": "A", "lastName": "B"})
    assert (first[0], second[0]) == (201, 200)
    assert db.user_data_collection.count_documents({"firebase_uid": "newbie"}) == 1
