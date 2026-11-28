"""Traded posts leave other people's lists; the feed and search a page at a
time, sorted on the server."""
from datetime import timedelta

import pytest
from bson import ObjectId

from conftest import NOW


def titles(posts):
    return [p["post_title"] for p in posts]


def page(api, who, path="/dev/feed", **args):
    q = "&".join(f"{k}={v}" for k, v in args.items())
    status, body = api.get(f"{path}{'&' if '?' in path else '?'}{q}", as_=who)
    assert status == 200, body
    return body


# ── traded posts ─────────────────────────────────────────────────────────────

def test_agreeing_a_deal_takes_its_posts_out_of_everyone_elses_lists(api, user, post, game, turn, db):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    lamp, chair, spare = post(alice, "Lamp"), post(bob, "Chair"), post(bob, "Spare")
    deal = game(bob, alice, lamp, phase="close", initiator_cards=[chair], turn=alice)
    turn(deal, "where", alice, location={"id": "x"}), turn(deal, "when", bob, proposed_time="Sun")
    api.post("/dev/trades/trade_details/accept", as_="alice", json={"gameId": str(deal)})
    api.post("/dev/trades/trade_details/accept", as_="bob", json={"gameId": str(deal)})

    assert titles(api.get("/dev/feed", as_="cara")[1]) == ["Spare"]
    assert titles(api.get("/dev/feed/search?q=a", as_="cara")[1]) == ["Spare"]
    assert titles(api.get(f"/dev/users/{bob['_id']}", as_="cara")[1]["posts"]) == ["Spare"]
    assert titles(api.get(f"/dev/profiles?ids={bob['_id']}", as_="cara")[1][str(bob["_id"])]["posts"]) == ["Spare"]
    _, tapped = api.get(f"/dev/feed/{spare}", as_="cara")
    assert titles(tapped["posts"]) == ["Spare"]
    status, body = api.get(f"/dev/feed/{chair}", as_="cara")
    assert status == 404 and body["error"] == "That item has already been traded"
    # Their owners still have them.
    assert "Lamp" in titles(api.get("/dev/posts", as_="alice")[1])


def test_blocking_cancels_an_agreed_deal_and_its_posts_come_back(api, user, post, game, db):
    from models.game import Game
    alice, bob, _ = user("alice"), user("bob"), user("cara")
    lamp, chair = post(alice, "Lamp"), post(bob, "Chair")
    deal = game(bob, alice, lamp, phase="agreed", initiator_cards=[chair])
    Game.get(deal).set_cards_traded()
    assert api.get("/dev/feed", as_="cara")[1] == []
    api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})
    assert sorted(titles(api.get("/dev/feed", as_="cara")[1])) == ["Chair", "Lamp"]


def test_backfill_marks_existing_deals(user, post, game, db):
    import importlib, sys
    alice, bob = user("alice"), user("bob")
    lamp, chair, free = post(alice), post(bob), post(bob)
    game(bob, alice, lamp, phase="completed", initiator_cards=[chair])
    game(bob, alice, free, phase="barter")
    sys.modules.pop("migrate_traded_posts", None)
    importlib.import_module("migrate_traded_posts")
    traded = {p["_id"] for p in db.posts_collection.find({"traded": True})}
    assert traded == {lamp, chair}


@pytest.mark.parametrize("blocker", ["alice", "bob"])
def test_blocked_users_cant_see_each_others_locations(api, user, blocker):
    alice, bob = user("alice"), user("bob")
    other = bob if blocker == "alice" else alice
    assert api.get(f"/dev/locations/{bob['_id']}", as_="alice")[0] == 200
    api.post("/dev/block", as_=blocker, json={"userId": str(other["_id"])})
    assert api.get(f"/dev/locations/{bob['_id']}", as_="alice")[0] == 404
    assert api.get(f"/dev/locations/{alice['_id']}", as_="bob")[0] == 404


# ── paging ───────────────────────────────────────────────────────────────────

