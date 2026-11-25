from flask import Blueprint, jsonify
from bson import ObjectId
from backend import user_data_collection
from helpers import get_uid_from_request, json_with_version, current_user
from routes.dev.settings.route import settings_for
from routes.dev.user_data.route import own_user_json
from routes.dev.posts.route import my_posts_for
from routes.dev.trades.incoming.route import incoming_offers_for, incoming_queries_for
from routes.dev.user_id.route import profiles_for

profile_page_bp = Blueprint("profile_page", __name__)


@profile_page_bp.route("/dev/profile_page", methods=["GET"])
def get_profile_page():
    """Everything the profile screen loads, in one request. Each part has the
    same shape as its own endpoint:
    user            GET /dev/user_data
    posts           GET /dev/posts
    locations       GET /dev/locations
    incomingOffers  GET /dev/trades/incoming
    incomingQueries GET /dev/trades/incoming_queries
    offererProfiles GET /dev/profiles for everyone with a pending offer
    settings        GET /settings

    Sent with its version (X-Version); if the app sends the version it
    already has (X-Known-Version) and nothing changed, the answer is 204
    with no body."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    if not user:
        return jsonify({"message": "No user found"}), 400

    offers = incoming_offers_for(user)
    offerer_ids = list(dict.fromkeys(ObjectId(o["fromUserId"]) for o in offers))
    return json_with_version({
        "user": own_user_json(user),
        "posts": my_posts_for(user),
        "locations": user.get("locations", []),
        "incomingOffers": offers,
        "incomingQueries": incoming_queries_for(user),
        "offererProfiles": profiles_for(offerer_ids),
        "settings": settings_for(user),
    })
