from flask import Blueprint, jsonify
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade, current_user, blocked_ids_for
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

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Games whose turn timer ran out only flip to declined when loaded,
    # so settle those first.
    Game.expire_overdue_for_user(user["_id"])
    return jsonify(declined_offers_for(user)), 200


def declined_offers_for(user):
    """DECLINED OFFERS deck (call Game.expire_overdue_for_user first).
    Turn logs, posts, owners and any re-offers are each fetched in one query
    for all the games."""
    my_id = user["_id"]
    blocked = blocked_ids_for(user)

    games = [Game.from_doc(doc) for doc in games_collection.find({
        "initiator_user_id": my_id,
        "phase": "declined",
    }).sort("completed_at", -1)]
    if not games:
        return []

    game_ids = [g._id for g in games]
    turns_by_game = {gid: [] for gid in game_ids}
    for t in trades_collection.find({"game_id": {"$in": game_ids}}).sort("created_at", 1):
        turns_by_game[t["game_id"]].append(t)

    post_ids = list({g.target_post_id for g in games})
    # Posts you've offered on again since: an ongoing game past "open"
    # (an open game only has questions).
    reoffered = {
        doc["target_post_id"]
        for doc in games_collection.find({
            "initiator_user_id": my_id,
            "target_post_id": {"$in": post_ids},
            "phase": {"$nin": list(Game.CLOSED_PHASES) + ["open"]},
        }, {"target_post_id": 1})
    }
    posts = {p["_id"]: p for p in posts_collection.find({"_id": {"$in": post_ids}})}
    owners = {u["_id"]: u for u in user_data_collection.find(
        {"_id": {"$in": list({g.receiver_user_id for g in games})}}, {"first_name": 1})}

    results = []
    seen_post_ids = set()
    for game in games:
        post_id = game.target_post_id
        if post_id in seen_post_ids or game.receiver_user_id in blocked:
            continue
        turns = turns_by_game[game._id]
        types = {t["type"] for t in turns}
        # Only games where an offer was made (not just questions) and that
        # never reached barter.
        if "offer" not in types or "barter" in types:
            continue
        seen_post_ids.add(post_id)
        if post_id in reoffered:
            continue
        post = posts.get(post_id)
        if not post:
            continue
        declines = [t for t in turns if t["type"] == "decline"]
        decline = declines[-1] if declines else None
        owner = owners.get(game.receiver_user_id)
        results.append({
            # Same shape as the open/query lists, so the client can reuse
            # normalizeTradeItem.
            "_id": f"{game._id}:{post_id}",
            "game_id": str(game._id),
            "type": "declined",
            "actor_id": str(decline["actor_id"]) if decline else None,
            "post": serialize_post(post),
            "messages": [],
            # The game's full history, oldest first, for the deck's turn log.
            "turns": [serialize_trade(t) for t in turns],
            "my_id": str(my_id),
            "partner_name": (owner or {}).get("first_name", ""),
        })

    return results
