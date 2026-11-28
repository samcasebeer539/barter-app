"""Deleting your account (Apple requires apps with sign-up to offer this).

DELETE /dev/account removes, in this order:
  1. your Firebase sign-in, first, so if it fails nothing else is touched
     and you can try again (never: data gone but still able to sign in);
  2. every ongoing trade with you is declined for the other player
     (reason "account_deleted"); finished trades stay in their history;
  3. your posts, and every photo you uploaded (posts and profile);
  4. you from anyone's block list; then your profile itself.
Reviews you left stay, shown as from a "Former member".
"""
import traceback
from flask import Blueprint, jsonify
from firebase_admin import auth as firebase_auth, storage as firebase_storage
from backend import user_data_collection, posts_collection, games_collection
from helpers import get_uid_from_request, current_user
from models.game import Game

account_bp = Blueprint("account", __name__)


def _delete_photos(uid):
    """Every file under your post photos and your profile photo. A storage
    hiccup is logged, not fatal: the account still goes."""
    try:
        bucket = firebase_storage.bucket()
        for prefix in (f"post_photos/{uid}/", f"profile_photos/{uid}."):
            for blob in bucket.list_blobs(prefix=prefix):
                blob.delete()
    except Exception as err:
        print(f"Storage cleanup warning (account {uid}): {err}")


@account_bp.route("/dev/account", methods=["DELETE"])
def delete_account():
    uid, err = get_uid_from_request()
    if err:
        return err
    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    me = user["_id"]

    try:
        firebase_auth.delete_user(uid)
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Couldn't delete your sign-in. Nothing was deleted; try again."}), 502

    ongoing = games_collection.find({
        "$or": [{"initiator_user_id": me}, {"receiver_user_id": me}],
        "phase": {"$nin": Game.CLOSED_PHASES},
    }, {"_id": 1})
    declined = sum(Game.force_decline(doc["_id"], lambda g: me, "account_deleted") for doc in ongoing)

    posts = posts_collection.delete_many({"user_id": me}).deleted_count
    _delete_photos(uid)
    user_data_collection.update_many({"blocked_user_ids": me}, {"$pull": {"blocked_user_ids": me}})
    user_data_collection.delete_one({"_id": me})

    return jsonify({"success": True, "declinedTrades": declined, "deletedPosts": posts}), 200
