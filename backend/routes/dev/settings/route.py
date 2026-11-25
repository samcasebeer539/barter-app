from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection
from helpers import get_uid_from_request, current_user

settings_bp = Blueprint("settings", __name__)

# Gets the status if notifications and/or locations services are enabled
@settings_bp.route("/settings", methods=["GET"])
def get_settings():

    try: 
        uid, err = get_uid_from_request()
        if err: return err

        # Return all posts from all users except the current user
        user = current_user()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        return jsonify(settings_for(user))
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def settings_for(user):
    """Location / notification settings, as GET /settings sends them."""
    return {
        "is_location_allowed": user.get("is_location_allowed", True),
        "notifications_enabled": user.get("notifications_enabled", True),
    }
