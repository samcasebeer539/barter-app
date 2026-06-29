from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade
from models.game import Game

trades_barter_bp = Blueprint("trades_barter", __name__)

@trades_barter_bp.route("/dev/trades/barter", methods=["POST"])
def send_barter():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    data = request.json
    game_id = data.get("gameId")
    selected_post_ids = data.get("selectedPostIds")

    if not game_id or not selected_post_ids:
        return jsonify({"error": "Missing fields"}), 400

    game_id = ObjectId(game_id)
    game = Game.get(game_id)

    if not game:
        return jsonify({"error": "Game not found"}), 404

    if game.receiver_user_id != user["_id"]:
        return jsonify({"error": "Only the receiver can barter"}), 403

    selected_post_ids = [ObjectId(pid) for pid in selected_post_ids]

    initiator_post_count = posts_collection.count_documents({
        "_id": {"$in": selected_post_ids},
        "user_id": game.initiator_user_id,
    })
    if initiator_post_count != len(selected_post_ids):
        return jsonify({"error": "Selected posts must belong to the other player"}), 400

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


def _serialize_user(user_doc):
    if not user_doc:
        return None
    return {
        "_id": str(user_doc["_id"]),
        "first_name": user_doc.get("first_name", ""),
        "last_name": user_doc.get("last_name", ""),
        "pronouns": user_doc.get("pronouns", ""),
        "bio": user_doc.get("bio", ""),
        "profileImageUrl": user_doc.get("profile_photo", ""),
        "email": user_doc.get("email", ""),
        "email_visible": user_doc.get("email_visible", False),
        "phone_visible": user_doc.get("phone_visible", False),
        "locations": user_doc.get("locations", []),
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

def _resolve_posts(post_ids):
    posts = []
    for pid in post_ids:
        post = posts_collection.find_one({"_id": pid})
        if post:
            posts.append(_serialize_post(post))
    return posts

@trades_barter_bp.route("/dev/trades/barter", methods=["GET"])
def get_barter_games():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    games = list(
        games_collection.find({
            "$or": [
                {"initiator_user_id": user["_id"]},
                {"receiver_user_id": user["_id"]},
            ],
            "phase": "barter",
        })
    )

    results = []
    for game in games:
        is_initiator = game["initiator_user_id"] == user["_id"]

        my_user_id = user["_id"]
        partner_user_id = game["receiver_user_id"] if is_initiator else game["initiator_user_id"]

        my_role = "initiator" if is_initiator else "receiver"
        partner_role = "receiver" if is_initiator else "initiator"

        partner_user = user_data_collection.find_one({"_id": partner_user_id})

        turns = list(trades_collection.find({"game_id": game["_id"]}).sort("created_at", 1))

        results.append({
            "gameId": str(game["_id"]),
            "turnUserId": str(game["turn_user_id"]),
            "myTurn": game["turn_user_id"] == my_user_id,
            "player": {
                "user": _serialize_user(user),
                "posts": _resolve_posts(game["cards"].get(my_role, [])),
            },
            "partner": {
                "user": _serialize_user(partner_user),
                "posts": _resolve_posts(game["cards"].get(partner_role, [])),
            },
            "turns": [serialize_trade(t) for t in turns],
        })

    return jsonify(results), 200