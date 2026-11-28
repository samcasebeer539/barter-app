from flask import Blueprint, jsonify
from backend import trades_collection, posts_collection, games_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade, current_user, game_histories

trades_open_bp = Blueprint("trades_open", __name__)

@trades_open_bp.route("/dev/trades/open", methods=["GET"])
def get_open_trades():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(open_offers_for(user)), 200


def open_offers_for(user):
    """OFFERS deck: your offers still waiting on the other player."""
    pending_game_ids = [
        g["_id"] for g in games_collection.find(
            {"initiator_user_id": user["_id"], "phase": "offer_pending"},
            {"_id": 1}
        )
    ]

    trades = list(
        trades_collection.find({
            "actor_id": user["_id"],
            "type": "offer",
            "game_id": {"$in": pending_game_ids},
        })
    )

    # All the target posts in one query.
    posts = {p["_id"]: p for p in posts_collection.find(
        {"_id": {"$in": [t.get("target_post_id") for t in trades]}})}
    # Each card shows its game's whole history.
    histories = game_histories({t["game_id"] for t in trades}, user)
    out = []
    for t in trades:
        post = posts.get(t.get("target_post_id"))
        item = serialize_trade(t)
        if post:
            item["post"] = serialize_post(post)
        item.update(histories.get(t["game_id"], {}))
        out.append(item)
    return out
