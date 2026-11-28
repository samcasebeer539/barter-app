import os
from flask import Flask, request, g, jsonify
from firebase_admin import auth
import backend

from routes.dev.create_user.route import create_user_bp
from routes.dev.feed.route import feed_bp
from routes.dev.locations.route import locations_bp
from routes.dev.locations.user_id.route import locations_userid_bp
from routes.dev.post_id.route import postId_bp
from routes.dev.posts.post_id.route import posts_post_id_bp
from routes.dev.posts.route import posts_bp
from routes.dev.trades.offer.route import trades_offer_bp
from routes.dev.trades.query.route import trades_query_bp
from routes.dev.trades.barter.route import trades_barter_bp
from routes.dev.trades.open.route import trades_open_bp
from routes.dev.trades.rescind.route import trades_rescind_bp
from routes.dev.trades.stall.route import trades_stall_bp
from routes.dev.trades.declined.route import trades_declined_bp
from routes.dev.trades.close.route import trades_close_bp
from routes.dev.trades.answer.route import trades_answer_bp
from routes.dev.trades.where.route import trades_where_bp
from routes.dev.trades.subtract.route import trades_subtract_bp
from routes.dev.trades.add.route import trades_add_bp
from routes.dev.trades.when.route import trades_when_bp
from routes.dev.trades.review.route import trades_review_bp
from routes.dev.trades.history.route import trades_history_bp
from routes.dev.trades.tabs.route import trades_tabs_bp
from routes.dev.profile_page.route import profile_page_bp
from routes.dev.safety.route import safety_bp
from routes.dev.account.route import account_bp
from routes.dev.trades.trade_details.accept.route import trades_detail_accept_bp
from routes.dev.trades.trade_details.decline.route import trades_detail_decline_bp
from routes.dev.trades.trade_details.get_trade.route import trades_detail_get_trade_bp
from routes.dev.update_user.route import update_user_bp
from routes.dev.user_data.route import user_data_bp
from routes.dev.user_id.route import userId_bp
from routes.dev.trades.incoming.route import trades_incoming_bp, trades_incoming_queries_bp
from routes.dev.settings.route import settings_bp
from routes.dev.feed.search.route import feed_search_bp


from models.game import GameConflictError
from bson.errors import InvalidId
app = Flask(__name__)


@app.errorhandler(InvalidId)
def invalid_id(e):
    """A malformed id anywhere in a request (ObjectId("nope"))."""
    return jsonify({"error": "Invalid id"}), 400


@app.errorhandler(GameConflictError)
def game_conflict(e):
    """Two moves raced on one game (see Game.save); the later one is refused."""
    return jsonify({"error": str(e)}), 409


@app.before_request
def require_firebase_token():
    if request.method == "OPTIONS":
        return None
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"error": "Missing token"}), 401
    try:
        decoded = auth.verify_id_token(header.split(" ", 1)[1])
    except Exception:
        return jsonify({"error": "Invalid or expired token"}), 401
    # Routes read these (helpers.get_uid_from_request / current_user /
    # current_token) instead of verifying the token again.
    g.uid = decoded["uid"]
    g.firebase_token = decoded
    return None

# Registers a blueprint (like an instance of the app) for each API route
app.register_blueprint(create_user_bp)
app.register_blueprint(feed_bp)
app.register_blueprint(locations_bp)
app.register_blueprint(locations_userid_bp)
app.register_blueprint(postId_bp)
app.register_blueprint(posts_post_id_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(trades_offer_bp)
app.register_blueprint(trades_query_bp)
app.register_blueprint(trades_barter_bp)
app.register_blueprint(trades_open_bp)
app.register_blueprint(trades_detail_accept_bp)
app.register_blueprint(trades_detail_decline_bp)
app.register_blueprint(trades_detail_get_trade_bp)
app.register_blueprint(update_user_bp)
app.register_blueprint(user_data_bp)
app.register_blueprint(userId_bp)
app.register_blueprint(trades_incoming_bp)
app.register_blueprint(trades_incoming_queries_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(feed_search_bp)
app.register_blueprint(trades_rescind_bp)
app.register_blueprint(trades_stall_bp)
app.register_blueprint(trades_declined_bp)
app.register_blueprint(trades_close_bp)
app.register_blueprint(trades_answer_bp)
app.register_blueprint(trades_where_bp)
app.register_blueprint(trades_subtract_bp)
app.register_blueprint(trades_add_bp)
app.register_blueprint(trades_when_bp)
app.register_blueprint(trades_review_bp)
app.register_blueprint(trades_history_bp)
app.register_blueprint(trades_tabs_bp)
app.register_blueprint(profile_page_bp)
app.register_blueprint(safety_bp)
app.register_blueprint(account_bp)




if __name__ == "__main__":
    # The Werkzeug debugger lets anyone who can reach the server run code on it,
    # so it's opt-in: FLASK_DEBUG=1 python3 backend/init.py
    debug = os.getenv("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=5001, debug=debug)