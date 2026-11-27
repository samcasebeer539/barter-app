"""Blocking and reporting (the cascade of declines is in test_cascades)."""
from bson import ObjectId


def test_block_rules(api, user):
    alice, bob, cara = user("alice"), user("bob"), user("cara")
    assert api.post("/dev/block", as_="alice", json={"userId": str(alice["_id"])})[0] == 400
    assert api.post("/dev/block", as_="alice", json={"userId": str(ObjectId())})[0] == 404
    assert api.post("/dev/block", as_="alice", json={"userId": "nope"})[0] == 404
    api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})
    api.post("/dev/block", as_="alice", json={"userId": str(bob["_id"])})  # twice: no duplicate
    api.post("/dev/block", as_="alice", json={"userId": str(cara["_id"])})
    status, blocked = api.get("/dev/blocked", as_="alice")
    assert status == 200 and [u["first_name"] for u in blocked] == ["Bob", "Cara"]
    assert all("firebase_uid" not in u and "blocked_user_ids" not in u for u in blocked)

    api.delete(f"/dev/block/{bob['_id']}", as_="alice")
    assert [u["first_name"] for u in api.get("/dev/blocked", as_="alice")[1]] == ["Cara"]


def test_report_a_user_or_post(api, user, post, db):
    alice, bob = user("alice"), user("bob")
    lamp = post(bob)

    status, body = api.post("/dev/report", as_="alice", json={"postId": str(lamp), "reason": "scam", "note": " fake "})
    assert status == 201 and body["reportedUserId"] == str(bob["_id"])  # taken from the post
    r = db.reports_collection.find_one()
    assert (r["reporter_id"], r["post_id"], r["note"], r["status"]) == (alice["_id"], lamp, "fake", "open")

    assert api.post("/dev/report", as_="alice", json={"userId": str(bob["_id"]), "reason": "spam"})[0] == 201


def test_report_input(api, user, post, db):
    alice, bob = user("alice"), user("bob")
    assert api.post("/dev/report", as_="alice", json={"userId": str(bob["_id"]), "reason": "meh"})[0] == 400
    assert api.post("/dev/report", as_="alice", json={"userId": str(alice["_id"]), "reason": "spam"})[0] == 400
    assert api.post("/dev/report", as_="alice", json={"postId": str(ObjectId()), "reason": "spam"})[0] == 404
    assert api.post("/dev/report", as_="alice", json={"reason": "spam"})[0] == 404
    api.post("/dev/report", as_="alice", json={"userId": str(bob["_id"]), "reason": "other", "note": "x" * 5000})
    assert len(db.reports_collection.find_one({"reason": "other"})["note"]) == 1000
