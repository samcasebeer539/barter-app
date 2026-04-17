from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/dev/posts', methods=['GET'])
def get_posts():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["_id"]
        posts = list(posts_collection.find({"user_id": user_id}))
        posts = [serialize_post(p) for p in posts]
        return jsonify(posts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@posts_bp.route('/dev/posts', methods=['POST'])
def create_post():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json
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