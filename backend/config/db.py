from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client["music_player"]

users_collection = db["users"]
try:
    client.admin.command('ping')
    print("MongoDB Connected Successfully!")
except Exception as e:
    print("MongoDB Connection Failed:", e)