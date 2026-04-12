# from pymongo import MongoClient
# import os

# client = MongoClient(os.getenv("MONGO_URI"))
# db = client["music_player"]

# users_collection = db["users"]
# try:
#     client.admin.command('song')
#     print("MongoDB Connected Successfully!")
# except Exception as e:
#     print("MongoDB Connection Failed:", e)

from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))

db = client["music_player"]
songs_collection = db["songs"]
users_collection = db["users"]