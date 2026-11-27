# routes/trades_rescind.py
from flask import Blueprint, request, jsonify
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, current_user
from models.game import Game, GameConflictError

trades_rescind_bp = Blueprint('trades_rescind', __name__)

@trades_rescind_bp.route('/dev/trades/rescind', methods=['POST'])
def rescind_offer():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json
        target_post_id = ObjectId(data.get("targetPostId"))

        target_post = posts_collection.find_one({"_id": target_post_id})
        if not target_post:
            return jsonify({"error": "Post not found"}), 404

        # The offer in this player's ongoing game for the post (offers in
        # ended games are history and can't be rescinded).
        active_game = Game.find_active(user["_id"], target_post_id)
        offer = trades_collection.find_one({
            "actor_id": user["_id"],
            "type": "offer",
            "game_id": active_game._id,
        }) if active_game else None
        if not offer:
            return jsonify({"error": "Offer not found"}), 404

        game = Game.get(offer["game_id"])
        if not game:
            return jsonify({"error": "Game not found"}), 404

        if not game.is_participant(user["_id"]):
            return jsonify({"error": "Not a participant in this game"}), 403

        try:
            game.apply_transition("rescind", next_turn_user_id=target_post["user_id"])
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        game.remove_card("receiver", target_post_id)
        game.save()

        trades_collection.delete_one({"_id": offer["_id"]})

        return jsonify({"success": True, "gameId": str(game._id)}), 200

    except GameConflictError:
        raise
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500