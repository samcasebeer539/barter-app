import hashlib
import json
from flask import jsonify, request, Response, g
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


# ── "Unchanged" answers for the app's background checks ──────────────────
def version_of(data) -> str:
    """A short fingerprint of a response body: same data, same version."""
    body = json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha1(body.encode()).hexdigest()[:16]


def json_with_version(data):
    """Send `data` with its version in the X-Version header. If the app
    already has that version (X-Known-Version), answer 204 with no body,
    so an unchanged list costs almost nothing to send or read."""
    version = version_of(data)
    if request.headers.get("X-Known-Version") == version:
        return Response(status=204, headers={"X-Version": version})
    resp = jsonify(data)
    resp.headers["X-Version"] = version
    return resp


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

def current_token():
    """The caller's verified Firebase token (decoded). init.py's
    before_request verifies it once per request; this only verifies here if
    that didn't run (e.g. a script calling a route directly)."""
    token = g.get("firebase_token")
    if token is None:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = firebase_auth.verify_id_token(auth_header.split(" ", 1)[1])
        g.firebase_token = token
        g.uid = token["uid"]
    return token


def get_uid_from_request():
    """(uid, None), or (None, error response) if there's no token."""
    token = current_token()
    if token is None:
        return None, (jsonify({"error": "Missing token"}), 401)
    return token["uid"], None


_NO_USER = object()

def current_user():
    """The caller's user record, looked up once per request (None if they
    have no account yet)."""
    user = g.get("current_user", _NO_USER)
    if user is _NO_USER:
        token = current_token()
        user = user_data_collection.find_one({"firebase_uid": token["uid"]}) if token else None
        g.current_user = user
    return user

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

