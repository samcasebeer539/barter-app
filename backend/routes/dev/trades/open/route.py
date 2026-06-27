from flask import Blueprint, jsonify
from backend import user_data_collection, trades_collection, posts_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade

trades_open_bp = Blueprint("trades_open", __name__)

@trades_open_bp.route("/dev/trades/open", methods=["GET"])
def get_open_trades():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    trades = list(
        trades_collection.find({
            "initiator_user_id": user["_id"],
            "type": "offer",
            "status": "open"
        })
    )

    for i in range(len(trades)):
        offered_post_id = trades[i].get("offered_post_id")
        post = posts_collection.find_one({"_id": offered_post_id})

        trades[i] = serialize_trade(trades[i])

        if post:
            trades[i]["post"] = serialize_post(post)

    return jsonify(trades), 200