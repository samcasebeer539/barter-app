from backend import games_collection, trades_collection

print("=== games ===")
for g in games_collection.find({}, {"phase": 1, "initiator_user_id": 1, "target_post_id": 1}):
    print(g)

print("\n=== trades ===")
for t in trades_collection.find({}, {"type": 1, "game_id": 1, "initiator_user_id": 1}):
    print(t)