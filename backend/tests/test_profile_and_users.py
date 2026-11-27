"""Accounts, your profile screen, other players' profiles, reviews,
locations and settings."""
import pytest
from bson import ObjectId

from conftest import LOCATION


# ── sign up ──────────────────────────────────────────────────────────────────

def test_sign_up(api, db):
    status, body = api.post("/dev/create_user", as_="newbie", json={"firstName": " Ana ", "lastName": "Ruiz"})
    assert status == 201
    doc = db.user_data_collection.find_one({"firebase_uid": "newbie"})
    assert (doc["first_name"], doc["email"], doc["email_visible"]) == ("Ana", "newbie@example.com", False)
    # Signing up again (e.g. a retry) doesn't make a second account.
    assert api.post("/dev/create_user", as_="newbie", json={"firstName": "Ana", "lastName": "Ruiz"})[0] == 200
    assert db.user_data_collection.count_documents({"firebase_uid": "newbie"}) == 1


@pytest.mark.parametrize("body", [{"firstName": "Ana"}, {"lastName": "Ruiz"}, {"firstName": " ", "lastName": "R"},
                                  {"firstName": "x" * 41, "lastName": "R"}])
def test_sign_up_needs_both_names(api, body):
    assert api.post("/dev/create_user", as_="newbie", json=body)[0] == 400


# ── your own data ────────────────────────────────────────────────────────────

def test_own_user_data_includes_private_fields(api, user):
    other = ObjectId()
    user("alice", phone="555", blocked_user_ids=[other])
    _, me = api.get("/dev/user_data", as_="alice")
    assert me["phone"] == "555" and me["blocked_user_ids"] == [str(other)]


def test_update_user_only_touches_allowed_fields(api, user, db):
    alice = user("alice")
    status, _ = api.patch("/dev/update_user", as_="alice",
                          json={"bio": "Hi", "first_name": "Hacked", "rating": 5, "firebase_uid": "x"})
    assert status == 200
    doc = db.user_data_collection.find_one({"_id": alice["_id"]})
    assert (doc["bio"], doc["first_name"], doc.get("rating"), doc["firebase_uid"]) == ("Hi", "Alice", None, "alice")
    assert api.patch("/dev/update_user", as_="alice", json={"rating": 5})[0] == 400


def test_contact_visibility(api, user, post):
    alice = user("alice", phone="555")
    user("bob")
    lamp = post(alice)

    def seen():
        return api.get(f"/dev/feed/{lamp}", as_="bob")[1]["user"]
    assert "email" not in seen() and "phone" not in seen()
    api.patch("/dev/update_user", as_="alice", json={"email_visible": True, "phone_visible": True})
    assert (seen()["email"], seen()["phone"]) == ("alice@example.com", "555")


