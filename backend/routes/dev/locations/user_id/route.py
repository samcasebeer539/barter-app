from bson.objectid import ObjectId
from flask import jsonify, Blueprint
import traceback
from backend import user_data_collection
from helpers import get_uid_from_request

locations_userid_bp = Blueprint('locations_userid', __name__)

@locations_userid_bp.route('/dev/locations/<user_id>', methods=['GET'])
def get_user_locations(user_id):
    """Return another user's saved locations by their MongoDB _id."""
    try:
        uid, err = get_uid_from_request()
        if err: return err

        try:
            target_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "Invalid user_id"}), 400

        user = user_data_collection.find_one({"_id": target_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.get("locations", [])), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500