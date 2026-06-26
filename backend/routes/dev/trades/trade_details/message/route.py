from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, serialize_trade

trades_detail_message_bp = Blueprint("trades_detail_message", __name__)

@trades_detail_message_bp.route("/dev/trades/trade_details/message", methods=["POST"])
def add_message(trade_id):
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    data = request.json

    message = data.get("message")

    if not message:
        return jsonify({"error": "message required"}), 400

    trade = trades_collection.find_one({
        "_id": ObjectId(trade_id)
    })

    if not trade:
        return jsonify({"error": "Trade not found"}), 404

    trades_collection.update_one(
        {"_id": ObjectId(trade_id)},
        {
            "$push": {
                "messages": {
                    "sender_id": user["_id"],
                    "message": message,
                    "created_at": datetime.now(timezone.utc)
                }
            }
        }
    )

    return jsonify({"success": True}), 200

