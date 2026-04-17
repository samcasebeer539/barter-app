from bson.objectid import ObjectId
from flask import jsonify, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post

postId_bp = Blueprint('postId', __name__)

@postId_bp.route('/dev/feed/<post_id>', methods=['GET'])
def get_feed_profile(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        print(f"get_feed_profile called with post_id: '{post_id}'")

        # Find the post
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        print(f"post found: {post is not None}")
        if not post:
            return jsonify({"error": "Post not found"}), 404

        print(f"post user_id: {post['user_id']} (type: {type(post['user_id'])})")

        # Find the owner
        owner = user_data_collection.find_one({"_id": post["user_id"]})
        print(f"owner found: {owner is not None}")
        if not owner:
            return jsonify({"error": "User not found"}), 404

        # Get all of the owner's posts
        owner_posts = list(posts_collection.find({"user_id": post["user_id"]}))
        owner_posts = [serialize_post(p) for p in owner_posts]

        owner["_id"] = str(owner["_id"])
        owner["posts"] = [str(p) for p in owner.get("posts", [])]

        return jsonify({
            "user": owner,
            "posts": owner_posts,
            "tapped_post_id": post_id,
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500