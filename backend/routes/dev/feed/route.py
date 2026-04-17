from flask import jsonify, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/dev/feed', methods=['GET'])
def get_feed():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        # Return all posts from all users except the current user
        user = user_data_collection.find_one({"firebase_uid": uid})
        exclude_user_id = user["_id"] if user else None

        # query = {"user_id": {"$ne": exclude_user_id}} if exclude_user_id else {}
        query = {}
        posts = list(posts_collection.find(query).sort("date_posted", -1))
        posts = [serialize_post(p) for p in posts]
        return jsonify(posts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500