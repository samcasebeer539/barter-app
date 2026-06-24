from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request

trades_detail_bp = Blueprint("trades_detail", __name__)

def serialize_trade(trade):
    # Ensures trades are serialized as strings
    trade["_id"] = str(trade["_id"])

    for key in [
        "initiator_user_id",
        "receiver_user_id",
        "offered_post_id",
        "target_post_id"
    ]:
        if key in trade and trade[key]:
            trade[key] = str(trade[key])

    return trade

@trades_detail_bp.route("/dev/trades/<trade_id>", methods=["GET"])
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


@trades_detail_bp.route("/dev/trades/<trade_id>/accept", methods=["POST"])
def accept_trade(trade_id):
    # Accepts and closes the trade
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
                "status": "closed",
                "accepted_at": datetime.now(timezone.utc),
                "completed_at": datetime.now(timezone.utc)
            }
        }
    )

    return jsonify({"success": True}), 200


@trades_detail_bp.route("/dev/trades/<trade_id>/decline", methods=["POST"])
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


@trades_detail_bp.route("/dev/trades/<trade_id>/counter", methods=["POST"])
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

@trades_detail_bp.route("/dev/trades/<trade_id>/message", methods=["POST"])
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

