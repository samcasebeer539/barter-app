# add visible booleans for email and phone
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_USER = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")

uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"
client = MongoClient(uri, server_api=ServerApi('1'))

db = client.dev
result = db.user_data.update_many(
    {"email_visible": {"$exists": False}},  # only update docs missing the field
    {"$set": {"email_visible": False, "phone_visible": False}}
)

print(f"Updated {result.modified_count} users")