@pytest.fixture
def many(user, post):
    """Bob has 30 posts, one an hour apart: Post 00 oldest ... Post 29 newest."""
    user("alice")
    bob = user("bob")
    for i in range(30):
        post(bob, f"Post {i:02d}", date_posted=NOW() - timedelta(hours=30 - i))
    return bob


def test_newest_first_a_page_at_a_time(api, many):
    first = page(api, "alice", sort="newest", limit=12)
    assert titles(first["posts"]) == [f"Post {i:02d}" for i in range(29, 17, -1)]
    assert first["nextOffset"] == 12
    second = page(api, "alice", sort="newest", limit=12, offset=12)
    third = page(api, "alice", sort="newest", limit=12, offset=24)
    assert len(second["posts"]) == 12 and len(third["posts"]) == 6
    assert third["nextOffset"] is None
    everything = titles(first["posts"] + second["posts"] + third["posts"])
    assert len(set(everything)) == 30  # no repeats, nothing missing


def test_oldest_first(api, many):
    assert titles(page(api, "alice", sort="oldest", limit=3)["posts"]) == ["Post 00", "Post 01", "Post 02"]


def test_default_page_size(api, many):
    body = page(api, "alice", sort="newest")
    assert len(body["posts"]) == 24 and body["nextOffset"] == 24


def test_exactly_one_page_has_no_next(api, user, post):
    user("alice")
    bob = user("bob")
    for i in range(5):
        post(bob, f"P{i}")
    assert page(api, "alice", sort="newest", limit=5)["nextOffset"] is None


def test_by_distance_across_pages_with_unknown_distances_last(api, user, post):
    here = {"id": "1", "latitude": 36.97, "longitude": -122.03, "name": "SC"}
    user("alice", locations=[here])
    spots = {"near": 36.98, "mid": 37.3, "far": 38.5}
    for name, lat in spots.items():
        owner = user(name, locations=[{**here, "latitude": lat}])
        post(owner, name.capitalize())
    nowhere = user("nowhere", locations=[])
    post(nowhere, "Unknown")

    nearest = page(api, "alice", sort="nearest", limit=2)
    rest = page(api, "alice", sort="nearest", limit=2, offset=2)
    assert titles(nearest["posts"] + rest["posts"]) == ["Near", "Mid", "Far", "Unknown"]
    assert nearest["posts"][0]["distance_mi"] < nearest["posts"][1]["distance_mi"]
    farthest = page(api, "alice", sort="farthest", limit=10)
    assert titles(farthest["posts"]) == ["Far", "Mid", "Near", "Unknown"]


def test_paged_feed_still_hides_own_blocked_and_traded(api, user, post, game, db):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    post(alice, "Mine"), post(bob, "Bob's"), post(cara, "Cara's")
    traded = post(cara, "Traded")
    db.posts_collection.update_one({"_id": traded}, {"$set": {"traded": True}})
    api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})
    assert titles(page(api, "alice", sort="newest")["posts"]) == ["Cara's"]


def test_search_pages_too(api, many):
    body = page(api, "alice", path="/dev/feed/search?q=post", sort="oldest", limit=10, offset=20)
    assert titles(body["posts"]) == [f"Post {i:02d}" for i in range(20, 30)]
    assert body["nextOffset"] is None
    assert page(api, "alice", path="/dev/feed/search?q=", sort="newest") == {"posts": [], "nextOffset": None}


def test_without_paging_the_answer_is_the_old_list(api, many):
    status, body = api.get("/dev/feed", as_="alice")
    assert status == 200 and isinstance(body, list) and len(body) == 30
    assert body[0]["post_title"] == "Post 29"


@pytest.mark.parametrize("args", ["sort=random", "limit=0", "limit=51", "limit=x", "offset=-1", "offset=1.5"])
def test_bad_paging_arguments(api, many, args):
    assert api.get(f"/dev/feed?{args}", as_="alice")[0] == 400
