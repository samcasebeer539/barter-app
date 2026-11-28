from flask import jsonify, Blueprint
import traceback
from helpers import get_uid_from_request, current_user, pass_through_errors
from routes.dev.feed.paging import visible_posts_query, respond_with_feed

feed_bp = Blueprint('feed', __name__)


@feed_bp.route('/dev/feed', methods=['GET'])
def get_feed():
    """Everyone else's posts: not your own, not blocked users', not traded
    ones. A page at a time with ?sort=&limit=&offset= (see feed/paging.py)."""
    try:
        uid, err = get_uid_from_request()
        if err: return err
        user = current_user()
        return respond_with_feed(user, visible_posts_query(user))

    except pass_through_errors():
        raise
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
