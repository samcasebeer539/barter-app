from flask import jsonify, request
from firebase_admin import auth as firebase_auth
from bson import ObjectId
from datetime import datetime, timezone
from backend import games_collection


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

# Never sent to anyone but the account owner.
_PRIVATE_USER_FIELDS = {"firebase_uid", "email", "phone"}


def public_user(user):
    """A user record as other players may see it: firebase_uid is always
    removed, and email/phone only appear if the owner made them visible."""
    if not user:
        return None
    out = {k: v for k, v in user.items() if k not in _PRIVATE_USER_FIELDS}
    if user.get("email_visible"):
        out["email"] = user.get("email", "")
    if user.get("phone_visible"):
        out["phone"] = user.get("phone", "")
    return clean(out)


def serialize_trade(trade):
    return clean(trade)

