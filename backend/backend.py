from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import DuplicateKeyError
import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
import traceback
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Load variables from .env file
load_dotenv()

app = Flask(__name__)

cred = credentials.Certificate("firebase-adminsdk.json") 
firebase_admin.initialize_app(cred)

# Access the variables using os.getenv()
DATABASE_USER = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")

uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

db = client.dev
user_data_collection = db.user_data
user_data_collection.create_index("firebase_uid", unique=True)

@app.route('/dev/user_data', methods=['GET'], strict_slashes=False)
def get_user_data():
    try:
        # Get token info to authorize user
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        id_token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token['uid']

        # Check to see if user's firebase uid matches
        existing_user = user_data_collection.find_one({"firebase_uid": uid})
        if not existing_user:
            return jsonify({"message": "No user found"}), 400
        
        existing_user["_id"] = str(existing_user["_id"])
        
        return jsonify(existing_user), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/dev/create_user', methods=['POST'])
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

@app.route('/dev/update_user', methods=['PATCH'])
def update_user():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        id_token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token['uid']

        data = request.json
        allowed_fields = {'pronouns', 'bio', 'phone', 'profile_photo', 'email_visible', 'phone_visible'}
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400

        user_data_collection.update_one({"firebase_uid": uid}, {"$set": update})
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
