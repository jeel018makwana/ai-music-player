from config.db import db

songs_collection = db["songs"]

def add_song(song):
    return songs_collection.insert_one(song)

def get_all_songs():
    return list(songs_collection.find({}, {"_id": 0}))