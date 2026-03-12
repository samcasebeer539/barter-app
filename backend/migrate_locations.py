"""
migrate_locations.py
────────────────────
One-time migration: adds an empty `locations` field to every user document
that doesn't already have one.

Run once from the same directory as backend.py:
    python migrate_locations.py
"""

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_USER     = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")

uri = (
    f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}"
    f"@win-win.exml6ay.mongodb.net/?appName=Win-Win"
)

client = MongoClient(uri, server_api=ServerApi('1'))
db = client.dev
user_data_collection = db.user_data

def migrate():
    # Only touch documents that don't already have a locations field
    result = user_data_collection.update_many(
        {"locations": {"$exists": False}},
        {"$set": {"locations": []}}
    )
    print(f"Migration complete — {result.modified_count} user(s) updated.")

if __name__ == "__main__":
    migrate()