from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, serialize_trade

trades_detail_get_trade_bp = Blueprint("trades_detail_get_trade", __name__)

@trades_detail_get_trade_bp.route("/dev/trades/trade_details/get_trade", methods=["GET"])
def get_trade(trade_id):
    # Get current trade
    uid, err = get_uid_from_request()
    if err:
        return err

    trade = trades_collection.find_one({
        "_id": ObjectId(trade_id)
    })

    if not trade:
        return jsonify({"error": "Trade not found"}), 404

    return jsonify(serialize_trade(trade)), 200