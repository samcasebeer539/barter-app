from datetime import datetime, timezone
from flask import jsonify, request, Blueprint
import traceback
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection
from helpers import get_uid_from_request, serialize_post

trades_offer_bp = Blueprint('trades_offer', __name__)

@trades_offer_bp.route('/dev/trades/offer', methods=['POST'])
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
        if str(target_post["user_id"]) == str(user["_id"]):
            return jsonify({"error": "Cannot offer on your own post"}), 400
        
        # Ensure post does not already exist
        is_already_existing = trades_collection.find_one({
            "status": "open", 
            "type": "offer", 
            "initiator_user_id": user["_id"], 
            "offered_post_id": offered_post_id, 
            "target_post_id": target_post_id
        })

        if is_already_existing:
            return jsonify({"error": "Offer already exists"}), 400

        trade = { 
            "type": "offer", 
            "status": "open", 
            "created_at": datetime.now(timezone.utc), 
            "initiator_user_id": user["_id"], 
            "receiver_user_id": target_post["user_id"], 
            "offered_post_id": offered_post_id, 
            "target_post_id": target_post_id, 
            "messages": [], 
            "counter_offers": [], 
            "completed_at": None }

        result = trades_collection.insert_one(trade)
        print(result)

        return jsonify({ 
                "success": True, 
                "tradeId": str(result.inserted_id) 
            }), 201
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500