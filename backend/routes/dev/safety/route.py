from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, posts_collection, games_collection, reports_collection
from helpers import get_uid_from_request, current_user, public_user
from models.game import Game

safety_bp = Blueprint("safety", __name__)

REPORT_REASONS = {"spam", "scam", "inappropriate", "harassment", "other"}
MAX_NOTE = 1000


def _object_id(raw):
    try:
        return ObjectId(raw)
    except (InvalidId, TypeError):
        return None


def _decline_games_between(me, other_id):
    """Block ends every ongoing trade between the two players (open
    questions, pending offers, barter, close, agreed deals), declined by the
    blocker. Returns how many."""
    docs = games_collection.find({
        "$or": [
            {"initiator_user_id": me, "receiver_user_id": other_id},
            {"initiator_user_id": other_id, "receiver_user_id": me},
        ],
        "phase": {"$nin": Game.CLOSED_PHASES},
    })
    # No turn rules: blocking always ends it, even mid-move.
    now = datetime.now(timezone.utc)
    return sum(Game.force_decline(doc["_id"], lambda g: me, "blocked", now) for doc in docs)


@safety_bp.route("/dev/block", methods=["POST"])
def block_user():
    """Block a user: { userId }. Neither of you sees the other's posts or can
    send offers / questions, and your ongoing trades with them are declined."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    other_id = _object_id((request.json or {}).get("userId"))
    if not other_id or not user_data_collection.find_one({"_id": other_id}, {"_id": 1}):
        return jsonify({"error": "User not found"}), 404
    if other_id == user["_id"]:
        return jsonify({"error": "You can't block yourself"}), 400

    user_data_collection.update_one({"_id": user["_id"]}, {"$addToSet": {"blocked_user_ids": other_id}})
    declined = _decline_games_between(user["_id"], other_id)
    return jsonify({"success": True, "declinedTrades": declined}), 200


@safety_bp.route("/dev/block/<user_id>", methods=["DELETE"])
def unblock_user(user_id):
    """Unblock a user. Declined trades stay declined."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    other_id = _object_id(user_id)
    if not user or not other_id:
        return jsonify({"error": "User not found"}), 404
    user_data_collection.update_one({"_id": user["_id"]}, {"$pull": {"blocked_user_ids": other_id}})
    return jsonify({"success": True}), 200


@safety_bp.route("/dev/blocked", methods=["GET"])
def get_blocked_users():
    """The users you've blocked, as their public profiles (shown as user
    cards in settings), most recently blocked last."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    ids = (user or {}).get("blocked_user_ids", [])
    users = {u["_id"]: u for u in user_data_collection.find({"_id": {"$in": ids}})}
    return jsonify([public_user(users[i]) for i in ids if i in users]), 200


@safety_bp.route("/dev/report", methods=["POST"])
def report():
    """Report a user or one of their posts:
    { userId?, postId?, reason, note? } (userId comes from the post if only
    postId is given). Saved for a person to review."""
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    reason = data.get("reason")
    if reason not in REPORT_REASONS:
        return jsonify({"error": f"reason must be one of {sorted(REPORT_REASONS)}"}), 400

    post_id = _object_id(data.get("postId")) if data.get("postId") else None
    reported_id = _object_id(data.get("userId")) if data.get("userId") else None
    if post_id:
        post = posts_collection.find_one({"_id": post_id}, {"user_id": 1})
        if not post:
            return jsonify({"error": "Post not found"}), 404
        reported_id = reported_id or post["user_id"]
    if not reported_id or not user_data_collection.find_one({"_id": reported_id}, {"_id": 1}):
        return jsonify({"error": "User not found"}), 404
    if reported_id == user["_id"]:
        return jsonify({"error": "You can't report yourself"}), 400

    reports_collection.insert_one({
        "reporter_id": user["_id"],
        "reported_user_id": reported_id,
        "post_id": post_id,
        "reason": reason,
        "note": (data.get("note") or "").strip()[:MAX_NOTE],
        "status": "open",
        "created_at": datetime.now(timezone.utc),
    })
    return jsonify({"success": True, "reportedUserId": str(reported_id)}), 201
