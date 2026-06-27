from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request
from models.game import Game

trades_offer_bp = Blueprint('trades_offer', __name__)

@trades_offer_bp.route('/dev/trades/offer', methods=['POST'])
def send_offer():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json
        target_post_id = ObjectId(data.get("targetPostId"))

        target_post = posts_collection.find_one({"_id": target_post_id})
        if not target_post:
            return jsonify({"error": "Post not found"}), 404

        if target_post["user_id"] == user["_id"]:
            return jsonify({"error": "Cannot offer on your own post"}), 400

        # Only one offer per player per post — duplicates are silently ignored
        existing_offer = trades_collection.find_one({
            "initiator_user_id": user["_id"],
            "type": "offer",
            "target_post_id": target_post_id,
            "game_id": {"$exists": True},
        })
        if existing_offer:
            return jsonify({
                "success": True,
                "tradeId": str(existing_offer["_id"]),
                "gameId": str(existing_offer["game_id"]),
            }), 200

        game = Game.get_or_create(user["_id"], target_post["user_id"], target_post_id)

        trade = {
            "game_id": game._id,
            "type": "offer",
            "actor_id": user["_id"],
            "target_post_id": target_post_id,
            "created_at": datetime.now(timezone.utc),
            "messages": [],
        }
        result = trades_collection.insert_one(trade)

        if game.phase == "open":
            game.add_card("receiver", target_post_id)
            try:
                game.apply_transition("offer", next_turn_user_id=target_post["user_id"])
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            game.save()

        return jsonify({
            "success": True,
            "tradeId": str(result.inserted_id),
            "gameId": str(game._id),
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500