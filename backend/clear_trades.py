from backend import trades_collection, games_collection

trades_collection.delete_many({})
games_collection.delete_many({})  # only if you've created test games already
print("cleared")