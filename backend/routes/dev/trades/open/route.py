from flask import Blueprint, jsonify
from backend import user_data_collection, trades_collection, posts_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade

trades_open_bp = Blueprint("trades_open", __name__)

@trades_open_bp.route("/dev/trades/open", methods=["GET"])
def get_open_trades():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    trades = list(
        trades_collection.find({
            "initiator_user_id": user["_id"],
            "status": "open"
        })
    )

    for i in range(len(trades)):
        trades[i] = serialize_trade(trades[i])
        post = posts_collection.find_one({
            "_id": trades[i].get("offered_post_id")
        })
        print(f"{post=}")
        if post:
            post["_id"] = str(post["_id"])
            post["photos"] = [post.get("image", [])]
            trades[i]["post"] = post

    return jsonify(trades), 200
