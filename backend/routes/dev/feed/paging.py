"""The feed and search share this: which posts you see, in which order, a
page at a time.

You see everyone's posts except your own, blocked users' (either way), and
posts already traded (in an agreed or completed deal).

Paging: ?sort=nearest|farthest|newest|oldest&limit=24&offset=0 answers
{"posts": [...], "nextOffset": 24 | null}. nextOffset is where the next page
starts (null: that was the last one). The app drops a post it already has,
in case one shifted pages between requests (e.g. someone posted).

Without any of those parameters the answer is the old one: every post as a
plain list, newest first (for app builds from before paging).
"""
from flask import jsonify, request
from backend import posts_collection, user_data_collection
from helpers import blocked_ids_for, with_distances, nearest_distance_mi, NOT_TRADED

SORTS = ("nearest", "farthest", "newest", "oldest")
DEFAULT_LIMIT = 24
MAX_LIMIT = 50


def visible_posts_query(user, extra=None):
    """Mongo query for the posts this user can see in the feed / search."""
    hidden = [user["_id"], *blocked_ids_for(user)] if user else []
    query = {**NOT_TRADED, **(extra or {})}
    if hidden:
        query["user_id"] = {"$nin": hidden}
    return query


def _int_arg(name, default, low, high):
    raw = request.args.get(name)
    if raw is None:
        return default, None
    try:
        value = int(raw)
    except ValueError:
        return None, (jsonify({"error": f"{name} must be a whole number"}), 400)
    if not low <= value <= high:
        return None, (jsonify({"error": f"{name} must be from {low} to {high}"}), 400)
    return value, None


def respond_with_feed(user, query):
    """Answer a feed / search request for these posts (see module docs)."""
    if not any(k in request.args for k in ("sort", "limit", "offset")):
        posts = list(posts_collection.find(query).sort([("date_posted", -1), ("_id", -1)]))
        return jsonify(with_distances(posts, user)), 200

    sort = request.args.get("sort", "newest")
    if sort not in SORTS:
        return jsonify({"error": f"sort must be one of {', '.join(SORTS)}"}), 400
    limit, err = _int_arg("limit", DEFAULT_LIMIT, 1, MAX_LIMIT)
    if err:
        return err
    offset, err = _int_arg("offset", 0, 0, 1_000_000)
    if err:
        return err

    if sort in ("newest", "oldest"):
        direction = -1 if sort == "newest" else 1
        page = list(
            posts_collection.find(query)
            .sort([("date_posted", direction), ("_id", direction)])
            .skip(offset)
            .limit(limit + 1)  # one extra: is there a next page?
        )
    else:
        page = _by_distance(user, query, nearest=(sort == "nearest"), offset=offset, limit=limit + 1)

    has_more = len(page) > limit
    return jsonify({
        "posts": with_distances(page[:limit], user),
        "nextOffset": offset + limit if has_more else None,
    }), 200


def _by_distance(user, query, nearest, offset, limit):
    """Posts ordered by distance from you (nearest or farthest first), as the
    app always showed them: posts with no known distance last, newest first
    among equals. Distances come from saved locations (not stored on posts),
    so this ranks the light fields of every matching post, then loads just
    the page."""
    light = list(posts_collection.find(query, {"_id": 1, "user_id": 1, "date_posted": 1}))
    my_locations = (user or {}).get("locations", [])
    poster_ids = list({p["user_id"] for p in light if p.get("user_id")})
    locations = {
        u["_id"]: u.get("locations", [])
        for u in user_data_collection.find({"_id": {"$in": poster_ids}}, {"locations": 1})
    } if poster_ids else {}
    distance = {pid: nearest_distance_mi(my_locations, locs) for pid, locs in locations.items()}

    # Newest first among equal distances (stable sorts: tiebreak first).
    light.sort(key=lambda p: (_date_key(p), p["_id"]), reverse=True)
    known = [p for p in light if distance.get(p.get("user_id")) is not None]
    unknown = [p for p in light if distance.get(p.get("user_id")) is None]
    known.sort(key=lambda p: distance[p["user_id"]], reverse=not nearest)
    ids = [p["_id"] for p in (known + unknown)[offset:offset + limit]]

    docs = {d["_id"]: d for d in posts_collection.find({"_id": {"$in": ids}})}
    return [docs[i] for i in ids if i in docs]


def _date_key(post):
    d = post.get("date_posted")
    return d.isoformat() if hasattr(d, "isoformat") else str(d or "")
