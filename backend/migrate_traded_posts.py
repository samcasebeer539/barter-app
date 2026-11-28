"""One-off: mark posts in deals that were already agreed or completed before
posts got a "traded" flag, so they leave the feed, search and profiles.
Safe to run more than once. Run from backend/:  python migrate_traded_posts.py
"""
from backend import games_collection, posts_collection

ids = set()
for game in games_collection.find({"phase": {"$in": ["agreed", "completed"]}}, {"cards": 1}):
    for side in (game.get("cards") or {}).values():
        ids.update(side)

result = posts_collection.update_many({"_id": {"$in": list(ids)}}, {"$set": {"traded": True}})
print(f"Marked {result.modified_count} posts as traded ({len(ids)} in agreed / completed deals)")
