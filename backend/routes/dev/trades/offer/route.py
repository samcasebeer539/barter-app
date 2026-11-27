from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, current_user, blocked_ids_for, pass_through_errors
from models.game import Game

trades_offer_bp = Blueprint('trades_offer', __name__)

@trades_offer_bp.route('/dev/trades/offer', methods=['POST'])
def send_offer():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json or {}
        if not data.get("targetPostId"):
            return jsonify({"error": "Missing targetPostId"}), 400
        target_post_id = ObjectId(data["targetPostId"])

        target_post = posts_collection.find_one({"_id": target_post_id})
        if not target_post:
            return jsonify({"error": "Post not found"}), 404

        if target_post["user_id"] == user["_id"]:
            return jsonify({"error": "Cannot offer on your own post"}), 400
        if target_post["user_id"] in blocked_ids_for(user):
            return jsonify({"error": "You can't trade with this user"}), 403
        if Game.traded_post_ids([target_post_id]):
            return jsonify({"error": "That item has already been traded"}), 409

        # Only one offer per player per post — duplicates are silently
        # ignored. Note: trade docs use actor_id, not initiator_user_id.
        game = Game.get_or_create(user["_id"], target_post["user_id"], target_post_id)

        # One offer per ongoing game; offers in ended games are history.
        existing_offer = trades_collection.find_one({
            "actor_id": user["_id"],
            "type": "offer",
            "game_id": game._id,
        })
        if existing_offer:
            return jsonify({
                "success": True,
                "tradeId": str(existing_offer["_id"]),
                "gameId": str(existing_offer["game_id"]),
            }), 200


        if game.phase == "open":
            game.add_card("receiver", target_post_id)
            try:
                game.apply_transition("offer", next_turn_user_id=target_post["user_id"])
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            game.save()

        trade = {
            "game_id": game._id,
            "type": "offer",
            "actor_id": user["_id"],
            "target_post_id": target_post_id,
            "created_at": datetime.now(timezone.utc),
            "messages": [],
        }
        result = trades_collection.insert_one(trade)

        return jsonify({
            "success": True,
            "tradeId": str(result.inserted_id),
            "gameId": str(game._id),
        }), 201
    except pass_through_errors():
        raise
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500