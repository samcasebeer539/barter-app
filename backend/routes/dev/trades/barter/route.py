from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade, json_with_version, current_user, blocked_ids_for
from models.game import Game, GameConflictError, iso_utc

trades_barter_bp = Blueprint("trades_barter", __name__)

@trades_barter_bp.route("/dev/trades/barter", methods=["POST"])
def send_barter():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    game_id = data.get("gameId")
    selected_post_ids = data.get("selectedPostIds")

    if not game_id or not selected_post_ids or not isinstance(selected_post_ids, list):
        return jsonify({"error": "Missing fields"}), 400

    try:
        game_id = ObjectId(game_id)
        selected_post_ids = [ObjectId(pid) for pid in selected_post_ids]
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid gameId or postId"}), 400
    game = Game.get(game_id)

    if not game:
        return jsonify({"error": "Game not found"}), 404

    if game.receiver_user_id != user["_id"]:
        return jsonify({"error": "Only the receiver can barter"}), 403
    if game.initiator_user_id in blocked_ids_for(user):
        return jsonify({"error": "You can't trade with this user"}), 403
    if game.expire_if_overdue():
        return jsonify({"error": "Turn time ran out; the trade was declined"}), 409

    initiator_post_count = posts_collection.count_documents({
        "_id": {"$in": selected_post_ids},
        "user_id": game.initiator_user_id,
    })
    if initiator_post_count != len(selected_post_ids):
        return jsonify({"error": "Selected posts must belong to the other player"}), 400
    if Game.traded_post_ids(selected_post_ids + [game.target_post_id]):
        return jsonify({"error": "One of those items has already been traded"}), 409

    try:
        game.apply_transition("barter", next_turn_user_id=game.initiator_user_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    for pid in selected_post_ids:
        game.add_card("initiator", pid)
    game.save()

    trade = {
        "game_id": game_id,
        "type": "barter",
        "actor_id": user["_id"],
        "selected_post_ids": selected_post_ids,
        "created_at": datetime.now(timezone.utc),
        "messages": [],
    }
    trades_collection.insert_one(trade)

    return jsonify({"success": True, "gameId": str(game_id)}), 201


def _serialize_user(user_doc, is_self=False):
    """is_self=False hides email unless the user made it visible."""
    if not user_doc:
        return None
    return {
        "_id": str(user_doc["_id"]),
        "first_name": user_doc.get("first_name", ""),
        "last_name": user_doc.get("last_name", ""),
        "pronouns": user_doc.get("pronouns", ""),
        "bio": user_doc.get("bio", ""),
        "profileImageUrl": user_doc.get("profile_photo", ""),
        "email": user_doc.get("email", "") if is_self or user_doc.get("email_visible") else "",
        "email_visible": user_doc.get("email_visible", False),
        "phone_visible": user_doc.get("phone_visible", False),
        "locations": user_doc.get("locations", []),
        "rating": user_doc.get("rating"),
        "reviewCount": user_doc.get("reviewCount", 0),
    }

def _serialize_post(post_doc):
    if not post_doc:
        return None
    return {
        "_id": str(post_doc["_id"]),
        "name": post_doc.get("post_title", post_doc.get("name", "")),
        "description": post_doc.get("description", ""),
        "photos": post_doc.get("photos", []),
        "date_posted": post_doc.get("date_posted", ""),
    }

def _resolve_posts(post_ids, posts_by_id=None):
    """Serialized posts in card order, skipping deleted ones. Pass
    posts_by_id (from one batched lookup) to avoid a query per post."""
    if posts_by_id is None:
        posts_by_id = {p["_id"]: p for p in posts_collection.find({"_id": {"$in": list(post_ids)}})}
    return [_serialize_post(posts_by_id[pid]) for pid in post_ids if pid in posts_by_id]


def games_in_phase_for_user(user, phase):
    """Every game the user is in that's in `phase` (a phase name or a list
    of them), shaped for a TradeDeck. Shared by the barter and close tabs.

    Partners, posts, turn logs and pending questions are each fetched in
    one query for all the games, not per game."""
    phases = [phase] if isinstance(phase, str) else list(phase)
    my_user_id = user["_id"]
    games = list(
        games_collection.find({
            "$or": [
                {"initiator_user_id": my_user_id},
                {"receiver_user_id": my_user_id},
            ],
            "phase": {"$in": phases},
        })
    )

    # Decline any game whose active player ran out of time, and leave it
    # out of the list (it's no longer in this phase).
    live = []
    for game in games:
        game_obj = Game.from_doc(game)
        if game_obj.expire_if_overdue():
            continue
        if "turn_started_at" not in game:
            try:
                game_obj.save()  # start the clock for games from before turn timers
            except GameConflictError:
                pass  # someone just moved; it has a clock now
        live.append((game, game_obj))
    if not live:
        return []

    game_ids = [g["_id"] for g, _ in live]
    partner_ids = {
        g["receiver_user_id"] if g["initiator_user_id"] == my_user_id else g["initiator_user_id"]
        for g, _ in live
    }
    card_ids = {pid for g, _ in live for side in g["cards"].values() for pid in side}

    partners = {u["_id"]: u for u in user_data_collection.find({"_id": {"$in": list(partner_ids)}})}
    posts_by_id = {p["_id"]: p for p in posts_collection.find({"_id": {"$in": list(card_ids)}})}
    turns_by_game = {gid: [] for gid in game_ids}
    for t in trades_collection.find({"game_id": {"$in": game_ids}}).sort("created_at", 1):
        turns_by_game[t["game_id"]].append(t)
    # A question the partner asked that this user must answer before their
    # turn can begin (same rule as Game.pending_query_for): the latest
    # unanswered in-turn query from the other player, per game.
    pending_by_game = {}
    for t in trades_collection.find({
        "game_id": {"$in": game_ids},
        "type": "query",
        "actor_id": {"$ne": my_user_id},
        "in_turn": True,
        "answered_at": None,
    }).sort("created_at", -1):
        pending_by_game.setdefault(t["game_id"], t)

    results = []
    for game, game_obj in live:
        deadline = game_obj.turn_deadline()
        is_initiator = game["initiator_user_id"] == my_user_id
        partner_user_id = game["receiver_user_id"] if is_initiator else game["initiator_user_id"]
        my_role = "initiator" if is_initiator else "receiver"
        partner_role = "receiver" if is_initiator else "initiator"
        pending = pending_by_game.get(game["_id"])

        results.append({
            "gameId": str(game["_id"]),
            "phase": game_obj.phase,
            "turnUserId": str(game["turn_user_id"]),
            "myTurn": game["turn_user_id"] == my_user_id,
            "turnDeadline": iso_utc(deadline),
            "pendingQuery": {
                "tradeId": str(pending["_id"]),
                "message": (pending.get("messages") or [{}])[0].get("message", ""),
            } if pending else None,
            "player": {
                "user": _serialize_user(user, is_self=True),
                "posts": _resolve_posts(game["cards"].get(my_role, []), posts_by_id),
            },
            "partner": {
                "user": _serialize_user(partners.get(partner_user_id)),
                "posts": _resolve_posts(game["cards"].get(partner_role, []), posts_by_id),
            },
            "turns": [serialize_trade(t) for t in turns_by_game[game["_id"]]],
        })

    return results


@trades_barter_bp.route("/dev/trades/barter", methods=["GET"])
def get_barter_games():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # 204 if the app already has this exact list (its background check).
    return json_with_version(games_in_phase_for_user(user, "barter"))
