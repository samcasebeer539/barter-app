from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import posts_collection, trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, NotYourTurnError

trades_subtract_bp = Blueprint("trades_subtract", __name__)


@trades_subtract_bp.route("/dev/trades/subtract", methods=["POST"])
def subtract_post():
    """SUBTRACT: take one of your own items out of the trade. Barter-phase
    turn; you must keep at least one item in. Passes the turn."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    if not data.get("gameId") or not data.get("postId"):
        return jsonify({"error": "Missing gameId or postId"}), 400

    try:
        game = Game.get(ObjectId(data["gameId"]))
        post_id = ObjectId(data["postId"])
    except InvalidId:
        return jsonify({"error": "Invalid gameId or postId"}), 400
    if not game:
        return jsonify({"error": "Game not found"}), 404
    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403
    if game.expire_if_overdue():
        return jsonify({"error": "Turn time ran out; the trade was declined"}), 409

    role = game.role_of(user["_id"])
    my_cards = game.cards.get(role, [])
    if post_id not in my_cards:
        return jsonify({"error": "That item isn't one of yours in this trade"}), 400
    if len(my_cards) <= 1:
        return jsonify({"error": "You need to keep at least one item in the trade"}), 400

    try:
        game.apply_transition(
            "subtract",
            next_turn_user_id=game.other_user(user["_id"]),
            actor_id=user["_id"],
        )
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.remove_card(role, post_id)
    game.save()

    # The post leaves the game's cards, so keep its name on the turn for the log.
    post = posts_collection.find_one({"_id": post_id}) or {}
    result = trades_collection.insert_one({
        "game_id": game._id,
        "type": "subtract",
        "actor_id": user["_id"],
        "post_id": post_id,
        "post_name": post.get("post_title", post.get("name", "")),
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    })

    return jsonify({
        "success": True,
        "gameId": str(game._id),
        "tradeId": str(result.inserted_id),
    }), 201
