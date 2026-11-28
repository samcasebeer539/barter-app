from flask import Blueprint, jsonify
from backend import user_data_collection, posts_collection, games_collection, trades_collection
from helpers import get_uid_from_request, current_user

trades_incoming_bp = Blueprint("trades_incoming", __name__)

@trades_incoming_bp.route("/dev/trades/incoming", methods=["GET"])
def get_incoming_offers():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(incoming_offers_for(user)), 200


def incoming_offers_for(user):
    """Pending offers on your posts, as GET /dev/trades/incoming sends them.
    Posts, offerers and your questions are each fetched in one query."""
    games = list(
        games_collection.find({
            "receiver_user_id": user["_id"],
            "phase": "offer_pending",
        })
    )
    if not games:
        return []
    game_ids = [g["_id"] for g in games]
    posts = {p["_id"] for p in posts_collection.find(
        {"_id": {"$in": [g["target_post_id"] for g in games]}}, {"_id": 1})}
    offerers = {u["_id"]: u for u in user_data_collection.find(
        {"_id": {"$in": [g["initiator_user_id"] for g in games]}}, {"first_name": 1})}
    my_queries = {gid: [] for gid in game_ids}
    for q in trades_collection.find({
        "game_id": {"$in": game_ids}, "type": "query", "actor_id": user["_id"],
    }).sort("created_at", 1):
        my_queries[q["game_id"]].append(_query_summary(q))

    results = []
    for game in games:
        offerer = offerers.get(game["initiator_user_id"])
        if game["target_post_id"] not in posts or not offerer:
            continue
        results.append({
            "gameId": str(game["_id"]),
            "targetPostId": str(game["target_post_id"]),
            "fromUserId": str(game["initiator_user_id"]),
            "fromUserName": offerer.get("first_name", ""),
            # Your own questions to the offerer (and their answers), oldest
            # first, for the profile deck's turn log.
            "myQueries": my_queries[game["_id"]],
        })
    return results


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

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(incoming_queries_for(user)), 200


def incoming_queries_for(user):
    """Unanswered questions to you, as GET /dev/trades/incoming_queries sends them."""
    games = list(
        games_collection.find({
            "$or": [{"receiver_user_id": user["_id"]}, {"initiator_user_id": user["_id"]}],
            "phase": {"$in": ["open", "offer_pending"]},
        }, {"_id": 1})
    )
    if not games:
        return []

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

    return results


def _query_summary(q):
    """A question and its answer (the first reply), if any."""
    messages = q.get("messages") or []
    return {
        "tradeId": str(q["_id"]),
        "question": messages[0].get("message", "") if messages else "",
        "answer": messages[1].get("message", "") if len(messages) > 1 else None,
    }
