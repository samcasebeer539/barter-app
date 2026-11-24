from flask import jsonify, request
from firebase_admin import auth as firebase_auth
from bson import ObjectId
import math
from datetime import datetime, timezone
from backend import games_collection, user_data_collection


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


# ── Distance between players ───────────────────────────────────────────────

_EARTH_RADIUS_MI = 3958.8


def _coords(locations):
    """(lat, lon) pairs from a saved-locations list, skipping bad entries."""
    out = []
    for loc in locations or []:
        try:
            out.append((float(loc["latitude"]), float(loc["longitude"])))
        except (KeyError, TypeError, ValueError):
            continue
    return out


def _haversine_mi(a, b):
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    h = (math.sin((lat2 - lat1) / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2)
    return 2 * _EARTH_RADIUS_MI * math.asin(math.sqrt(min(1.0, h)))


def nearest_distance_mi(my_locations, their_locations):
    """Shortest straight-line distance in miles between any of my saved
    locations and any of theirs, or None if either side has none."""
    mine, theirs = _coords(my_locations), _coords(their_locations)
    if not mine or not theirs:
        return None
    return min(_haversine_mi(a, b) for a in mine for b in theirs)


def with_distances(posts, me):
    """Serialize feed posts, adding distance_mi (nearest distance between the
    caller's saved locations and the poster's; None if either has none).
    Looks up all the posters in one query."""
    my_locations = (me or {}).get("locations", [])
    poster_ids = list({p.get("user_id") for p in posts if p.get("user_id")})
    poster_locations = {
        u["_id"]: u.get("locations", [])
        for u in user_data_collection.find({"_id": {"$in": poster_ids}}, {"locations": 1})
    } if poster_ids else {}
    out = []
    for p in posts:
        d = nearest_distance_mi(my_locations, poster_locations.get(p.get("user_id"), []))
        s = serialize_post(p)
        s["distance_mi"] = None if d is None else round(d, 2)
        out.append(s)
    return out

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

