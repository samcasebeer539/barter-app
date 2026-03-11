from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
import traceback
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, storage as firebase_storage

# Load variables from .env file
load_dotenv()

app = Flask(__name__)

cred = credentials.Certificate("firebase-adminsdk.json") 
firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET")
})

DATABASE_USER = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")

uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"

client = MongoClient(uri, server_api=ServerApi('1'))

db = client.dev
user_data_collection = db.user_data
user_data_collection.create_index("firebase_uid", unique=True)
posts_collection = db.posts

# ─── Auth helper ──────────────────────────────────────────────────────────────

def get_uid_from_request():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, (jsonify({"error": "Missing token"}), 401)
    id_token = auth_header.split(" ")[1]
    decoded_token = firebase_auth.verify_id_token(id_token)
    return decoded_token['uid'], None

# ─── User routes ──────────────────────────────────────────────────────────────

@app.route('/dev/user_data', methods=['GET'], strict_slashes=False)
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
        
        existing_user["_id"] = str(existing_user["_id"])
        existing_user["posts"] = [str(p) for p in existing_user.get("posts", [])]
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

# ─── Post routes ──────────────────────────────────────────────────────────────

@app.route('/dev/feed', methods=['GET'])
def get_feed():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        # Return all posts from all users except the current user
        user = user_data_collection.find_one({"firebase_uid": uid})
        exclude_user_id = user["_id"] if user else None

        # query = {"user_id": {"$ne": exclude_user_id}} if exclude_user_id else {}
        query = {}  #load own posts in feed for now
        posts = list(posts_collection.find(query).sort("date_posted", -1))
        for p in posts:
            p["_id"] = str(p["_id"])
            p["user_id"] = str(p["user_id"])
        return jsonify(posts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/dev/posts', methods=['GET'])
def get_posts():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user["_id"]
        posts = list(posts_collection.find({"user_id": user_id}))
        for p in posts:
            p["_id"] = str(p["_id"])
            p["user_id"] = str(p["user_id"])
        return jsonify(posts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/dev/posts', methods=['POST'])
def create_post():
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json
        new_post = {
            "user_id": user["_id"],
            "post_title": data.get("post_title", ""),
            "description": data.get("description", ""),
            "photos": data.get("photos", []),
            "is_good": data.get("is_good", False),
            "trade_history": {},
            "incoming_offers": [],
        }

        result = posts_collection.insert_one(new_post)
        post_id = result.inserted_id

        # Push the new post's _id into the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$push": {"posts": post_id}}
        )

        new_post["_id"] = str(post_id)
        new_post["user_id"] = str(new_post["user_id"])
        return jsonify(new_post), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/dev/posts/<post_id>', methods=['PATCH'])
def update_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        allowed_fields = {'post_title', 'description', 'photos', 'is_good'}
        data = request.json
        update = {k: v for k, v in data.items() if k in allowed_fields}

        if not update:
            return jsonify({"error": "No valid fields to update"}), 400

        posts_collection.update_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]},
            {"$set": update}
        )
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/dev/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        uid, err = get_uid_from_request()
        if err: return err

        user = user_data_collection.find_one({"firebase_uid": uid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        posts_collection.delete_one(
            {"_id": ObjectId(post_id), "user_id": user["_id"]}
        )

        # Pull the post's _id out of the user's posts array
        user_data_collection.update_one(
            {"firebase_uid": uid},
            {"$pull": {"posts": ObjectId(post_id)}}
        )

        # Delete all photos for this post from Firebase Storage
        try:
            bucket = firebase_storage.bucket()
            prefix = f"post_photos/{uid}/{post_id}/"
            blobs = bucket.list_blobs(prefix=prefix)
            for blob in blobs:
                blob.delete()
        except Exception as storage_err:
            # Non-fatal — log but don't fail the request
            print(f"Storage cleanup warning: {storage_err}")

        return jsonify({"message": "Deleted"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)