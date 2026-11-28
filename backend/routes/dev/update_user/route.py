from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection
from helpers import (get_uid_from_request, text_too_long, pass_through_errors,
                     storage_path, is_own_profile_photo, profile_photo_prefix, delete_storage_files)

update_user_bp = Blueprint('update_user', __name__)

@update_user_bp.route('/dev/update_user', methods=['PATCH'])
def update_user():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        data = request.json
        allowed_fields = {'pronouns', 'bio', 'phone', 'profile_photo', 'email_visible', 'phone_visible', 'is_location_allowed', 'is_notifications_allowed'}
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400
        err = text_too_long({k: update[k] for k in ("bio", "pronouns", "phone") if k in update})
        if err: return err
        # Your own upload, or "" / null for no photo. The profile screen sends
        # the photo you already have with every save, so that's left alone.
        photo = update.get("profile_photo")
        if "profile_photo" in update:
            current = (user_data_collection.find_one({"firebase_uid": uid}, {"profile_photo": 1}) or {}).get("profile_photo")
            if photo == current:
                del update["profile_photo"]
            elif photo not in ("", None) and not is_own_profile_photo(photo, uid):
                return jsonify({"error": "profile_photo must be your uploaded profile photo"}), 400
        if not update:
            return jsonify({"message": "Updated"}), 200

        user_data_collection.update_one({"firebase_uid": uid}, {"$set": update})

        # An old photo saved with another extension (.png before, .jpg now)
        # would otherwise stay in Storage forever.
        if "profile_photo" in update:
            delete_storage_files(profile_photo_prefix(uid), keep={storage_path(photo)} if photo else set())
        return jsonify({"message": "Updated"}), 200

    except pass_through_errors():

        raise

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
