"""Things that end other games: a deal being finalized, and blocking."""



def finalize(api, gid, a, b, turn):
    """Drive a close-phase game (with where/when already logged) to agreed:
    the player whose turn it is accepts, then the other."""
    first, second = (a, b) if turn == a else (b, a)
    assert api.post("/dev/trades/trade_details/accept", as_=first, json={"gameId": str(gid)})[0] == 200
    assert api.post("/dev/trades/trade_details/accept", as_=second, json={"gameId": str(gid)})[0] == 200


def test_finalizing_declines_every_other_game_with_those_items(api, user, post, game, turn, db, phase_of):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    lamp, chair, unrelated = post(alice, "Lamp"), post(bob, "Chair"), post(alice, "Unrelated")
    deal = game(bob, alice, lamp, phase="close", initiator_cards=[chair], turn=alice)
    turn(deal, "where", alice, location={"id": "x", "name": "Library"})
    turn(deal, "when", bob, proposed_at=None, proposed_time="Tomorrow")

    offer_on_lamp = game(cara, alice, lamp, phase="offer_pending")
    question_on_lamp = game(cara, alice, lamp, phase="open")
    chair_in_barter = game(cara, bob, post(bob), phase="barter", receiver_cards=[chair], turn=cara)
    untouched = game(cara, alice, unrelated, phase="offer_pending")

    finalize(api, deal, "alice", "bob", turn="alice")
    assert phase_of(deal) == "agreed"

    for gid, credited in [(offer_on_lamp, alice), (question_on_lamp, alice), (chair_in_barter, bob)]:
        assert phase_of(gid) == "declined"
        d = db.trades_collection.find_one({"game_id": gid, "type": "decline"})
        assert (d["reason"], d["actor_id"]) == ("post_traded", credited["_id"])
    assert phase_of(untouched) == "offer_pending"


def test_traded_items_cant_be_pulled_into_new_trades(api, user, post, game):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    lamp, chair = post(alice), post(bob)
    game(bob, alice, lamp, phase="agreed", initiator_cards=[chair])

    status, body = api.post("/dev/trades/offer", as_="cara", json={"targetPostId": str(lamp)})
    assert status == 409 and "already been traded" in body["error"]

    # Cara's barter with Bob: Bob can't barter for, or Cara add, the chair.
    cara_item = post(cara)
    pending = game(bob, cara, cara_item, phase="offer_pending")
    assert api.post("/dev/trades/barter", as_="cara",
                    json={"gameId": str(pending), "selectedPostIds": [str(chair)]})[0] == 409
    barter = game(cara, bob, post(bob), phase="barter", initiator_cards=[post(cara)], turn=cara)
    assert api.post("/dev/trades/add", as_="cara", json={"gameId": str(barter), "postId": str(chair)})[0] == 409


def test_a_subtracted_target_isnt_treated_as_traded(api, user, post, game, turn, phase_of):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    lamp, vase, chair = post(alice, "Lamp"), post(alice, "Vase"), post(bob, "Chair")
    # The deal started on the lamp, but Alice swapped it for the vase.
    deal = game(bob, alice, lamp, phase="close", initiator_cards=[chair], receiver_cards=[vase], turn=alice)
    turn(deal, "where", alice, location={"id": "x"})
    turn(deal, "when", bob, proposed_time="Tomorrow")
    other_offer = game(cara, alice, lamp, phase="offer_pending")

    finalize(api, deal, "alice", "bob", turn="alice")
    assert phase_of(other_offer) == "offer_pending"
    assert api.post("/dev/trades/offer", as_="cara", json={"targetPostId": str(post(alice))})[0] == 201


def test_blocking_declines_all_shared_games_and_hides_posts(api, user, post, game, phase_of):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    shared = [game(alice, bob, post(bob), phase=p) for p in ("open", "offer_pending", "barter", "close", "agreed")]
    done = game(alice, bob, post(bob), phase="completed")
    other = game(alice, cara, post(cara), phase="barter")

    status, body = api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})
    assert status == 200 and body["declinedTrades"] == len(shared)
    assert all(phase_of(g) == "declined" for g in shared)
    assert phase_of(done) == "completed" and phase_of(other) == "barter"

    # Neither sees the other's posts, and offers / questions are refused.
    _, feed = api.get("/dev/feed", as_="bob")
    assert all(p["user_id"] != str(alice["_id"]) for p in feed)
    lamp = post(alice)
    assert api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})[0] == 403
    assert api.post("/dev/trades/query", as_="bob", json={"targetPostId": str(lamp), "message": "hi"})[0] == 403

    # Unblocking lets them trade again; declined games stay declined.
    assert api.delete(f"/dev/block/{bob['_id']}", as_="alice")[0] == 200
    assert api.post("/dev/trades/offer", as_="bob", json={"targetPostId": str(lamp)})[0] == 201
    assert all(phase_of(g) == "declined" for g in shared)


def test_cascade_decline_wins_against_a_racing_move(user, post, game, db, phase_of):
    """A player's move saved between the cascade loading a game and saving
    it must not leave the game alive."""
    from models.game import Game
    alice, bob = user("alice"), user("bob")
    gid = game(alice, bob, post(bob), phase="barter", turn=alice)

    real_get, raced = Game.get, []

    def get_with_race(game_id):
        g = real_get(game_id)
        if not raced:  # someone moves right after the first load
            raced.append(True)
            db.games_collection.update_one({"_id": game_id}, {"$inc": {"rev": 1}})
        return g

    Game.get = classmethod(lambda cls, i: get_with_race(i))
    try:
        assert Game.force_decline(gid, lambda g: alice["_id"], "blocked") is True
    finally:
        Game.get = real_get
    assert phase_of(gid) == "declined"
    assert db.trades_collection.count_documents({"game_id": gid, "type": "decline"}) == 1
