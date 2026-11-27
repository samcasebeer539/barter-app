from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, NotYourTurnError

trades_detail_accept_bp = Blueprint("trades_detail_accept", __name__)


@trades_detail_accept_bp.route("/dev/trades/trade_details/accept", methods=["POST"])
def accept_trade():
    """*accept: once both players have accepted, the game moves to the next
    phase. A single accept just passes the turn to the other player."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
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

    # In close, ACCEPT agrees to the meetup, so there must be a place and a
    # time on the table.
    accepting_in_close = game.phase == "close"
    if accepting_in_close:
        has_where = trades_collection.find_one({"game_id": game._id, "type": "where"})
        has_when = trades_collection.find_one({"game_id": game._id, "type": "when"})
        if not (has_where and has_when):
            return jsonify({"error": "Propose a place and a time before accepting"}), 400

    try:
        advanced = game.accept(user["_id"])
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.save()

    # Deal is final: its posts are spoken for, so every other trade or offer
    # involving them is declined.
    if advanced and game.phase == "agreed":
        game.decline_others_with_posts()

    trades_collection.insert_one({
        "game_id": game._id,
        "type": "accept",
        # The close-phase ACCEPT (agreeing to the meetup), vs. barter's *ACCEPT.
        "final": accepting_in_close,
        "actor_id": user["_id"],
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    })

    return jsonify({
        "success": True,
        "gameId": str(game._id),
        "phase": game.phase,
        "advanced": advanced,
        "accepts": game.accepts,
    }), 200
