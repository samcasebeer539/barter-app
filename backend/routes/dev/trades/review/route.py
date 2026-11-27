from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from backend import user_data_collection, trades_collection, games_collection
from helpers import get_uid_from_request, current_user
from models.game import Game

trades_review_bp = Blueprint("trades_review", __name__)

MAX_REVIEW_LENGTH = 500


@trades_review_bp.route("/dev/trades/review", methods=["POST"])
def review_trade():
    """REVIEW: after the deal is agreed, rate the other player 1-5 stars,
    with optional text. Each player reviews once; when both have, the game
    is completed. Updates the reviewed player's rating and review count."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    rating = data.get("rating")
    text = (data.get("text") or "").strip()
    if not data.get("gameId"):
        return jsonify({"error": "Missing gameId"}), 400
    if not isinstance(rating, int) or isinstance(rating, bool) or not 1 <= rating <= 5:
        return jsonify({"error": "Rating must be a whole number from 1 to 5"}), 400
    if len(text) > MAX_REVIEW_LENGTH:
        return jsonify({"error": f"Reviews are limited to {MAX_REVIEW_LENGTH} characters"}), 400

    try:
        game = Game.get(ObjectId(data["gameId"]))
    except InvalidId:
        return jsonify({"error": "Invalid gameId"}), 400
    if not game:
        return jsonify({"error": "Game not found"}), 404
    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403
    if game.phase != "agreed":
        return jsonify({"error": "You can review once the deal is agreed"}), 400

    reviewed_id = game.other_user(user["_id"])
    if trades_collection.find_one({"game_id": game._id, "type": "review", "actor_id": user["_id"]}):
        return jsonify({"error": "You already reviewed this trade"}), 409

    now = datetime.now(timezone.utc)
    result = trades_collection.insert_one({
        "game_id": game._id,
        "type": "review",
        "actor_id": user["_id"],
        "reviewed_user_id": reviewed_id,
        "rating": rating,
        "text": text,
        "created_at": now,
        "messages": [],
    })

    # Keep the reviewed player's average rating and count up to date.
    reviewed = user_data_collection.find_one_and_update(
        {"_id": reviewed_id},
        {"$inc": {"rating_total": rating, "reviewCount": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if reviewed and reviewed.get("reviewCount"):
        user_data_collection.update_one(
            {"_id": reviewed_id},
            {"$set": {"rating": round(reviewed["rating_total"] / reviewed["reviewCount"], 2)}},
        )

    # Both reviewed: the trade is done.
    review_count = trades_collection.count_documents({"game_id": game._id, "type": "review"})
    if review_count >= 2:
        # Atomic, so both players reviewing at once can't trip over each other.
        games_collection.update_one(
            {"_id": game._id, "phase": "agreed"},
            {"$set": {"phase": "completed", "completed_at": now, "updated_at": now},
             "$inc": {"rev": 1}},
        )
        game.phase = "completed"

    return jsonify({
        "success": True,
        "gameId": str(game._id),
        "tradeId": str(result.inserted_id),
        "phase": game.phase,
    }), 201
