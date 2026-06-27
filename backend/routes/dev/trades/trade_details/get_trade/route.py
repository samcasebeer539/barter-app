from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, serialize_trade
from models.game import Game

trades_detail_get_trade_bp = Blueprint("trades_detail_get_trade", __name__)

@trades_detail_get_trade_bp.route("/dev/trades/trade_details/get_trade", methods=["GET"])
def get_trade():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})
    game_id = request.args.get("gameId")
    if not game_id:
        return jsonify({"error": "Missing gameId"}), 400

    game = Game.get(ObjectId(game_id))
    if not game:
        return jsonify({"error": "Game not found"}), 404
    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403

    result = game.to_json()
    result["turns"] = [
        serialize_trade(t) for t in
        trades_collection.find({"game_id": game._id}).sort("created_at", 1)
    ]
    return jsonify(result), 200