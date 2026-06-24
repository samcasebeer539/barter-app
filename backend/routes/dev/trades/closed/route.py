from flask import Blueprint, jsonify
from backend import user_data_collection, trades_collection

from helpers import get_uid_from_request

trades_closed_bp = Blueprint("trades_closed", __name__)

@trades_closed_bp.route("/dev/trades/closed", methods=["GET"])
def get_closed_trades():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    trades = list(
        trades_collection.find({
            "$or": [
                {"initiator_user_id": user["_id"]},
                {"receiver_user_id": user["_id"]}
            ],
            "status": {
                "$in": ["closed", "declined"]
            }
        })
    )

    for t in trades:
        t["_id"] = str(t["_id"])

    return jsonify(trades), 200

