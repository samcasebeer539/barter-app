from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from helpers import get_uid_from_request, serialize_post, current_user, text_too_long, bad_post_fields, pass_through_errors
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

    except pass_through_errors():

        raise

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
        err = text_too_long({"post_title": data.get("post_title"), "description": data.get("description")}) \
            or bad_post_fields(data)
        if err: return err

        # The app picks the post's id itself, so it can upload the photos
        # (stored under the id) before the post exists. Otherwise make one.
        try:
            post_id = ObjectId(data["_id"]) if data.get("_id") else ObjectId()
        except (InvalidId, TypeError):
            return jsonify({"error": "Invalid post id"}), 400

        new_post = {
            "_id": post_id,
            "user_id": user["_id"],
            "post_title": data.get("post_title", ""),
            "description": data.get("description", ""),
            "photos": data.get("photos", []),
            "date_posted": datetime.now(timezone.utc),
            "trade_history": {},
            "incoming_offers": [],
        }

        try:
            posts_collection.insert_one(new_post)
        except DuplicateKeyError:
            return jsonify({"error": "That post id is taken"}), 409

        # Push the new post's _id into the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$push": {"posts": post_id}}
        )

        new_post = serialize_post(new_post)
        return jsonify(new_post), 201

    except pass_through_errors():

        raise

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
