from flask import Blueprint, jsonify
from backend import user_data_collection, posts_collection, games_collection, trades_collection
from helpers import get_uid_from_request, serialize_post

trades_incoming_bp = Blueprint("trades_incoming", __name__)

@trades_incoming_bp.route("/dev/trades/incoming", methods=["GET"])
def get_incoming_offers():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    games = list(
        games_collection.find({
            "receiver_user_id": user["_id"],
            "phase": "offer_pending",
        })
    )

    results = []
    for game in games:
        target_post = posts_collection.find_one({"_id": game["target_post_id"]})
        offerer = user_data_collection.find_one({"_id": game["initiator_user_id"]})

        if not target_post or not offerer:
            continue

        results.append({
            "gameId": str(game["_id"]),
            "targetPostId": str(game["target_post_id"]),
            "fromUserId": str(game["initiator_user_id"]),
            "fromUserName": offerer.get("first_name", ""),
            # Your own questions to the offerer (and their answers), oldest
            # first, for the profile deck's turn log.
            "myQueries": [
                _query_summary(q) for q in trades_collection.find({
                    "game_id": game["_id"], "type": "query", "actor_id": user["_id"],
                }).sort("created_at", 1)
            ],
        })

    return jsonify(results), 200


trades_incoming_queries_bp = Blueprint("trades_incoming_queries", __name__)

@trades_incoming_queries_bp.route("/dev/trades/incoming_queries", methods=["GET"])
def get_incoming_queries():
    """Unanswered questions the other player asked you in games that haven't
    reached barter, for the profile's queries drawer: questions about your
    posts from people browsing, and, if you made an offer, the post owner's
    questions about your posts."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    games = list(
        games_collection.find({
            "$or": [{"receiver_user_id": user["_id"]}, {"initiator_user_id": user["_id"]}],
            "phase": {"$in": ["open", "offer_pending"]},
        }, {"_id": 1})
    )
    if not games:
        return jsonify([]), 200

    queries = list(
        trades_collection.find({
            "game_id": {"$in": [g["_id"] for g in games]},
            "type": "query",
            # Not your own questions (those are the other player's to answer).
            "actor_id": {"$ne": user["_id"]},
            "answered_at": None,
        }).sort("created_at", 1)
    )

    askers = {u["_id"]: u for u in user_data_collection.find(
        {"_id": {"$in": list({q["actor_id"] for q in queries})}}, {"first_name": 1})}
    posts = {p["_id"]: p for p in posts_collection.find(
        {"_id": {"$in": [q.get("target_post_id") for q in queries]}})}

    results = []
    for q in queries:
        asker = askers.get(q["actor_id"])
        target_post = posts.get(q.get("target_post_id"))
        results.append({
            "tradeId": str(q["_id"]),
            "gameId": str(q["game_id"]),
            "targetPostId": str(q.get("target_post_id")),
            "fromUserId": str(q["actor_id"]),
            "fromUserName": asker.get("first_name", "") if asker else "",
            "itemName": target_post.get("post_title", target_post.get("name", "")) if target_post else "",
            "question": q.get("messages", [{}])[0].get("message", ""),
        })

    return jsonify(results), 200


def _query_summary(q):
    """A question and its answer (the first reply), if any."""
    messages = q.get("messages") or []
    return {
        "tradeId": str(q["_id"]),
        "question": messages[0].get("message", "") if messages else "",
        "answer": messages[1].get("message", "") if len(messages) > 1 else None,
    }
