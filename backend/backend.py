from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import PyMongoError

import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

import firebase_admin
from firebase_admin import credentials

# Get env details

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def require_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Add it to backend/.env")
    return value

# Get firebase details

cred = credentials.Certificate(os.path.join(BASE_DIR, "..", "firebase-adminsdk.json"))

try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred, {'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET")
})

# Get MongoDB details

DATABASE_USER = quote_plus(require_env("MONGO_DATABASE_USER"))
DATABASE_PASSWORD = quote_plus(require_env("MONGO_DATABASE_PASSWORD"))
uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"

client = MongoClient(uri, server_api=ServerApi('1'), serverSelectionTimeoutMS=10000)

try:
    client.admin.command("ping")
except PyMongoError as err:
    raise RuntimeError(
        "Could not reach Mongo Atlas. Please check your internet connection, that your current IP is allowed under Atlas > Network Access, and the credentials are accurate in backend/.env"
    ) from err

db = client.dev
user_data_collection = db.user_data
posts_collection = db.posts
trades_collection = db.trades
games_collection = db.games
# Reports of users / posts, read by a person (in Atlas for now).
reports_collection = db.reports

# All indexes live in db_indexes.py (the tests build the same ones).
from db_indexes import create_indexes  # noqa: E402  (needs `db` above)
create_indexes(db)
