from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/settings", methods=["GET"])
def get_settings():

    token = request.headers.get("Authorization").replace("Bearer ", "")
    decoded = firebase_auth.verify_id_token(token)

    uid = decoded["uid"]

    user = user_data_collection.find_one({"firebase_uid": uid})

    return jsonify({
        "is_location_allowed": user.get("is_location_allowed", True),
        "notifications_enabled": user.get("notifications_enabled", True)
    })