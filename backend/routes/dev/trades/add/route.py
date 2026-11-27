from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, NotYourTurnError

trades_add_bp = Blueprint("trades_add", __name__)


@trades_add_bp.route("/dev/trades/add", methods=["POST"])
def add_post():
    """ADD: bring one of the other player's posts into the trade (on their
    side). Barter-phase turn; passes the turn."""
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

    partner_id = game.other_user(user["_id"])
    post = posts_collection.find_one({"_id": post_id})
    if not post or post.get("user_id") != partner_id:
        return jsonify({"error": "That post isn't one of the other player's"}), 400
    if post_id in game.post_ids():
        return jsonify({"error": "That post is already in the trade"}), 400
    if Game.traded_post_ids([post_id]):
        return jsonify({"error": "That item has already been traded"}), 409

    try:
        game.apply_transition("add", next_turn_user_id=partner_id, actor_id=user["_id"])
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.add_card(game.role_of(partner_id), post_id)
    game.save()

    result = trades_collection.insert_one({
        "game_id": game._id,
        "type": "add",
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
