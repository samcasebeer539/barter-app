from flask import jsonify, Blueprint
import traceback
from bson.objectid import ObjectId
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post

userId_bp = Blueprint('userId', __name__)

@userId_bp.route('/dev/users/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        print(f"Looking up user_id: '{user_id}'")

        # Try as ObjectId
        try:
            owner = user_data_collection.find_one({"_id": ObjectId(user_id)})
            print(f"ObjectId lookup result: {owner is not None}")
        except Exception:
            owner = None
            print("ObjectId conversion failed")

        # Fallback: plain string
        if not owner:
            owner = user_data_collection.find_one({"_id": user_id})
            print(f"String lookup result: {owner is not None}")

        # Fallback: uid field
        if not owner:
            owner = user_data_collection.find_one({"uid": user_id})
            print(f"uid field lookup result: {owner is not None}")

        if not owner:
            return jsonify({"error": "User not found"}), 404

        # Get all of their posts
        owner_posts = list(posts_collection.find({"user_id": ObjectId(user_id)}))
        owner_posts = [serialize_post(p) for p in owner_posts]

        owner["_id"] = str(owner["_id"])
        owner["posts"] = [str(p) for p in owner.get("posts", [])]

        return jsonify({
            "user": owner,
            "posts": owner_posts,
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500