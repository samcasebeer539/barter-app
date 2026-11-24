from flask import Blueprint, jsonify, request
from backend import user_data_collection
from helpers import get_uid_from_request, version_of
from models.game import Game
from routes.dev.trades.open.route import open_offers_for
from routes.dev.trades.query.route import open_queries_for
from routes.dev.trades.declined.route import declined_offers_for
from routes.dev.trades.close.route import close_games_for
from routes.dev.trades.history.route import history_for, history_counts_for

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
    """Everything the CLOSE tab shows, in one request:
    close         games settling where/when, plus agreed deals
    closeVersion  the close list's version (see GET /dev/trades/close)
    counts        how many ACCEPTED / DECLINED TRADES there are
    With ?history=1 (once the app has opened a history dropdown), also the
    lists themselves: completed (ACCEPTED TRADES), declined (DECLINED TRADES)."""
    user, err = _current_user()
    if err:
        return err
    close = close_games_for(user)
    out = {
        "close": close,
        "closeVersion": version_of(close),
        "counts": history_counts_for(user),
    }
    if request.args.get("history") == "1":
        out["completed"] = history_for(user, "completed")
        out["declined"] = history_for(user, "declined")
    return jsonify(out), 200
