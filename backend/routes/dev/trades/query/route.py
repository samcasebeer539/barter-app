from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend import user_data_collection, posts_collection, trades_collection, games_collection
from helpers import get_uid_from_request, serialize_post, serialize_trade
from models.game import Game, NotYourTurnError

trades_query_bp = Blueprint("trades_query", __name__)

@trades_query_bp.route("/dev/trades/query", methods=["GET"])
def get_queries():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    visible_game_ids = [
        g["_id"] for g in games_collection.find(
            {
                "initiator_user_id": user["_id"],
                "phase": {"$in": ["open", "offer_pending"]},
            },
            {"_id": 1}
        )
    ]

    queries = list(
        trades_collection.find({
            "actor_id": user["_id"],
            "type": "query",
            "game_id": {"$in": visible_game_ids},
        })
    )

    for i in range(len(queries)):
        queries[i] = serialize_trade(queries[i])
        post = posts_collection.find_one({"_id": ObjectId(queries[i]["target_post_id"])})
        if post:
            queries[i]["post"] = serialize_post(post)

    return jsonify(queries), 200


@trades_query_bp.route("/dev/trades/query", methods=["POST"])
def create_query():
    uid, err = get_uid_from_request()
    if err:
        return err

    user = user_data_collection.find_one({"firebase_uid": uid})

    data = request.json or {}

    # Inside an existing game (the trade deck): ask the other player.
    if data.get("gameId"):
        return _query_in_game(user, data)

    target_post_id = data.get("targetPostId")
    message = data.get("message")

    if not target_post_id or not message:
        return jsonify({"error": "Missing fields"}), 400

    target_post_id = ObjectId(target_post_id)
    target_post = posts_collection.find_one({"_id": target_post_id})

    if not target_post:
        return jsonify({"error": "Post not found"}), 404

    game = Game.get_or_create(
        initiator_id=user["_id"],
        receiver_id=target_post["user_id"],
        target_post_id=target_post_id,
    )

    # Once a game is past the offer stage, questions are turns: send them
    # through the in-game path so they're turn-gated and lock the other
    # player's turn until answered, wherever in the app they were asked.
    if game.phase in Game.TURN_ENFORCED_PHASES:
        return _query_in_game(user, {
            "gameId": str(game._id),
            "message": message,
            "targetPostId": str(target_post_id),
        })

    trade = {
        "game_id": game._id,
        "type": "query",
        "actor_id": user["_id"],
        "target_post_id": target_post_id,
        "created_at": datetime.now(timezone.utc),
        "messages": [
            {
                "sender_id": user["_id"],
                "message": message,
                "created_at": datetime.now(timezone.utc),
            }
        ],
    }

    result = trades_collection.insert_one(trade)

    return jsonify({
        "success": True,
        "tradeId": str(result.inserted_id),
        "gameId": str(game._id),
    }), 201


def _query_in_game(user, data):
    """A query played as a turn in barter/close: it's turn-gated, and passes
    the turn so the other player can respond. targetPostId is optional and,
    if given, must be one of the other player's cards in this game."""
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Missing message"}), 400

    game = Game.get(ObjectId(data["gameId"]))
    if not game:
        return jsonify({"error": "Game not found"}), 404
    if not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403
    if game.expire_if_overdue():
        return jsonify({"error": "Turn time ran out; the trade was declined"}), 409

    target_post_id = None
    if data.get("targetPostId"):
        target_post_id = ObjectId(data["targetPostId"])
        my_cards = game.cards[game.role_of(user["_id"])]
        if target_post_id not in game.post_ids() or target_post_id in my_cards:
            return jsonify({"error": "That post isn't one of the other player's cards in this trade"}), 400

    try:
        game.apply_transition(
            "query",
            next_turn_user_id=game.other_user(user["_id"]),
            actor_id=user["_id"],
        )
    except NotYourTurnError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    game.save()

    now = datetime.now(timezone.utc)
    result = trades_collection.insert_one({
        "game_id": game._id,
        "type": "query",
        "actor_id": user["_id"],
        "target_post_id": target_post_id,
        "in_turn": True,  # the other player must answer before their turn begins
        "created_at": now,
        "messages": [{"sender_id": user["_id"], "message": message, "created_at": now}],
    })

    return jsonify({
        "success": True,
        "tradeId": str(result.inserted_id),
        "gameId": str(game._id),
    }), 201
