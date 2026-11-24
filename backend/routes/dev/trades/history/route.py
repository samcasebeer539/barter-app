from flask import Blueprint, jsonify, request
from backend import user_data_collection, games_collection, trades_collection
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
    return jsonify(history_for(user, status)), 200


def history_for(user, status):
    """Finished trades with `status` (call Game.expire_overdue_for_user first)."""
    games = games_in_phase_for_user(user, status)
    if status == "declined":
        games = [g for g in games if any(t.get("type") == "barter" for t in g["turns"])]

    # Most recent first.
    games.sort(key=lambda g: g["turns"][-1].get("created_at", "") if g["turns"] else "", reverse=True)
    return games


def history_counts_for(user):
    """How many ACCEPTED / DECLINED TRADES there are, without loading them
    (the close tab shows the counts before the lists are opened). Matches
    history_for; call Game.expire_overdue_for_user first."""
    mine = {"$or": [{"initiator_user_id": user["_id"]}, {"receiver_user_id": user["_id"]}]}
    completed = games_collection.count_documents({**mine, "phase": "completed"})
    declined_ids = [g["_id"] for g in games_collection.find({**mine, "phase": "declined"}, {"_id": 1})]
    declined = len(trades_collection.distinct(
        "game_id", {"game_id": {"$in": declined_ids}, "type": "barter"})) if declined_ids else 0
    return {"completed": completed, "declined": declined}
