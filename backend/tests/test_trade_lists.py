"""What the barter page's tabs list, and smaller route edge cases."""
from datetime import datetime, timezone


OLD = datetime(2020, 1, 1, tzinfo=timezone.utc)


def test_open_tab_lists_your_questions_offers_and_declines(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    asked, offered, declined = post(bob, "Asked"), post(bob, "Offered"), post(bob, "Declined")
    q_game = game(alice, bob, asked, phase="open")
    turn(q_game, "query", alice, target_post_id=asked, messages=[{"message": "?"}])
    o_game = game(alice, bob, offered, phase="offer_pending")
    turn(o_game, "offer", alice, target_post_id=offered)
    d_game = game(alice, bob, declined, phase="declined")
    turn(d_game, "offer", alice, target_post_id=declined)
    turn(d_game, "decline", bob)

    _, tab = api.get("/dev/trades/open_tab", as_="alice")
    assert [q["post"]["post_title"] for q in tab["queries"]] == ["Asked"]
    assert [o["game_id"] for o in tab["offers"]] == [str(o_game)]
    assert [d["post"]["post_title"] for d in tab["declined"]] == ["Declined"]
    assert tab["declined"][0]["partner_name"] == "Bob"

    # Offering on the declined post again takes it out of DECLINED OFFERS.
    api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(declined)})
    assert api.get("/dev/trades/open_tab", as_="alice")[1]["declined"] == []


def test_offering_twice_is_the_same_offer(api, user, post, db):
    user("alice")
    lamp = post(user("bob"))
    first = api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(lamp)})
    second = api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(lamp)})
    assert (first[0], second[0]) == (201, 200) and first[1]["tradeId"] == second[1]["tradeId"]
    assert db.trades_collection.count_documents({"type": "offer"}) == 1


def test_rescind_with_no_offer(api, user, post):
    user("alice")
    assert api.post("/dev/trades/rescind", as_="alice", json={"targetPostId": str(post(user("bob")))})[0] == 404


