from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))

db = client["music_player"]
songs_collection = db["songs"]
users_collection = db["users"]