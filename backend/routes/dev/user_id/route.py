from flask import jsonify, Blueprint, request
import traceback
from bson.objectid import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, serialize_post, public_user, blocked_ids_for, current_user, pass_through_errors
from models.game import iso_utc

userId_bp = Blueprint('userId', __name__)

@userId_bp.route('/dev/users/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        # Try as ObjectId
        try:
            owner = user_data_collection.find_one({"_id": ObjectId(user_id)})
        except Exception:
            owner = None

        # Fallback: plain string
        if not owner:
            owner = user_data_collection.find_one({"_id": user_id})

        # Fallback: uid field
        if not owner:
            owner = user_data_collection.find_one({"uid": user_id})

        # Blocked either way: as if they don't exist.
        if not owner or owner["_id"] in blocked_ids_for(current_user()):
            return jsonify({"error": "User not found"}), 404

        # Get all of their posts
        owner_posts = list(posts_collection.find({"user_id": ObjectId(user_id)}))
        owner_posts = [serialize_post(p) for p in owner_posts]

        return jsonify({
            "user": public_user(owner),
            "posts": owner_posts,
        }), 200

    except pass_through_errors():

        raise

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



MAX_PROFILE_BATCH = 50


@userId_bp.route('/dev/profiles', methods=['GET'])
def get_user_profiles():
    """Several users' profiles in one call: ?ids=<id>,<id>,...
    Returns {userId: {"user": ..., "posts": [...]}}, the same shape as
    GET /dev/users/<id> per user. Unknown ids are left out. All posts come
    from a single query."""
    try:
        uid, err = get_uid_from_request()
        if err: return err

        ids = []
        for raw in (request.args.get("ids") or "").split(","):
            raw = raw.strip()
            if not raw:
                continue
            try:
                ids.append(ObjectId(raw))
            except Exception:
                return jsonify({"error": f"Invalid id: {raw}"}), 400
        blocked = blocked_ids_for(current_user())
        ids = [i for i in dict.fromkeys(ids) if i not in blocked][:MAX_PROFILE_BATCH]
        if not ids:
            return jsonify({}), 200

        return jsonify(profiles_for(ids)), 200
    except pass_through_errors():
        raise
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def profiles_for(ids):
    """{userId: {"user": ..., "posts": [...]}} for these user ids (ObjectIds),
    as GET /dev/profiles sends it. All posts come from a single query."""
    if not ids:
        return {}
    users = list(user_data_collection.find({"_id": {"$in": ids}}))
    posts_by_owner = {}
    for post in posts_collection.find({"user_id": {"$in": ids}}):
        posts_by_owner.setdefault(post["user_id"], []).append(serialize_post(post))
    return {
        str(u["_id"]): {
            "user": public_user(u),
            "posts": posts_by_owner.get(u["_id"], []),
        }
        for u in users
    }


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
    except pass_through_errors():
        raise
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