def test_answer_rules(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    gid = game(alice, bob, post(bob), phase="open")
    q = str(turn(gid, "query", alice, messages=[{"message": "?"}], answered_at=None))
    assert api.post("/dev/trades/answer", as_="alice", json={"queryId": q, "message": "me"})[0] == 400
    assert api.post("/dev/trades/answer", as_="bob", json={"queryId": "nope", "message": "x"})[0] == 400
    assert api.post("/dev/trades/answer", as_="bob", json={"queryId": q, "message": " "})[0] == 400
    assert api.post("/dev/trades/answer", as_="bob", json={"queryId": q, "message": "Yes"})[0] == 200
    assert api.post("/dev/trades/answer", as_="bob", json={"queryId": q, "message": "Again"})[0] == 409

    ended = game(alice, bob, post(bob), phase="declined")
    q2 = str(turn(ended, "query", alice, messages=[{"message": "?"}], answered_at=None))
    assert api.post("/dev/trades/answer", as_="bob", json={"queryId": q2, "message": "Late"})[0] == 409


def test_overdue_games_are_declined_when_any_list_loads(api, user, post, game, phase_of):
    alice, bob = user("alice"), user("bob")
    in_barter = game(alice, bob, post(bob), phase="barter", turn_started_at=OLD)
    in_close = game(alice, bob, post(bob), phase="close", turn_started_at=OLD)
    api.get("/dev/trades/barter", as_="alice")
    api.get("/dev/trades/close", as_="alice")
    assert phase_of(in_barter) == phase_of(in_close) == "declined"

    other = game(alice, bob, post(bob), phase="barter", turn_started_at=OLD)
    api.get(f"/dev/trades/trade_details/get_trade?gameId={other}", as_="alice")
    assert phase_of(other) == "declined"


def test_history_route(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    assert api.get("/dev/trades/history?status=other", as_="alice")[0] == 400
    done = game(alice, bob, post(bob), phase="completed")
    # Declined before barter isn't a DECLINED TRADE; after barter it is.
    early = game(alice, bob, post(bob), phase="declined")
    late = game(alice, bob, post(bob), phase="declined")
    turn(late, "barter", bob)
    assert [g["gameId"] for g in api.get("/dev/trades/history?status=completed", as_="alice")[1]] == [str(done)]
    assert [g["gameId"] for g in api.get("/dev/trades/history?status=declined", as_="alice")[1]] == [str(late)]
    assert str(early) not in str(api.get("/dev/trades/close_tab?history=1", as_="alice")[1]["declined"])


def test_close_list_is_204_when_unchanged(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = game(alice, bob, post(bob), phase="close", turn=alice)
    api.get("/dev/trades/close", as_="alice")
    version = api.last.headers["X-Version"]
    assert api.get("/dev/trades/close", as_="alice", headers={"X-Known-Version": version})[0] == 204
    api.post("/dev/trades/where", as_="alice", json={"gameId": str(gid), "locationId": "alice-loc"})
    assert api.get("/dev/trades/close", as_="alice", headers={"X-Known-Version": version})[0] == 200


def test_get_trade_returns_the_turn_log(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    gid = game(alice, bob, post(bob), phase="barter", turn=alice)
    turn(gid, "offer", alice), turn(gid, "barter", bob)
    status, body = api.get(f"/dev/trades/trade_details/get_trade?gameId={gid}", as_="bob")
    assert status == 200 and [t["type"] for t in body["turns"]] == ["offer", "barter"]
    assert body["turn_deadline"] is not None


def test_deleting_a_post_cleans_up_its_photos(api, user, post, db):
    from conftest import storage_calls
    alice = user("alice")
    lamp = post(alice)
    assert api.delete(f"/dev/posts/{lamp}", as_="alice")[0] == 200
    assert db.posts_collection.find_one({"_id": lamp}) is None
    assert lamp not in db.user_data_collection.find_one({"_id": alice["_id"]})["posts"]
    assert ("list_blobs", f"post_photos/alice/{lamp}/") in storage_calls


def test_cant_edit_or_delete_someone_elses_post(api, user, post, db):
    user("alice")
    lamp = post(user("bob"), "Lamp")
    api.patch(f"/dev/posts/{lamp}", as_="alice", json={"post_title": "Mine now"})
    api.delete(f"/dev/posts/{lamp}", as_="alice")
    assert db.posts_collection.find_one({"_id": lamp})["post_title"] == "Lamp"


def test_open_tab_cards_carry_the_whole_game_history(api, user, post):
    """QUERIES and OFFERS cards show everything that happened in that game:
    your questions and their answers, their questions to you, the offer."""
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(bob, "Lamp"), post(alice, "Chair")

    api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "Dimmable?"})
    _, offer = api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(lamp)})
    gid = offer["gameId"]
    q = api.get("/dev/trades/incoming_queries", as_="bob")[1][0]
    api.post("/dev/trades/answer", as_="bob", json={"queryId": q["tradeId"], "message": "Yes"})
    # Bob (the owner) asks Alice about her chair before deciding.
    api.post("/dev/trades/query", as_="bob", json={"gameId": gid, "targetPostId": str(chair), "message": "Scratches?"})

    _, tab = api.get("/dev/trades/open_tab", as_="alice")
    for card in (tab["offers"][0], tab["queries"][0]):
        assert [t["type"] for t in card["turns"]] == ["query", "offer", "query"]
        assert card["turns"][0]["messages"][1]["message"] == "Yes"          # Bob's answer
        assert card["turns"][2]["actor_id"] == str(bob["_id"])               # Bob's question
        assert (card["my_id"], card["partner_name"]) == (str(alice["_id"]), "Bob")
        assert {p["post_title"] for p in card["turn_posts"]} == {"Lamp", "Chair"}


def test_owner_asking_an_offerer_sees_the_history_too(api, user, post):
    """Questions you asked someone who offered on your post are in your
    QUERIES; the card's partner is the offerer."""
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(bob, "Lamp"), post(alice, "Chair")
    _, offer = api.post("/dev/trades/offer", as_="alice", json={"targetPostId": str(lamp)})
    api.post("/dev/trades/query", as_="bob", json={"gameId": offer["gameId"], "targetPostId": str(chair), "message": "Size?"})
    card = api.get("/dev/trades/open_tab", as_="bob")[1]["queries"][0]
    assert card["partner_name"] == "Alice" and [t["type"] for t in card["turns"]] == ["offer", "query"]


def test_declined_cards_name_the_posts_in_their_history(api, user, post, game, turn):
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(bob, "Lamp"), post(alice, "Chair")
    gid = game(alice, bob, lamp, phase="declined")
    turn(gid, "offer", alice, target_post_id=lamp)
    turn(gid, "query", bob, target_post_id=chair, messages=[{"message": "?"}])
    turn(gid, "decline", bob)
    card = api.get("/dev/trades/open_tab", as_="alice")[1]["declined"][0]
    assert {p["post_title"] for p in card["turn_posts"]} == {"Lamp", "Chair"}
