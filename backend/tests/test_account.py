"""Deleting your account."""
from bson import ObjectId

import conftest


def test_deleting_an_account_removes_it_and_ends_its_trades(api, user, post, game, turn, db, phase_of):
    alice, bob, cara = user("alice"), user("bob", blocked_user_ids=[]), user("cara")
    lamp, vase, chair = post(alice, "Lamp"), post(alice, "Vase"), post(bob, "Chair")
    conftest.storage_files.update({
        f"post_photos/alice/{lamp}/1_0", f"post_photos/alice/{vase}/1_0", "profile_photos/alice.jpg",
        f"post_photos/bob/{chair}/1_0", "profile_photos/bob.jpg", "profile_photos/alicex.jpg",
    })
    in_barter = game(bob, alice, lamp, phase="barter", initiator_cards=[chair])
    agreed = game(alice, cara, post(cara, "Rug"), phase="agreed", initiator_cards=[vase])
    done = game(bob, alice, vase, phase="completed")
    turn(done, "review", alice, reviewed_user_id=bob["_id"], rating=5)
    db.user_data_collection.update_one({"_id": bob["_id"]}, {"$set": {"blocked_user_ids": [alice["_id"]]}})

    status, body = api.delete("/dev/account", as_="alice")
    assert status == 200 and body == {"success": True, "declinedTrades": 2, "deletedPosts": 2}

    # Gone: sign-in, profile, posts, her photos (not anyone else's).
    assert conftest.deleted_sign_ins == ["alice"]
    assert db.user_data_collection.find_one({"_id": alice["_id"]}) is None
    assert db.posts_collection.count_documents({"user_id": alice["_id"]}) == 0
    assert conftest.storage_files == {f"post_photos/bob/{chair}/1_0", "profile_photos/bob.jpg", "profile_photos/alicex.jpg"}
    # Ongoing trades are declined for the others; finished ones stay as history.
    assert phase_of(in_barter) == phase_of(agreed) == "declined"
    d = db.trades_collection.find_one({"game_id": in_barter, "type": "decline"})
    assert (d["reason"], d["actor_id"]) == ("account_deleted", alice["_id"])
    assert phase_of(done) == "completed"
    # The agreed deal's other side is back in the feed (no longer traded).
    assert "Rug" in [p["post_title"] for p in api.get("/dev/feed", as_="bob")[1]]
    # Off Bob's block list; her review of him still counts, from a "Former member".
    assert db.user_data_collection.find_one({"_id": bob["_id"]})["blocked_user_ids"] == []
    assert api.get(f"/dev/users/{bob['_id']}/reviews", as_="cara")[1][0]["reviewerName"] == "Former member"


def test_if_the_sign_in_cant_be_deleted_nothing_is(api, user, post, game, db, phase_of):
    alice, bob = user("alice"), user("bob")
    lamp = post(alice)
    g = game(bob, alice, lamp, phase="barter")
    conftest.fail_sign_in_delete.append(True)
    status, body = api.delete("/dev/account", as_="alice")
    assert status == 502 and "Nothing was deleted" in body["error"]
    assert db.user_data_collection.find_one({"_id": alice["_id"]}) is not None
    assert db.posts_collection.find_one({"_id": lamp}) is not None
    assert phase_of(g) == "barter"


def test_needs_an_account(api):
    assert api.delete("/dev/account")[0] == 401
    assert api.delete("/dev/account", as_="ghost")[0] == 404


def test_signing_up_again_after_deleting_starts_fresh(api, user, post, db):
    alice = user("alice")
    post(alice)
    api.delete("/dev/account", as_="alice")
    status, _ = api.post("/dev/create_user", as_="alice", json={"firstName": "Alice", "lastName": "New"})
    assert status == 201
    assert db.user_data_collection.find_one({"firebase_uid": "alice"})["_id"] != alice["_id"]
    assert api.get("/dev/posts", as_="alice")[1] == []
