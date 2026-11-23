from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request
from models.game import Game, NotYourTurnError

trades_where_bp = Blueprint("trades_where", __name__)


@trades_where_bp.route("/dev/trades/where", methods=["POST"])
def propose_location():
    """WHERE: propose one of your saved locations as the meeting spot.
    Played as a turn in the close phase; passes the turn to the other player."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    location_id = data.get("locationId")
    if not data.get("gameId") or not location_id:
        return jsonify({"error": "Missing gameId or locationId"}), 400

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

    # Use the server's copy of the location, so a proposal can only be one of
    # the player's own saved spots.
    location = next(
        (loc for loc in user.get("locations", []) if loc.get("id") == location_id),
        None,
    )
    if not location:
        return jsonify({"error": "That isn't one of your saved locations"}), 400

    try:
        game.apply_transition(
            "where",
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
        "type": "where",
        "actor_id": user["_id"],
        "location": location,
        "location_name": location.get("name", ""),
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    })

    return jsonify({
        "success": True,
        "gameId": str(game._id),
        "tradeId": str(result.inserted_id),
    }), 201
