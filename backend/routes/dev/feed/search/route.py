import re
from flask import Blueprint, jsonify, request
from helpers import current_user, get_uid_from_request
from routes.dev.feed.paging import visible_posts_query, respond_with_feed

feed_search_bp = Blueprint("feed_search", __name__)


@feed_search_bp.route("/dev/feed/search", methods=["GET"])
def search_feed():
    """The feed's posts whose title or description contains ?q= (any case).
    Pages like the feed (see feed/paging.py)."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()

    query = request.args.get("q", "")
    if not query:
        # Same shape as a result would have.
        paged = any(k in request.args for k in ("sort", "limit", "offset"))
        return jsonify({"posts": [], "nextOffset": None} if paged else [])

    # Match the text literally; raw input would be treated as a regex.
    pattern = re.escape(query[:100])
    text_match = {"$or": [
        {"post_title": {"$regex": pattern, "$options": "i"}},
        {"description": {"$regex": pattern, "$options": "i"}},
    ]}
    return respond_with_feed(user, visible_posts_query(user, text_match))
