from flask import Blueprint, jsonify
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request

trades_barter_bp = Blueprint("trades_barter", __name__)

@trades_barter_bp.route("/dev/trades/barter", methods=["GET"])
def get_barter_trades():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    trades = list(
        trades_collection.find({
            "receiver_user_id": user["_id"],
            "status": "open"
        })
    )

    for t in trades:
        t["_id"] = str(t["_id"])

    return jsonify(trades), 200
