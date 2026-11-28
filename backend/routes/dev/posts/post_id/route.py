from bson.objectid import ObjectId
from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection, posts_collection
from helpers import (get_uid_from_request, current_user, text_too_long, bad_post_fields, pass_through_errors,
                     storage_path, post_photo_prefix, delete_storage_files)
from models.game import Game

posts_post_id_bp = Blueprint('posts_post_id', __name__)

@posts_post_id_bp.route('/dev/posts/<post_id>', methods=['PATCH'])
def update_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        allowed_fields = {'post_title', 'description', 'photos', 'is_good'}
        data = request.json or {}
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400
        current = posts_collection.find_one({"_id": ObjectId(post_id), "user_id": user["_id"]}, {"photos": 1})
        if not current:
            return jsonify({"error": "Post not found"}), 404
        err = text_too_long({k: update[k] for k in ("post_title", "description") if k in update}) \
            or bad_post_fields(update, uid, post_id, current.get("photos") or [])
        if err: return err

        if ObjectId(post_id) in Game.locked_post_ids_for(user["_id"]):
            return jsonify({"error": "This item is in an active trade and can't be edited"}), 409

        result = posts_collection.update_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]},
            {"$set": update}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Post not found"}), 404

        # Photos taken off the post (and uploads from saves that never
        # finished) are deleted, so they don't linger after you removed them.
        if "photos" in update:
            delete_storage_files(post_photo_prefix(uid, post_id), keep={storage_path(p) for p in update["photos"]})
        return jsonify({"message": "Updated"}), 200

    except pass_through_errors():

        raise

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@posts_post_id_bp.route('/dev/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if ObjectId(post_id) in Game.locked_post_ids_for(user["_id"]):
            return jsonify({"error": "This item is in an active trade and can't be deleted"}), 409

        result = posts_collection.delete_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]}
        )
        if result.deleted_count == 0:
            return jsonify({"error": "Post not found"}), 404

        # Pull the post's _id out of the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$pull": {"posts": ObjectId(post_id)}}
        )

        # Delete all photos for this post from Firebase Storage
        delete_storage_files(post_photo_prefix(uid, post_id))

        return jsonify({"message": "Deleted"}), 200

    except pass_through_errors():

        raise

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500