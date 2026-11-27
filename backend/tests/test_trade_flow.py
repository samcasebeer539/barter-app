"""Whole trades played through the API, start to finish, the way the app
plays them. These catch bugs that only show up across several routes."""
from bson import ObjectId

from conftest import future_iso


def gid_of(body):
    return ObjectId(body["gameId"])


def close_tab(api, who):
    status, body = api.get("/dev/trades/close_tab?history=1", as_=who)
    assert status == 200
    return body


def ids(games):
    return {g["gameId"] for g in games}


def test_full_trade_offer_to_completed(api, user, post, db, phase_of):
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(alice, "Lamp"), post(bob, "Chair")

    # Bob offers on Alice's lamp.
    status, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    assert status == 201
    gid = gid_of(body)
    assert phase_of(gid) == "offer_pending"
    _, open_tab = api.get("/dev/trades/open_tab", as_="bob")
    assert [o["game_id"] for o in open_tab["offers"]] == [str(gid)]

    # Alice picks Bob's chair: barter. Bob (initiator) moves first.
    status, _ = api.post("/dev/trades/barter", as_="alice",
                         json={"gameId": str(gid), "selectedPostIds": [str(chair)]})
    assert status == 201
    assert phase_of(gid) == "barter"
    assert api.post("/dev/trades/stall", as_="alice", json={"gameId": str(gid)})[0] == 403  # not her turn

    # Both accept: close.
    assert api.post("/dev/trades/trade_details/accept", as_="bob", json={"gameId": str(gid)})[0] == 200
    assert phase_of(gid) == "barter"
    assert api.post("/dev/trades/trade_details/accept", as_="alice", json={"gameId": str(gid)})[0] == 200
    assert phase_of(gid) == "close"

    # Accepting in close needs a place and a time first.
    status, body = api.post("/dev/trades/trade_details/accept", as_="bob", json={"gameId": str(gid)})
    assert status == 400 and "place and a time" in body["error"]
    assert api.post("/dev/trades/where", as_="bob",
                    json={"gameId": str(gid), "locationId": "bob-loc"})[0] == 201
    assert api.post("/dev/trades/when", as_="alice",
                    json={"gameId": str(gid), "proposedAt": future_iso(), "label": "Tomorrow at 3"})[0] == 201
    assert api.post("/dev/trades/trade_details/accept", as_="bob", json={"gameId": str(gid)})[0] == 200
    assert api.post("/dev/trades/trade_details/accept", as_="alice", json={"gameId": str(gid)})[0] == 200
    assert phase_of(gid) == "agreed"
    assert str(gid) in ids(close_tab(api, "alice")["close"])

    # Reviews: each one moves the deal to that player's ACCEPTED TRADES.
    assert api.post("/dev/trades/review", as_="alice", json={"gameId": str(gid), "rating": 5})[0] == 201
    assert phase_of(gid) == "agreed"
    a, b = close_tab(api, "alice"), close_tab(api, "bob")
    assert str(gid) not in ids(a["close"]) and str(gid) in ids(a["completed"])
    assert a["counts"]["completed"] == 1
    assert str(gid) in ids(b["close"]) and b["counts"]["completed"] == 0

    assert api.post("/dev/trades/review", as_="bob", json={"gameId": str(gid), "rating": 3})[0] == 201
    assert phase_of(gid) == "completed"
    b = close_tab(api, "bob")
    assert b["close"] == [] and ids(b["completed"]) == {str(gid)}

    # Ratings landed on the right people.
    assert db.user_data_collection.find_one({"_id": bob["_id"]})["rating"] == 5
    assert db.user_data_collection.find_one({"_id": alice["_id"]})["rating"] == 3


def test_rescind_then_reoffer(api, user, post, phase_of):
    alice, _ = user("alice"), user("bob")
    lamp = post(alice)
    _, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    gid = gid_of(body)
    assert api.post("/dev/trades/rescind", as_="bob", json={"targetPostId": str(lamp)})[0] == 200
    assert phase_of(gid) == "open"
    status, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    assert status == 201 and gid_of(body) == gid
    assert phase_of(gid) == "offer_pending"


def test_declines_land_in_the_right_history(api, user, post):
    alice, bob = user("alice"), user("bob")
    lamp, vase, chair = post(alice, "Lamp"), post(alice, "Vase"), post(bob, "Chair")

    # Declined before bartering: Bob's DECLINED OFFERS.
    _, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    early = body["gameId"]
    assert api.post("/dev/trades/trade_details/decline", as_="alice", json={"gameId": early})[0] == 200
    _, open_tab = api.get("/dev/trades/open_tab", as_="bob")
    assert [d["game_id"] for d in open_tab["declined"]] == [early]

    # Declined during barter: DECLINED TRADES for both.
    _, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(vase)})
    late = body["gameId"]
    api.post("/dev/trades/barter", as_="alice", json={"gameId": late, "selectedPostIds": [str(chair)]})
    assert api.post("/dev/trades/trade_details/decline", as_="bob", json={"gameId": late})[0] == 200
    for who in ("alice", "bob"):
        tab = close_tab(api, who)
        assert ids(tab["declined"]) == {late} and tab["counts"]["declined"] == 1


def test_question_in_barter_locks_the_turn_until_answered(api, user, post, db):
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(alice), post(bob)
    _, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    gid = body["gameId"]
    api.post("/dev/trades/barter", as_="alice", json={"gameId": gid, "selectedPostIds": [str(chair)]})

    # Bob asks on his turn; it passes to Alice, who must answer before moving.
    status, body = api.post("/dev/trades/query", as_="bob", json={"gameId": gid, "message": "Still works?"})
    assert status == 201
    status, body = api.post("/dev/trades/stall", as_="alice", json={"gameId": gid})
    assert status == 403 and "Answer" in body["error"]
    q = db.trades_collection.find_one({"type": "query", "actor_id": bob["_id"]})
    assert api.post("/dev/trades/answer", as_="alice", json={"queryId": str(q["_id"]), "message": "Yes"})[0] == 200
    assert api.post("/dev/trades/stall", as_="alice", json={"gameId": gid})[0] == 200


def test_add_and_subtract_cards(api, user, post, db):
    alice, bob = user("alice"), user("bob")
    lamp, vase, chair, desk = post(alice), post(alice), post(bob), post(bob)
    _, body = api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})
    gid = body["gameId"]
    api.post("/dev/trades/barter", as_="alice", json={"gameId": gid, "selectedPostIds": [str(chair)]})

    # Bob adds Alice's vase; Alice takes the lamp back out (she keeps the vase).
    assert api.post("/dev/trades/add", as_="bob", json={"gameId": gid, "postId": str(vase)})[0] == 201
    assert api.post("/dev/trades/subtract", as_="alice", json={"gameId": gid, "postId": str(lamp)})[0] == 201
    cards = db.games_collection.find_one({"_id": ObjectId(gid)})["cards"]
    assert cards == {"initiator": [chair], "receiver": [vase]}

    # Bob can't remove his last item, or someone else's.
    status, body = api.post("/dev/trades/subtract", as_="bob", json={"gameId": gid, "postId": str(chair)})
    assert status == 400 and "at least one" in body["error"]
    assert api.post("/dev/trades/subtract", as_="bob", json={"gameId": gid, "postId": str(desk)})[0] == 400
