from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from backend import user_data_collection, trades_collection
from helpers import get_uid_from_request, current_user, text_too_long
from models.game import Game

trades_answer_bp = Blueprint("trades_answer", __name__)


@trades_answer_bp.route("/dev/trades/answer", methods=["POST"])
def answer_query():
    """Answer a question the other player asked. The answer joins the query's
    message thread, so it shows wherever the question does. Answering an
    in-game question unlocks the answerer's turn; it doesn't use it up."""
    uid, err = get_uid_from_request()
    if err:
        return err

    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    message = (data.get("message") or "").strip()
    if not data.get("queryId") or not message:
        return jsonify({"error": "Missing queryId or message"}), 400
    err = text_too_long({"message": message})
    if err:
        return err

    try:
        query_id = ObjectId(data["queryId"])
    except InvalidId:
        return jsonify({"error": "Invalid queryId"}), 400

    query = trades_collection.find_one({"_id": query_id, "type": "query"})
    if not query:
        return jsonify({"error": "Question not found"}), 404

    game = Game.get(query["game_id"])
    if not game or not game.is_participant(user["_id"]):
        return jsonify({"error": "Unauthorized"}), 403
    if query["actor_id"] == user["_id"]:
        return jsonify({"error": "You can't answer your own question"}), 400
    if query.get("answered_at"):
        return jsonify({"error": "Already answered"}), 409
    if game.expire_if_overdue() or game.is_closed():
        return jsonify({"error": "This trade has ended"}), 409

    now = datetime.now(timezone.utc)
    result = trades_collection.update_one(
        # answered_at: None guards against a double submit answering twice.
        {"_id": query_id, "answered_at": None},
        {
            "$set": {"answered_at": now},
            "$push": {"messages": {"sender_id": user["_id"], "message": message, "created_at": now}},
        },
    )
    if result.modified_count == 0:
        return jsonify({"error": "Already answered"}), 409

    return jsonify({"success": True, "gameId": str(game._id), "tradeId": str(query_id)}), 200
