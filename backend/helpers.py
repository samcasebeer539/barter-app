from flask import jsonify, request
from firebase_admin import auth as firebase_auth

def serialize_post(p):
    p["_id"] = str(p["_id"])
    p["user_id"] = str(p["user_id"])
    if "date_posted" in p and hasattr(p["date_posted"], "isoformat"):
        p["date_posted"] = p["date_posted"].isoformat()
    return p

def get_uid_from_request():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, (jsonify({"error": "Missing token"}), 401)
    id_token = auth_header.split(" ")[1]
    decoded_token = firebase_auth.verify_id_token(id_token)
    return decoded_token['uid'], None