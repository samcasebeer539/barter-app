from bson.objectid import ObjectId
from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import storage as firebase_storage
from backend import user_data_collection, posts_collection
from helpers import get_uid_from_request

posts_post_id_bp = Blueprint('posts_post_id', __name__)

@posts_post_id_bp.route('/dev/posts/<post_id>', methods=['PATCH'])
def update_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        allowed_fields = {'post_title', 'description', 'photos', 'is_good'}
        data = request.json
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400

        posts_collection.update_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]},
            {"$set": update}
        )
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@posts_post_id_bp.route('/dev/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        posts_collection.delete_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]}
        )

        # Pull the post's _id out of the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$pull": {"posts": ObjectId(post_id)}}
        )

        # Delete all photos for this post from Firebase Storage
        try:
            bucket = firebase_storage.bucket()
            prefix = f"post_photos/{uid}/{post_id}/"
            blobs = bucket.list_blobs(prefix=prefix)
            for blob in blobs:
                blob.delete()
        except Exception as storage_err:
            # Non-fatal — log but don't fail the request
            print(f"Storage cleanup warning: {storage_err}")

        return jsonify({"message": "Deleted"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500