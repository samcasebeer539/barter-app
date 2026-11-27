from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post, current_user, text_too_long
from models.game import Game

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/dev/posts', methods=['GET'])
def get_posts():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(my_posts_for(user)), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@posts_bp.route('/dev/posts', methods=['POST'])
def create_post():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json or {}
        err = text_too_long({"post_title": data.get("post_title"), "description": data.get("description")})
        if err: return err
        new_post = {
            "user_id": user["_id"],
            "post_title": data.get("post_title", ""),
            "description": data.get("description", ""),
            "photos": data.get("photos", []),
            "date_posted": datetime.now(timezone.utc),
            "trade_history": {},
            "incoming_offers": [],
        }

        result = posts_collection.insert_one(new_post)
        post_id = result.inserted_id

        # Push the new post's _id into the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$push": {"posts": post_id}}
        )

        new_post = serialize_post(new_post)
        return jsonify(new_post), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def my_posts_for(user):
    """Your posts as GET /dev/posts sends them. Posts in an active trade are
    locked (not editable)."""
    user_id = user["_id"]
    posts = list(posts_collection.find({"user_id": user_id}))
    locked = Game.locked_post_ids_for(user_id)
    return [{**serialize_post(p), "in_trade": p["_id"] in locked} for p in posts]
