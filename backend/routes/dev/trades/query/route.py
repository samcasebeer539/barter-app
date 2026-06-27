from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade

trades_query_bp = Blueprint("trades_query", __name__)

@trades_query_bp.route("/dev/trades/query", methods=["GET"])
def get_queries():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    queries = list(
        trades_collection.find({
            "initiator_user_id": user["_id"],
            "type": "query",
            "status": "open"
        })
    )

    for i in range(len(queries)):
        queries[i] = serialize_trade(queries[i])

        post = posts_collection.find_one({
            "_id": ObjectId(queries[i]["target_post_id"])
        })

        if post:
            queries[i]["post"] = serialize_post(post)


    return jsonify(queries), 200

@trades_query_bp.route("/dev/trades/query", methods=["POST"])
def create_query():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    data = request.json

    target_post_id = data.get("targetPostId")
    message = data.get("message")

    if not target_post_id or not message:
        return jsonify({"error": "Missing fields"}), 400

    target_post = posts_collection.find_one({
        "_id": ObjectId(target_post_id)
    })

    if not target_post:
        return jsonify({"error": "Post not found"}), 404

    trade = {
        "type": "query",
        "status": "open",
        "created_at": datetime.now(timezone.utc),
        "initiator_user_id": user["_id"],
        "receiver_user_id": target_post["user_id"],
        "target_post_id": target_post["_id"],
        "messages": [
            {
                "sender_id": user["_id"],
                "message": message,
                "created_at": datetime.now(timezone.utc)
            }
        ],
        "completed_at": None
    }

    result = trades_collection.insert_one(trade)

    return jsonify({
        "success": True,
        "tradeId": str(result.inserted_id)
    }), 201
