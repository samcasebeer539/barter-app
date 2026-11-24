from flask import Blueprint, jsonify
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post
from models.game import Game

trades_declined_bp = Blueprint("trades_declined", __name__)


@trades_declined_bp.route("/dev/trades/declined", methods=["GET"])
def get_declined_posts():
    """DECLINED OFFERS: posts the caller offered on whose offer was declined
    before any bartering (declines after that are in the close tab's
    DECLINED TRADES). Each post appears once, most recently declined first;
    posts the caller has since offered on again are left out."""
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
        "initiator_user_id": my_id,
        "phase": "declined",
    }).sort("completed_at", -1)

    results = []
    seen_post_ids = set()
    for doc in games:
        game = Game.from_doc(doc)
        post_id = game.target_post_id
        if post_id in seen_post_ids:
            continue
        # Only games where an offer was made (not just questions) and that
        # never reached barter.
        if not trades_collection.find_one({"game_id": game._id, "type": "offer"}):
            continue
        if trades_collection.find_one({"game_id": game._id, "type": "barter"}):
            continue
        seen_post_ids.add(post_id)
        active = Game.find_active(my_id, post_id)
        if active and active.phase != "open":
            continue  # offered again since (an open game only has questions)
        post = posts_collection.find_one({"_id": post_id})
        if not post:
            continue
        decline = trades_collection.find_one(
            {"game_id": game._id, "type": "decline"},
            sort=[("created_at", -1)],
        )
        results.append({
            # Same shape as the open/query lists, so the client can reuse
            # normalizeTradeItem.
            "_id": f"{game._id}:{post_id}",
            "game_id": str(game._id),
            "type": "declined",
            "actor_id": str(decline["actor_id"]) if decline else None,
            "post": serialize_post(post),
            "messages": [],
        })

    return jsonify(results), 200
