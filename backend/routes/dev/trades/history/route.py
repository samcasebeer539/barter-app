from flask import Blueprint, jsonify, request
from backend import user_data_collection
from helpers import get_uid_from_request
from models.game import Game
from routes.dev.trades.barter.route import games_in_phase_for_user

trades_history_bp = Blueprint("trades_history", __name__)


@trades_history_bp.route("/dev/trades/history", methods=["GET"])
def get_trade_history():
    """Finished trades, same shape as GET /dev/trades/barter.
    ?status=completed  accepted trades (both players reviewed)
    ?status=declined   trades declined after reaching barter (declines
                       before that are in the open tab's DECLINED OFFERS)"""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404

    status = request.args.get("status")
    if status not in ("completed", "declined"):
        return jsonify({"error": "status must be 'completed' or 'declined'"}), 400

    # Timed-out games only flip to declined when loaded.
    Game.expire_overdue_for_user(user["_id"])

    games = games_in_phase_for_user(user, status)
    if status == "declined":
        games = [g for g in games if any(t.get("type") == "barter" for t in g["turns"])]

    # Most recent first.
    games.sort(key=lambda g: g["turns"][-1].get("created_at", "") if g["turns"] else "", reverse=True)
    return jsonify(games), 200
