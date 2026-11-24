import re
from flask import Blueprint, jsonify, request
from backend import posts_collection, user_data_collection
from firebase_admin import auth as firebase_auth
from helpers import with_distances


feed_search_bp = Blueprint("feed_search", __name__)


@feed_search_bp.route("/dev/feed/search", methods=["GET"])
def search_feed():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]

    uid = firebase_auth.verify_id_token(token)["uid"]
    user = user_data_collection.find_one({"firebase_uid": uid})


    query = request.args.get("q", "")

    if not query:
        return jsonify([])

    # Match the text literally; raw input would be treated as a regex.
    query = re.escape(query[:100])

    results = posts_collection.find(
        {
            # Everyone's posts but your own.
            **({"user_id": {"$ne": user["_id"]}} if user else {}),
            "$or": [
                {
                    "post_title": {
                        "$regex": query,
                        "$options": "i"
                    }
                },
                {
                    "description": {
                        "$regex": query,
                        "$options": "i"
                    }
                }
            ]
        }
    )

    posts = with_distances(list(results), user)

    return jsonify(posts)