from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request, serialize_post

posts_offer_bp = Blueprint('posts_offer', __name__)

@posts_offer_bp.route('/dev/posts/offer', methods=['POST'])
def send_offer():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json
        offered_post_id = data.get("offeredPostId")
        target_post_id = data.get("targetPostId")

        if not offered_post_id or not target_post_id:
            return jsonify({"error": "Missing post IDs"}), 400
        
        offered_post_id = ObjectId(offered_post_id)
        target_post_id = ObjectId(target_post_id)

        offered_post = posts_collection.find_one({"_id": offered_post_id})
        target_post = posts_collection.find_one({"_id": target_post_id})
        
        # Ensure posts exist
        if not offered_post or not target_post:
            return jsonify({"error": "Post not found"}), 404

        # Ensure it's not on your own post
        if target_post["user_id"] == user["_id"]:
            return jsonify({"error": "Cannot offer on your own post"}), 400

        offer = {
            "from_user_id": user["_id"],
            "offered_post_id": offered_post_id,
            "created_at": datetime.now(timezone.utc),
            "status": "pending",
        }

        # Add to target post (receiver side)
        result = posts_collection.update_one(
        {
            "_id": target_post_id,
            "$or": [
                {"incoming_offers": {"$exists": False}},
                {
                    "incoming_offers": {
                        "$not": {
                            "$elemMatch": {
                                "from_user_id": user["_id"],
                                "offered_post_id": offered_post_id,
                                "status": "pending"
                            }
                        }
                    }
                }
            ]
        },
        {
            "$push": {"incoming_offers": offer}
        }
        )

        if result.modified_count == 0:
            return jsonify({"error": "Offer already exists"}), 400

        posts_collection.update_one(
            {"_id": offered_post_id},
            {
                "$push": {
                    "outgoing_offers": {
                        "to_post_id": target_post_id,
                        "created_at": datetime.now(timezone.utc),
                        "status": "pending",
                    }
                }
            }
        )

        return jsonify({"success": True}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500