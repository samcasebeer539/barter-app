from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request
from models.game import Game

trades_detail_decline_bp = Blueprint("trades_detail_decline", __name__)


@trades_detail_decline_bp.route("/dev/trades/trade_details/decline", methods=["POST"])
def decline_trade():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    data = request.json
    game_id = data.get("gameId")
    if not game_id:
        return jsonify({"error": "Missing gameId"}), 400

    game = Game.get(ObjectId(game_id))
    if not game:
        return jsonify({"error": "Game not found"}), 404

    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        game.apply_transition("decline")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.save()

    trade = {
        "game_id": game._id,
        "type": "decline",
        "actor_id": user["_id"],
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    }
    trades_collection.insert_one(trade)

    return jsonify({"success": True, "gameId": str(game._id)}), 200