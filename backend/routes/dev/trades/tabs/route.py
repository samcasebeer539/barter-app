from flask import Blueprint, jsonify
from backend import user_data_collection
from helpers import get_uid_from_request
from models.game import Game
from routes.dev.trades.open.route import open_offers_for
from routes.dev.trades.query.route import open_queries_for
from routes.dev.trades.declined.route import declined_offers_for
from routes.dev.trades.close.route import close_games_for
from routes.dev.trades.history.route import history_for

trades_tabs_bp = Blueprint("trades_tabs", __name__)


def _current_user():
    uid, err = get_uid_from_request()
    if err:
        return None, err
    user = user_data_collection.find_one({"firebase_uid": uid})
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    # Timed-out games only flip to declined when loaded; settle them once
    # so every list below agrees.
    Game.expire_overdue_for_user(user["_id"])
    return user, None


@trades_tabs_bp.route("/dev/trades/open_tab", methods=["GET"])
def get_open_tab():
    """Everything the barter page's OPEN tab shows, in one request:
    queries (QUERIES deck), offers (OFFERS deck), declined (DECLINED OFFERS)."""
    user, err = _current_user()
    if err:
        return err
    return jsonify({
        "queries": open_queries_for(user),
        "offers": open_offers_for(user),
        "declined": declined_offers_for(user),
    }), 200


@trades_tabs_bp.route("/dev/trades/close_tab", methods=["GET"])
def get_close_tab():
    """Everything the CLOSE tab shows, in one request: close (games settling
    where/when, plus agreed deals), completed (ACCEPTED TRADES), declined
    (DECLINED TRADES)."""
    user, err = _current_user()
    if err:
        return err
    return jsonify({
        "close": close_games_for(user),
        "completed": history_for(user, "completed"),
        "declined": history_for(user, "declined"),
    }), 200
