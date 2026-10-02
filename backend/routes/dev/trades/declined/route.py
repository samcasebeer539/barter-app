from flask import Blueprint, jsonify
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post
from models.game import Game

trades_declined_bp = Blueprint("trades_declined", __name__)


@trades_declined_bp.route("/dev/trades/declined", methods=["GET"])
def get_declined_posts():
    """Every post that isn't the caller's, across all of the caller's
    declined games. Each post appears once, most recently declined first."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404
    my_id = user["_id"]

    # Games whose turn timer ran out only flip to declined when loaded,
    # so settle those first.
    Game.expire_overdue_for_user(my_id)

    games = games_collection.find({
        "$or": [{"initiator_user_id": my_id}, {"receiver_user_id": my_id}],
        "phase": "declined",
    }).sort("completed_at", -1)

    results = []
    seen_post_ids = set()
    for doc in games:
        game = Game.from_doc(doc)
        decline = trades_collection.find_one(
            {"game_id": game._id, "type": "decline"},
            sort=[("created_at", -1)],
        )

        for post_id in game.post_ids():
            if post_id in seen_post_ids:
                continue
            post = posts_collection.find_one({"_id": post_id})
            if not post or post.get("user_id") == my_id:
                continue
            seen_post_ids.add(post_id)
            results.append({
                # Same shape as the open/query lists, so the client can
                # reuse normalizeTradeItem. _id is unique per card.
                "_id": f"{game._id}:{post_id}",
                "game_id": str(game._id),
                "type": "declined",
                "actor_id": str(decline["actor_id"]) if decline else None,
                "post": serialize_post(post),
                "messages": [],
            })

    return jsonify(results), 200