from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection

update_user_bp = Blueprint('update_user', __name__)

@update_user_bp.route('/dev/update_user', methods=['PATCH'])
def update_user():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        id_token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token['uid']

        data = request.json
        allowed_fields = {'pronouns', 'bio', 'phone', 'profile_photo', 'email_visible', 'phone_visible', 'locations'}
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400

        user_data_collection.update_one({"firebase_uid": uid}, {"$set": update})
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500