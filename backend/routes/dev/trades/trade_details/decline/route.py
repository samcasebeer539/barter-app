from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, NotYourTurnError

trades_detail_decline_bp = Blueprint("trades_detail_decline", __name__)


@trades_detail_decline_bp.route("/dev/trades/trade_details/decline", methods=["POST"])
def decline_trade():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()

    data = request.json
    game_id = data.get("gameId")
    if not game_id:
        return jsonify({"error": "Missing gameId"}), 400

    game = Game.get(ObjectId(game_id))
    if not game:
        return jsonify({"error": "Game not found"}), 404

    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403

    # If the turn timer already ran out, the game is now declined anyway.
    if game.expire_if_overdue():
        return jsonify({"success": True, "gameId": str(game._id)}), 200

    try:
        # actor_id enforces turn order in barter/close (no-op before then).
        game.apply_transition("decline", actor_id=user["_id"])
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
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
