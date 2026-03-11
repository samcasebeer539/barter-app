# remove is_good and add date_posted to posts
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_USER = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")

uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"
client = MongoClient(uri, server_api=ServerApi('1'))

db = client.dev

# Remove is_good from all posts that have it
remove_result = db.posts.update_many(
    {"is_good": {"$exists": True}},
    {"$unset": {"is_good": ""}}
)
print(f"Removed is_good from {remove_result.modified_count} posts")

# Add date_posted to all posts missing it, using now as a fallback
add_result = db.posts.update_many(
    {"date_posted": {"$exists": False}},
    {"$set": {"date_posted": datetime.now(timezone.utc)}}
)
print(f"Added date_posted to {add_result.modified_count} posts")