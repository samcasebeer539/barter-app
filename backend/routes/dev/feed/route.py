from flask import jsonify, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, with_distances, current_user

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/dev/feed', methods=['GET'])
def get_feed():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        # Return all posts from all users except the current user
        user = current_user()
        exclude_user_id = user["_id"] if user else None

        # Everyone's posts but your own.
        query = {"user_id": {"$ne": exclude_user_id}} if exclude_user_id else {}
        posts = list(posts_collection.find(query).sort("date_posted", -1))
        posts = with_distances(posts, user)
        return jsonify(posts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500