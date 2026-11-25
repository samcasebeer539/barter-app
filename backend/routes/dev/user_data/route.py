from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection

user_data_bp = Blueprint('user_data', __name__)

@user_data_bp.route('/dev/user_data', methods=['GET'], strict_slashes=False)
def get_user_data():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        id_token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token['uid']

        existing_user = user_data_collection.find_one({"firebase_uid": uid})
        if not existing_user:
            return jsonify({"message": "No user found"}), 400
        
        return jsonify(own_user_json(existing_user)), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def own_user_json(user):
    """Your own user record as GET /dev/user_data sends it."""
    out = dict(user)
    out["_id"] = str(out["_id"])
    out["posts"] = [str(p) for p in out.get("posts", [])]
    return out