def test_profile_page_has_every_part(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    lamp = post(alice, "Lamp")
    gid = game(bob, alice, lamp, phase="offer_pending")
    turn(game(bob, alice, post(alice), phase="open"), "query", bob,
         messages=[{"message": "Size?"}], answered_at=None, target_post_id=lamp)
    status, page = api.get("/dev/profile_page", as_="alice")
    assert status == 200
    assert set(page) == {"user", "posts", "locations", "incomingOffers", "incomingQueries",
                         "offererProfiles", "settings"}
    assert page["incomingOffers"][0]["gameId"] == str(gid)
    assert page["incomingQueries"][0]["question"] == "Size?"
    assert list(page["offererProfiles"]) == [str(bob["_id"])]
    lamp_card = next(p for p in page["posts"] if p["post_title"] == "Lamp")
    assert lamp_card["in_trade"] is True  # an offer is pending on it


def test_profile_page_is_204_when_nothing_changed(api, user, post):
    alice = user("alice")
    post(alice)
    api.get("/dev/profile_page", as_="alice")
    version = api.last.headers["X-Version"]
    assert api.get("/dev/profile_page", as_="alice", headers={"X-Known-Version": version})[0] == 204
    api.patch("/dev/update_user", as_="alice", json={"bio": "changed"})
    assert api.get("/dev/profile_page", as_="alice", headers={"X-Known-Version": version})[0] == 200


def test_incoming_questions_drop_off_once_answered(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    lamp = post(alice)
    gid = game(bob, alice, lamp, phase="open")
    q = turn(gid, "query", bob, messages=[{"message": "Size?"}], answered_at=None, target_post_id=lamp)
    turn(gid, "query", alice, messages=[{"message": "My own"}], answered_at=None, target_post_id=post(bob))
    _, incoming = api.get("/dev/trades/incoming_queries", as_="alice")
    assert [i["question"] for i in incoming] == ["Size?"]  # not her own question
    api.post("/dev/trades/answer", as_="alice", json={"queryId": str(q), "message": "Big"})
    assert api.get("/dev/trades/incoming_queries", as_="alice")[1] == []


# ── other players ────────────────────────────────────────────────────────────

def test_user_profile_by_id(api, user, post):
    user("alice")
    bob = user("bob")
    post(bob, "Lamp")
    status, body = api.get(f"/dev/users/{bob['_id']}", as_="alice")
    assert status == 200 and [p["post_title"] for p in body["posts"]] == ["Lamp"]
    assert "firebase_uid" not in body["user"]
    assert api.get(f"/dev/users/{ObjectId()}", as_="alice")[0] == 404


def test_profiles_batch(api, user, post):
    user("alice")
    bob, cara = user("bob"), user("cara")
    post(bob), post(cara), post(cara)
    _, body = api.get(f"/dev/profiles?ids={bob['_id']},{cara['_id']},{ObjectId()}", as_="alice")
    assert set(body) == {str(bob["_id"]), str(cara["_id"])}
    assert len(body[str(cara["_id"])]["posts"]) == 2
    assert api.get("/dev/profiles?ids=nope", as_="alice")[0] == 400
    assert api.get("/dev/profiles?ids=", as_="alice")[1] == {}


@pytest.mark.parametrize("blocker", ["alice", "bob"])
def test_blocked_users_cant_load_each_others_profiles(api, user, blocker):
    alice, bob = user("alice"), user("bob")
    other = bob if blocker == "alice" else alice
    api.post("/dev/block", as_=blocker, json={"userId": str(other["_id"])})
    assert api.get(f"/dev/users/{alice['_id']}", as_="bob")[0] == 404
    assert api.get(f"/dev/users/{bob['_id']}", as_="alice")[0] == 404
    assert api.get(f"/dev/profiles?ids={alice['_id']}", as_="bob")[1] == {}
    assert api.get(f"/dev/profiles?ids={bob['_id']}", as_="alice")[1] == {}


def test_reviews_list(api, user, game, turn, db):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    from datetime import timedelta
    from conftest import NOW
    g = game(bob, alice, ObjectId(), phase="completed")
    turn(g, "review", bob, reviewed_user_id=alice["_id"], rating=4, text="Nice", created_at=NOW() - timedelta(days=1))
    turn(g, "review", cara, reviewed_user_id=alice["_id"], rating=2, text="", created_at=NOW())
    db.user_data_collection.delete_one({"_id": cara["_id"]})  # cara deleted her account
    _, reviews = api.get(f"/dev/users/{alice['_id']}/reviews", as_="bob")
    assert [(r["rating"], r["reviewerName"]) for r in reviews] == [(2, "Former member"), (4, "Bob Test")]
    assert api.get("/dev/users/nope/reviews", as_="bob")[0] == 400


# ── locations ────────────────────────────────────────────────────────────────

def test_locations_round_trip(api, user):
    user("alice"), user("bob")
    spot = {"id": "9", "latitude": 1.5, "longitude": 2.5, "name": "Park"}
    assert api.put("/dev/locations", as_="alice", json={"locations": [spot]})[0] == 200
    assert api.get("/dev/locations", as_="alice")[1] == [{**spot, "description": ""}]
    alice_id = api.get("/dev/user_data", as_="alice")[1]["_id"]
    assert api.get(f"/dev/locations/{alice_id}", as_="bob")[1][0]["name"] == "Park"
    assert api.get("/dev/locations/nope", as_="bob")[0] == 400
    assert api.get(f"/dev/locations/{ObjectId()}", as_="bob")[0] == 404


@pytest.mark.parametrize("body", [
    {"locations": "x"},
    {"locations": [{"id": "1", "latitude": 1}]},
    {"locations": [{**LOCATION, "name": "x" * 41}]},
    {"locations": [{**LOCATION, "description": "x" * 201}]},
])
def test_bad_locations_are_refused(api, user, body):
    user("alice")
    assert api.put("/dev/locations", as_="alice", json=body)[0] == 400


def test_deleting_all_locations_sticks(api, user):
    user("alice")
    assert api.put("/dev/locations", as_="alice", json={"locations": []})[0] == 200
    assert api.get("/dev/locations", as_="alice")[1] == []


# ── settings ─────────────────────────────────────────────────────────────────

def test_settings_default_on_and_toggle(api, user):
    user("alice")
    assert api.get("/settings", as_="alice")[1] == {"is_location_allowed": True, "notifications_enabled": True}
    api.patch("/dev/update_user", as_="alice", json={"is_location_allowed": False})
    assert api.get("/settings", as_="alice")[1]["is_location_allowed"] is False
