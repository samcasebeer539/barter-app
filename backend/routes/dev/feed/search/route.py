from flask import Blueprint, jsonify, request
from backend import posts_collection
from firebase_admin import auth as firebase_auth
from helpers import serialize_post


feed_search_bp = Blueprint("feed_search", __name__)


@feed_search_bp.route("/dev/feed/search", methods=["GET"])
def search_feed():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]

    firebase_auth.verify_id_token(token)


    query = request.args.get("q", "")

    if not query:
        return jsonify([])

    results = posts_collection.find(
        {
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

    posts = [serialize_post(post) for post in results]

    return jsonify(posts)