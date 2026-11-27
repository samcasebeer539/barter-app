from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection
from helpers import current_user, get_uid_from_request

user_data_bp = Blueprint('user_data', __name__)

@user_data_bp.route('/dev/user_data', methods=['GET'], strict_slashes=False)
def get_user_data():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        existing_user = current_user()
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
    # Ids of people you've blocked (ObjectIds can't be sent as JSON as is).
    if "blocked_user_ids" in out:
        out["blocked_user_ids"] = [str(i) for i in out["blocked_user_ids"]]
    return out
