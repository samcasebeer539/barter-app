# routes/trades_rescind.py
from flask import Blueprint, request, jsonify
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request
from models.game import Game

trades_rescind_bp = Blueprint('trades_rescind', __name__)

@trades_rescind_bp.route('/dev/trades/rescind', methods=['POST'])
def rescind_offer():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            print("RESCIND 400: user not found for uid", uid)
            return jsonify({"error": "User not found"}), 404

        data = request.json
        target_post_id = ObjectId(data.get("targetPostId"))

        target_post = posts_collection.find_one({"_id": target_post_id})
        if not target_post:
            print("RESCIND 404: post not found for id", target_post_id)
            return jsonify({"error": "Post not found"}), 404

        offer = trades_collection.find_one({
            "actor_id": user["_id"],
            "type": "offer",
            "target_post_id": target_post_id,
            "game_id": {"$exists": True},
        })
        if not offer:
            print("RESCIND 404: no offer found for actor", user["_id"], "post", target_post_id)
            return jsonify({"error": "Offer not found"}), 404

        game = Game.get(offer["game_id"])
        if not game:
            print("RESCIND 404: game not found for id", offer["game_id"])
            return jsonify({"error": "Game not found"}), 404

        if not game.is_participant(user["_id"]):
            print("RESCIND 403: user", user["_id"], "not a participant in game", game._id)
            return jsonify({"error": "Not a participant in this game"}), 403

        print("RESCIND: attempting transition, game phase is currently", game.phase)
        try:
            game.apply_transition("rescind", next_turn_user_id=target_post["user_id"])
        except ValueError as e:
            print("RESCIND 400: transition failed —", str(e))
            return jsonify({"error": str(e)}), 400

        game.remove_card("receiver", target_post_id)
        game.save()

        trades_collection.delete_one({"_id": offer["_id"]})

        return jsonify({"success": True, "gameId": str(game._id)}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500