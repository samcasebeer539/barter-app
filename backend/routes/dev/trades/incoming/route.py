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
        })

    return jsonify(results), 200


trades_incoming_queries_bp = Blueprint("trades_incoming_queries", __name__)

@trades_incoming_queries_bp.route("/dev/trades/incoming_queries", methods=["GET"])
def get_incoming_queries():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    games = list(
        games_collection.find({
            "receiver_user_id": user["_id"],
            "phase": {"$in": ["open", "offer_pending"]},
        })
    )
    game_ids_by_id = {g["_id"]: g for g in games}

    if not game_ids_by_id:
        return jsonify([]), 200

    queries = list(
        trades_collection.find({
            "game_id": {"$in": list(game_ids_by_id.keys())},
            "type": "query",
        }).sort("created_at", 1)
    )

    results = []
    for q in queries:
        game = game_ids_by_id[q["game_id"]]
        asker = user_data_collection.find_one({"_id": game["initiator_user_id"]})
        target_post = posts_collection.find_one({"_id": q.get("target_post_id")})

        results.append({
            "gameId": str(q["game_id"]),
            "targetPostId": str(q.get("target_post_id")),
            "fromUserId": str(game["initiator_user_id"]),
            "fromUserName": asker.get("first_name", "") if asker else "",
            "itemName": target_post.get("post_title", target_post.get("name", "")) if target_post else "",
            "question": q.get("messages", [{}])[0].get("message", ""),
        })

    return jsonify(results), 200