from flask import jsonify, request
from firebase_admin import auth as firebase_auth
from bson import ObjectId
from datetime import datetime

def clean(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, list):
        return [clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    return obj

def serialize_post(post):
    return clean(post)

def get_uid_from_request():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, (jsonify({"error": "Missing token"}), 401)
    id_token = auth_header.split(" ")[1]
    decoded_token = firebase_auth.verify_id_token(id_token)
    return decoded_token['uid'], None

def serialize_trade(trade):
    # Ensures trades are serialized as strings
    trade["_id"] = str(trade["_id"])

    for key in [
        "initiator_user_id",
        "receiver_user_id",
        "offered_post_id",
        "target_post_id"
    ]:
        if key in trade and trade[key]:
            trade[key] = str(trade[key])

    return trade