from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, NotYourTurnError

trades_when_bp = Blueprint("trades_when", __name__)

MAX_LABEL_LENGTH = 60


@trades_when_bp.route("/dev/trades/when", methods=["POST"])
def propose_time():
    """WHEN: propose a meetup date and time. Close-phase turn; passes the
    turn. proposedAt is the moment (ISO); label is how it reads in the
    proposer's time zone, e.g. "Mon, Nov 24 at 3:00 PM"."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    label = (data.get("label") or "").strip()
    if not data.get("gameId") or not data.get("proposedAt") or not label:
        return jsonify({"error": "Missing gameId, proposedAt or label"}), 400
    if len(label) > MAX_LABEL_LENGTH:
        return jsonify({"error": "Label is too long"}), 400

    try:
        proposed_at = datetime.fromisoformat(data["proposedAt"].replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return jsonify({"error": "Invalid proposedAt"}), 400
    if proposed_at.tzinfo is None:
        return jsonify({"error": "proposedAt needs a time zone"}), 400
    if proposed_at <= datetime.now(timezone.utc):
        return jsonify({"error": "Pick a time in the future"}), 400

    try:
        game = Game.get(ObjectId(data["gameId"]))
    except InvalidId:
        return jsonify({"error": "Invalid gameId"}), 400
    if not game:
        return jsonify({"error": "Game not found"}), 404
    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403
    if game.expire_if_overdue():
        return jsonify({"error": "Turn time ran out; the trade was declined"}), 409

    try:
        game.apply_transition(
            "when",
            next_turn_user_id=game.other_user(user["_id"]),
            actor_id=user["_id"],
        )
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.save()

    result = trades_collection.insert_one({
        "game_id": game._id,
        "type": "when",
        "actor_id": user["_id"],
        "proposed_at": proposed_at.astimezone(timezone.utc),
        "proposed_time": label,
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    })

    return jsonify({
        "success": True,
        "gameId": str(game._id),
        "tradeId": str(result.inserted_id),
    }), 201
