from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, serialize_trade

trades_detail_decline_bp = Blueprint("trades_detail_decline", __name__)


@trades_detail_decline_bp.route("/dev/trades/trade_details/decline", methods=["POST"])
def decline_trade(trade_id):
    # Declines and closes the trade
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    trade = trades_collection.find_one({
        "_id": ObjectId(trade_id)
    })

    if not trade:
        return jsonify({"error": "Trade not found"}), 404

    if str(trade["receiver_user_id"]) != str(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403

    trades_collection.update_one(
        {"_id": ObjectId(trade_id)},
        {
            "$set": {
                "status": "declined",
                "declined_at": datetime.now(timezone.utc)
            }
        }
    )

    return jsonify({"success": True}), 200