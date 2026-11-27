"""The feed, search, and opening a post's owner from the feed."""
from datetime import timedelta

import pytest

from conftest import NOW


def titles(posts):
    return [p["post_title"] for p in posts]


def test_feed_is_everyone_elses_posts_newest_first(api, user, post):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    post(alice, "Mine")
    post(bob, "Old", date_posted=NOW() - timedelta(days=2))
    post(cara, "New", date_posted=NOW())
    status, feed = api.get("/dev/feed", as_="alice")
    assert status == 200 and titles(feed) == ["New", "Old"]


@pytest.mark.parametrize("blocker", ["alice", "bob"])
def test_feed_hides_blocked_users_both_ways(api, user, post, blocker):
    alice, bob = user("alice"), user("bob")
    other = {"alice": bob, "bob": alice}[blocker]
    post(alice, "Alice's"), post(bob, "Bob's")
    api.post("/dev/block", as_=blocker, json={"userId": str(other["_id"])})
    assert api.get("/dev/feed", as_="alice")[1] == []
    assert api.get("/dev/feed", as_="bob")[1] == []


def test_feed_distance(api, user, post):
    user("alice", locations=[{"id": "1", "latitude": 36.97, "longitude": -122.03, "name": "SC"}])
    near = user("bob", locations=[{"id": "1", "latitude": 36.97, "longitude": -122.03, "name": "SC"}])
    nowhere = user("cara", locations=[])
    post(near, "Near"), post(nowhere, "Unknown")
    _, feed = api.get("/dev/feed", as_="alice")
    by_title = {p["post_title"]: p["distance_mi"] for p in feed}
    assert by_title == {"Near": 0.0, "Unknown": None}


def test_bad_saved_coordinates_dont_break_the_feed(api, user, post):
    user("alice")
    broken = user("bob", locations=[{"id": "1", "latitude": "north", "longitude": None, "name": "?"}])
    post(broken, "Lamp")
    status, feed = api.get("/dev/feed", as_="alice")
    assert status == 200 and feed[0]["distance_mi"] is None


# ── search ───────────────────────────────────────────────────────────────────

def test_search_matches_title_or_description_ignoring_case(api, user, post):
    user("alice")
    bob = user("bob")
    post(bob, "Desk Lamp"), post(bob, "Chair", description="pairs well with a LAMP"), post(bob, "Rug")
    _, results = api.get("/dev/feed/search?q=lamp", as_="alice")
    assert sorted(titles(results)) == ["Chair", "Desk Lamp"]


def test_search_treats_symbols_literally(api, user, post):
    user("alice")
    bob = user("bob")
    post(bob, "C++ book"), post(bob, "CCC")
    for q in ("C%2B%2B", "(", "[", ".*"):
        status, results = api.get(f"/dev/feed/search?q={q}", as_="alice")
        assert status == 200
    assert titles(api.get("/dev/feed/search?q=C%2B%2B", as_="alice")[1]) == ["C++ book"]
    assert api.get("/dev/feed/search?q=.*", as_="alice")[1] == []


def test_search_leaves_out_own_and_blocked_posts(api, user, post):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    post(alice, "Lamp mine"), post(bob, "Lamp bob"), post(cara, "Lamp cara")
    api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})
    assert titles(api.get("/dev/feed/search?q=lamp", as_="alice")[1]) == ["Lamp cara"]


def test_empty_search_returns_nothing(api, user, post):
    user("alice")
    post(user("bob"), "Lamp")
    assert api.get("/dev/feed/search?q=", as_="alice")[1] == []


# ── a post's owner (tapping a feed card) ────────────────────────────────────

def test_post_owner_profile(api, user, post):
    user("alice")
    bob = user("bob", email_visible=True, phone="555", phone_visible=False)
    lamp, _ = post(bob, "Lamp"), post(bob, "Chair")
    status, body = api.get(f"/dev/feed/{lamp}", as_="alice")
    assert status == 200 and body["tapped_post_id"] == str(lamp)
    assert sorted(titles(body["posts"])) == ["Chair", "Lamp"]
    assert body["user"]["email"] == "bob@example.com" and "phone" not in body["user"]


def test_post_owner_profile_missing_or_blocked(api, user, post):
    from bson import ObjectId
    user("alice")
    bob = user("bob")
    lamp = post(bob)
    assert api.get(f"/dev/feed/{ObjectId()}", as_="alice")[0] == 404
    api.post("/dev/block", as_="bob", json={"userId": str(user("x")["_id"])})  # unrelated block
    assert api.get(f"/dev/feed/{lamp}", as_="alice")[0] == 200
    api.post("/dev/block", as_="bob", json={"userId": str(api_user_id(api, "alice"))})
    assert api.get(f"/dev/feed/{lamp}", as_="alice")[0] == 404


def api_user_id(api, who):
    return api.get("/dev/user_data", as_=who)[1]["_id"]
