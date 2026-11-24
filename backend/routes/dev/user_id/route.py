from flask import jsonify, Blueprint
import traceback
from bson.objectid import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, serialize_post, public_user
from models.game import iso_utc

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

        return jsonify({
            "user": public_user(owner),
            "posts": owner_posts,
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


MAX_REVIEWS = 50


@userId_bp.route('/dev/users/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    """Reviews other players left for this user, newest first, with each
    reviewer's full name."""
    try:
        uid, err = get_uid_from_request()
        if err: return err

        try:
            target_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "Invalid user_id"}), 400

        reviews = list(
            trades_collection.find({"type": "review", "reviewed_user_id": target_id})
            .sort("created_at", -1)
            .limit(MAX_REVIEWS)
        )

        reviewer_ids = list({r["actor_id"] for r in reviews})
        reviewers = {
            u["_id"]: u for u in user_data_collection.find(
                {"_id": {"$in": reviewer_ids}}, {"first_name": 1, "last_name": 1}
            )
        }

        def display_name(user):
            if not user:
                return "Former member"
            full = f'{user.get("first_name", "").strip()} {user.get("last_name", "").strip()}'.strip()
            return full or "Member"

        return jsonify([
            {
                "_id": str(r["_id"]),
                "rating": r.get("rating", 0),
                "text": r.get("text", ""),
                "reviewerName": display_name(reviewers.get(r["actor_id"])),
                "createdAt": iso_utc(r.get("created_at")),
            }
            for r in reviews
        ]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
