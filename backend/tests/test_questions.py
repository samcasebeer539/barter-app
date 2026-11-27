"""Questions (QUERY) in every situation: browsing someone's post, a post
owner asking the person who made an offer, and questions as turns in
barter / close."""
from bson import ObjectId


def queries_tab(api, who):
    return api.get("/dev/trades/open_tab", as_=who)[1]["queries"]


def test_asking_about_a_post_from_the_feed(api, user, post, db, phase_of):
    alice, bob = user("alice"), user("bob")
    lamp = post(bob, "Lamp")
    status, body = api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "Size?"})
    assert status == 201
    gid = ObjectId(body["gameId"])
    assert phase_of(gid) == "open"  # a question alone doesn't make an offer

    # Alice sees it in her QUERIES (both in the open tab and GET /dev/trades/query);
    # Bob sees it waiting for an answer.
    assert [q["post"]["post_title"] for q in queries_tab(api, "alice")] == ["Lamp"]
    assert [q["messages"][0]["message"] for q in api.get("/dev/trades/query", as_="alice")[1]] == ["Size?"]
    assert [q["question"] for q in api.get("/dev/trades/incoming_queries", as_="bob")[1]] == ["Size?"]

    # Asking again about the same post stays in the same game.
    _, again = api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "Color?"})
    assert again["gameId"] == body["gameId"]


def test_owner_asks_the_person_who_offered(api, user, post, game, turn, db):
    """Profile deck: Bob offered on Alice's lamp; Alice asks about one of
    Bob's posts before deciding. Not a turn: nothing is locked."""
    alice, bob = user("alice"), user("bob")
    lamp, chair = post(alice, "Lamp"), post(bob, "Chair")
    gid = game(bob, alice, lamp, phase="offer_pending")

    status, _ = api.post("/dev/trades/query", as_="alice",
                         json={"gameId": str(gid), "targetPostId": str(chair), "message": "Any scratches?"})
    assert status == 201
    q = db.trades_collection.find_one({"type": "query", "actor_id": alice["_id"]})
    assert q["target_post_id"] == chair and not q.get("in_turn")
    assert db.games_collection.find_one({"_id": gid})["phase"] == "offer_pending"

    # It shows in Bob's incoming questions and in Alice's own QUERIES.
    assert [i["question"] for i in api.get("/dev/trades/incoming_queries", as_="bob")[1]] == ["Any scratches?"]
    assert "Any scratches?" in str(queries_tab(api, "alice"))
    # And on the offer in Alice's profile deck.
    _, page = api.get("/dev/profile_page", as_="alice")
    assert page["incomingOffers"][0]["myQueries"][0]["question"] == "Any scratches?"

    # Bob answers; Alice can still barter right away.
    api.post("/dev/trades/answer", as_="bob", json={"queryId": str(q["_id"]), "message": "None"})
    assert api.post("/dev/trades/barter", as_="alice",
                    json={"gameId": str(gid), "selectedPostIds": [str(chair)]})[0] == 201


def test_owner_question_must_be_about_one_of_their_posts(api, user, post, game):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    lamp = post(alice)
    gid = str(game(bob, alice, lamp, phase="offer_pending"))
    ask = lambda target: api.post("/dev/trades/query", as_="alice",  # noqa: E731
                                  json={"gameId": gid, "message": "?", **({"targetPostId": target} if target else {})})
    assert ask(None)[0] == 400                    # must pick a post
    assert ask(str(lamp))[0] == 400               # her own
    assert ask(str(post(cara)))[0] == 400         # someone else's
    assert ask(str(ObjectId()))[0] == 400         # doesn't exist


def test_outsider_cant_ask_inside_a_game(api, user, post, game):
    alice, bob, _ = user("alice"), user("bob"), user("eve")
    gid = str(game(bob, alice, post(alice), phase="barter"))
    assert api.post("/dev/trades/query", as_="eve", json={"gameId": gid, "message": "?"})[0] == 403


def test_question_in_barter_aimed_at_a_card(api, user, post, game, db):
    alice, bob = user("alice"), user("bob")
    lamp, chair, spare = post(alice), post(bob), post(bob)
    gid = str(game(bob, alice, lamp, phase="barter", initiator_cards=[chair], turn=alice))
    ask = lambda target: api.post("/dev/trades/query", as_="alice",  # noqa: E731
                                  json={"gameId": gid, "message": "?", "targetPostId": str(target)})
    assert ask(lamp)[0] == 400   # her own card
    assert ask(spare)[0] == 400  # Bob's, but not in this trade
    assert ask(chair)[0] == 201
    q = db.trades_collection.find_one({"type": "query"})
    assert (q["target_post_id"], q["in_turn"]) == (chair, True)


def test_question_in_barter_needs_your_turn(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    gid = str(game(bob, alice, post(alice), phase="barter", turn=bob))
    assert api.post("/dev/trades/query", as_="alice", json={"gameId": gid, "message": "?"})[0] == 403


def test_feed_question_on_a_post_already_in_barter_becomes_a_turn(api, user, post, game, db):
    """Asking from the feed about a post you're already bartering for goes
    through the in-game rules: it's a turn, and it locks the other player."""
    alice, bob = user("alice"), user("bob")
    lamp = post(bob)
    gid = game(alice, bob, lamp, phase="barter", turn=alice)
    status, body = api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "Still?"})
    assert status == 201 and body["gameId"] == str(gid)
    assert db.trades_collection.find_one({"type": "query"})["in_turn"] is True
    g = db.games_collection.find_one({"_id": gid})
    assert g["turn_user_id"] == bob["_id"]
    # Not Alice's turn any more, so asking again from the feed is refused.
    assert api.post("/dev/trades/query", as_="alice", json={"targetPostId": str(lamp), "message": "?"})[0] == 403


def test_questions_need_text(api, user, post, game):
    alice, bob = user("alice"), user("bob")
    lamp = str(post(bob))
    assert api.post("/dev/trades/query", as_="alice", json={"targetPostId": lamp})[0] == 400
    gid = str(game(alice, bob, post(bob), phase="barter", turn=alice))
    assert api.post("/dev/trades/query", as_="alice", json={"gameId": gid, "message": "   "})[0] == 400
