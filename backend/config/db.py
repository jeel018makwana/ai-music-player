from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))

db = client["music_player"]
songs_collection = db["songs"]
users_collection = db["users"]