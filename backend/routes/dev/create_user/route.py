from pymongo.errors import DuplicateKeyError
from flask import jsonify, request, Blueprint
import traceback
from firebase_admin import auth as firebase_auth
from backend import user_data_collection

create_user_bp = Blueprint('create_user', __name__)

@create_user_bp.route('/dev/create_user', methods=['POST'])
def create_user():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        id_token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token['email']
        
        data = request.json
        first_name = data.get("firstName").strip()
        last_name = data.get("lastName").strip()

        if not first_name or not last_name:
            return jsonify({"error": "Missing name fields"}), 400

        existing_user = user_data_collection.find_one({"firebase_uid": uid})
        if existing_user:
            return jsonify({"message": "User already exists"}), 200

        new_user_data = {
            "firebase_uid": uid,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": "",
            "bio": "",
            "profile_photo": "",
            "pronouns": "",
            "posts": [],
            "location": None,
            "email_visible": False,
            "phone_visible": False,
        }

        try:
            result = user_data_collection.insert_one(new_user_data)
        except DuplicateKeyError:
            return jsonify({"message": "User already exists"}), 200
        new_user_data["_id"] = str(result.inserted_id)

        return jsonify({"message": "User created", "User": new_user_data}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500