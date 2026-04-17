from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
from flask import Flask
import firebase_admin
from firebase_admin import credentials

# Load variables from .env file
load_dotenv()

cred = credentials.Certificate("firebase-adminsdk.json") 
firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET")
})

DATABASE_USER = os.getenv("EXPO_PUBLIC_MONGODB_DATABASE_USER")
DATABASE_PASSWORD = os.getenv("EXPO_PUBLIC_MONGO_DATABASE_PASSWORD")
uri = f"mongodb+srv://{DATABASE_USER}:{DATABASE_PASSWORD}@win-win.exml6ay.mongodb.net/?appName=Win-Win"

client = MongoClient(uri, server_api=ServerApi('1'))
db = client.dev
user_data_collection = db.user_data
user_data_collection.create_index("firebase_uid", unique=True)
posts_collection = db.posts

