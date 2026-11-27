"""Who may do what, and what input is refused. Mostly guards against bugs
fixed before (see the test names)."""
import pytest
from bson import ObjectId

from models.game import Game

PHOTO = "https://firebasestorage.googleapis.com/v0/b/x/o/photo.jpg"


# ── auth ─────────────────────────────────────────────────────────────────────

def test_requests_need_a_valid_token(api, user):
    user("alice")
    assert api.get("/dev/posts")[0] == 401
    assert api.get("/dev/posts", as_="bad")[0] == 401
    assert api.get("/dev/posts", as_="alice")[0] == 200


def test_only_players_can_see_or_move_in_a_game(api, user, post, game):
    alice, bob, _ = user("alice"), user("bob"), user("eve")
    gid = str(game(alice, bob, post(bob), phase="barter", turn=alice))
    assert api.get(f"/dev/trades/trade_details/get_trade?gameId={gid}", as_="eve")[0] == 403
    for path in ("/dev/trades/stall", "/dev/trades/trade_details/accept", "/dev/trades/trade_details/decline"):
        assert api.post(path, as_="eve", json={"gameId": gid})[0] == 403


# ── trade rules ──────────────────────────────────────────────────────────────

def test_cant_offer_or_ask_on_your_own_post(api, user, post):
    lamp = post(user("alice"))
    assert api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(lamp)})[0] == 400
    status, body = api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "hi"})
    assert status == 400 and "own post" in body["error"]


