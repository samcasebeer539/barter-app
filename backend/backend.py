from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/dev/user_data', methods=['GET'])
def get_movie_names():
    try:
        user_cursor = user_data_collection.find({})

        users = []
        for user in user_cursor:
            user["_id"] = str(user["_id"]) 
            users.append(user)
    
        return jsonify({"user_data": users})
    except Exception as e:
        print("hmm")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Load variables from .env file
    load_dotenv()

    # Access the variables using os.getenv()
    database_user = os.getenv("DATABASE_USER")
    database_password = os.getenv("DATABASE_PASSWORD")

    uri = f"mongodb+srv://{database_user}:{database_password}@win-win.exml6ay.mongodb.net/?appName=Win-Win"

    # Create a new client and connect to the server
    client = MongoClient(uri, server_api=ServerApi('1'))

    db = client.dev
    user_data_collection = db.user_data

    # Send a ping to confirm a successful connection
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    app.run(debug=True)
