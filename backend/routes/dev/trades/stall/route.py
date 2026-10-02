from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request
from models.game import Game, NotYourTurnError

trades_stall_bp = Blueprint("trades_stall", __name__)


@trades_stall_bp.route("/dev/trades/stall", methods=["POST"])
def stall_trade():
    """Skip your turn: the game stays in its phase and the turn passes
    to the other player."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    game_id = data.get("gameId")
    if not game_id:
        return jsonify({"error": "Missing gameId"}), 400

    game = Game.get(ObjectId(game_id))
    if not game:
        return jsonify({"error": "Game not found"}), 404

    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403

    if game.expire_if_overdue():
        return jsonify({"error": "Turn time ran out; the trade was declined"}), 409

    try:
        game.apply_transition(
            "stall",
            next_turn_user_id=game.other_user(user["_id"]),
            actor_id=user["_id"],
        )
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.save()

    trades_collection.insert_one({
        "game_id": game._id,
        "type": "stall",
        "actor_id": user["_id"],
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    })

    return jsonify({"success": True, "gameId": str(game._id)}), 200