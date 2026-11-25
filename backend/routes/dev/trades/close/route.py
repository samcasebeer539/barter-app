from flask import Blueprint, jsonify
from backend import user_data_collection
from helpers import get_uid_from_request, json_with_version, current_user
from routes.dev.trades.barter.route import games_in_phase_for_user

trades_close_bp = Blueprint("trades_close", __name__)


@trades_close_bp.route("/dev/trades/close", methods=["GET"])
def get_close_games():
    """Games where both players *accepted in barter and are now settling
    where/when to meet. Same shape as GET /dev/trades/barter."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # 204 if the app already has this exact list (its background check).
    return json_with_version(close_games_for(user))


def close_games_for(user):
    # Agreed deals stay in the close tab.
    return games_in_phase_for_user(user, ["close", "agreed"])
