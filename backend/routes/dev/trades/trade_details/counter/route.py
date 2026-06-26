from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, serialize_trade

trades_detail_counter_bp = Blueprint("trades_detail_counter", __name__)

@trades_detail_counter_bp.route("/dev/trades/trade_details/counter", methods=["POST"])
def counter_trade(trade_id):
    # Adds a counter offer
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({
        "firebase_uid": uid
    })

    data = request.json

    counter_post_id = data.get("counterPostId")

    if not counter_post_id:
        return jsonify({"error": "counterPostId required"}), 400

    trade = trades_collection.find_one({
        "_id": ObjectId(trade_id)
    })

    if not trade:
        return jsonify({"error": "Trade not found"}), 404

    trades_collection.update_one(
        {"_id": ObjectId(trade_id)},
        {
            "$push": {
                "counter_offers": {
                    "sender_id": user["_id"],
                    "counter_post_id": ObjectId(counter_post_id),
                    "created_at": datetime.now(timezone.utc)
                }
            }
        }
    )

    return jsonify({"success": True}), 200