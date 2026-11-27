from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection
from helpers import get_uid_from_request, text_too_long

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

        user_data_collection.update_one({"firebase_uid": uid}, {"$set": update})
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500