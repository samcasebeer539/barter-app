from flask import jsonify, request, Blueprint
import traceback
from backend import user_data_collection
from helpers import get_uid_from_request

locations_bp = Blueprint('locations', __name__)

@locations_bp.route('/dev/locations', methods=['GET'])
def get_my_locations():
    """Return the logged-in user's saved locations."""
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.get("locations", [])), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@locations_bp.route('/dev/locations', methods=['PUT'])
def save_my_locations():
    """Replace the logged-in user's locations list entirely (max 3)."""
    try:
        uid, err = get_uid_from_request()
        if err: return err

        # request.json is None if Content-Type header is missing or body is empty
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        locations = data.get("locations", [])

        if not isinstance(locations, list):
            return jsonify({"error": "locations must be an array"}), 400
        if len(locations) > 3:
            return jsonify({"error": "Maximum 3 locations allowed"}), 400

        # Validate required keys; default description to "" if omitted
        required_keys = {"id", "latitude", "longitude", "name"}
        for loc in locations:
            if not required_keys.issubset(loc.keys()):
                return jsonify({"error": f"Each location requires: {required_keys}"}), 400
            loc.setdefault("description", "")

        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$set": {"locations": locations}}
        )
        return jsonify({"message": "Locations updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500