def test_only_the_receiver_barters_and_input_is_checked(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = str(game(bob, alice, post(alice), phase="offer_pending"))
    chair = str(post(bob))
    assert api.post("/dev/trades/barter", as_="bob", json={"gameId": gid, "selectedPostIds": [chair]})[0] == 403
    assert api.post("/dev/trades/barter", as_="alice", json={"gameId": "nope", "selectedPostIds": [chair]})[0] == 400
    assert api.post("/dev/trades/barter", as_="alice", json={"gameId": gid, "selectedPostIds": []})[0] == 400
    mine = str(post(alice))  # must be Bob's posts
    assert api.post("/dev/trades/barter", as_="alice", json={"gameId": gid, "selectedPostIds": [mine]})[0] == 400
    assert api.post("/dev/trades/barter", as_="alice", json={"gameId": gid, "selectedPostIds": [chair]})[0] == 201


def test_where_must_be_one_of_your_saved_locations(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = str(game(bob, alice, post(alice), phase="close", turn=alice))
    assert api.post("/dev/trades/where", as_="alice", json={"gameId": gid, "locationId": "bob-loc"})[0] == 400
    assert api.post("/dev/trades/where", as_="alice", json={"gameId": gid, "locationId": "alice-loc"})[0] == 201


def test_when_must_be_in_the_future(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = str(game(bob, alice, post(alice), phase="close", turn=alice))
    status, body = api.post("/dev/trades/when", as_="alice",
                            json={"gameId": gid, "proposedAt": "2020-01-01T00:00:00Z", "label": "Then"})
    assert status == 400 and "future" in body["error"]


def test_overdue_move_is_refused_and_the_game_declined(api, user, post, game, phase_of):
    from datetime import datetime, timezone
    alice, bob = user("alice"), user("bob")
    old = datetime(2020, 1, 1, tzinfo=timezone.utc)
    gid = game(bob, alice, post(alice), phase="barter", turn=alice, turn_started_at=old)
    assert api.post("/dev/trades/stall", as_="alice", json={"gameId": str(gid)})[0] == 409
    assert phase_of(gid) == "declined"


def test_racing_move_gets_a_409_and_logs_nothing(api, user, post, game, db, monkeypatch):
    alice, bob = user("alice"), user("bob")
    gid = game(bob, alice, post(alice), phase="barter", turn=alice)
    stale = Game.get(gid)
    db.games_collection.update_one({"_id": gid}, {"$inc": {"rev": 1}})  # someone else saved
    monkeypatch.setattr(Game, "get", classmethod(lambda cls, i: stale))
    status, body = api.post("/dev/trades/stall", as_="alice", json={"gameId": str(gid)})
    assert status == 409 and "just changed" in body["error"]
    assert db.trades_collection.count_documents({"game_id": gid, "type": "stall"}) == 0


# ── reviews ──────────────────────────────────────────────────────────────────

def test_review_rules(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    barter = str(game(bob, alice, post(alice), phase="barter"))
    agreed = str(game(bob, alice, post(alice), phase="agreed"))
    assert api.post("/dev/trades/review", as_="alice", json={"gameId": barter, "rating": 5})[0] == 400
    for bad in (0, 6, 4.5, "5", True):
        assert api.post("/dev/trades/review", as_="alice", json={"gameId": agreed, "rating": bad})[0] == 400
    assert api.post("/dev/trades/review", as_="alice", json={"gameId": agreed, "rating": 4, "text": "x" * 501})[0] == 400
    assert api.post("/dev/trades/review", as_="alice", json={"gameId": agreed, "rating": 4})[0] == 201
    assert api.post("/dev/trades/review", as_="alice", json={"gameId": agreed, "rating": 4})[0] == 409


# ── posts ────────────────────────────────────────────────────────────────────

def test_post_made_with_an_id_the_app_picked(api, user, db):
    user("alice"), user("bob")
    pid = str(ObjectId())
    status, body = api.post("/dev/posts", as_="alice", json={"_id": pid, "post_title": "Lamp", "photos": [PHOTO]})
    assert status == 201 and body["_id"] == pid
    assert db.posts_collection.find_one({"_id": ObjectId(pid)})["photos"] == [PHOTO]
    assert api.post("/dev/posts", as_="bob", json={"_id": pid, "post_title": "Mine"})[0] == 409
    assert api.post("/dev/posts", as_="alice", json={"_id": "nope", "post_title": "x"})[0] == 400
    assert api.post("/dev/posts", as_="alice", json={"post_title": "No id"})[0] == 201


@pytest.mark.parametrize("fields", [
    {"photos": "not a list"},
    {"photos": ["file:///on/my/phone.jpg"]},
    {"photos": [PHOTO] * 11},
    {"is_good": "yes"},
])
def test_bad_post_fields_are_refused(api, user, post, fields):
    alice = user("alice")
    assert api.post("/dev/posts", as_="alice", json={"post_title": "x", **fields})[0] == 400
    assert api.patch(f"/dev/posts/{post(alice)}", as_="alice", json=fields)[0] == 400


def test_items_in_an_active_trade_are_locked(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    lamp, free = post(alice), post(alice)
    game(bob, alice, lamp, phase="barter")
    assert api.patch(f"/dev/posts/{lamp}", as_="alice", json={"post_title": "New"})[0] == 409
    assert api.delete(f"/dev/posts/{lamp}", as_="alice")[0] == 409
    assert api.patch(f"/dev/posts/{free}", as_="alice", json={"post_title": "New"})[0] == 200
    assert api.delete(f"/dev/posts/{free}", as_="alice")[0] == 200


# ── text limits ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("path,method,field,limit", [
    ("/dev/posts", "post", "post_title", 60),
    ("/dev/posts", "post", "description", 1000),
    ("/dev/update_user", "patch", "bio", 300),
    ("/dev/update_user", "patch", "pronouns", 30),
    ("/dev/update_user", "patch", "phone", 20),
])
def test_text_limits(api, user, path, method, field, limit):
    user("alice")
    call = getattr(api, method)
    base = {"post_title": "x"} if path == "/dev/posts" else {}
    assert call(path, as_="alice", json={**base, field: "x" * limit})[0] in (200, 201)
    status, body = call(path, as_="alice", json={**base, field: "x" * (limit + 1)})
    assert status == 400 and "too long" in body["error"]


def test_question_length_limit(api, user, post):
    user("alice")
    lamp = str(post(user("bob")))
    assert api.post("/dev/trades/query", as_="alice", json={"targetPostId": lamp, "message": "x" * 501})[0] == 400
    assert api.post("/dev/trades/query", as_="alice", json={"targetPostId": lamp, "message": "x" * 500})[0] == 201


# ── users and settings ───────────────────────────────────────────────────────

def test_locations_only_save_through_the_locations_route(api, user, db):
    alice = user("alice")
    assert api.patch("/dev/update_user", as_="alice", json={"locations": [{}] * 5})[0] == 400
    four = [{"id": str(i), "latitude": 1, "longitude": 1, "name": "x"} for i in range(4)]
    assert api.put("/dev/locations", as_="alice", json={"locations": four})[0] == 400
    assert api.put("/dev/locations", as_="alice", json={"locations": four[:3]})[0] == 200
    assert len(db.user_data_collection.find_one({"_id": alice["_id"]})["locations"]) == 3


def test_notifications_toggle_sticks(api, user):
    user("alice")
    api.patch("/dev/update_user", as_="alice", json={"is_notifications_allowed": False})
    assert api.get("/settings", as_="alice")[1]["notifications_enabled"] is False
    api.patch("/dev/update_user", as_="alice", json={"is_notifications_allowed": True})
    assert api.get("/settings", as_="alice")[1]["notifications_enabled"] is True


def test_private_fields_never_reach_other_players(api, user, post):
    alice = user("alice", phone="555", blocked_user_ids=[ObjectId()])
    lamp = post(alice)
    user("bob")
    _, body = api.get(f"/dev/feed/{lamp}", as_="bob")
    for field in ("firebase_uid", "email", "phone", "blocked_user_ids"):
        assert field not in body["user"]
