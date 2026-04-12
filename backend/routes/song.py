from flask import Blueprint, request, jsonify
import cloudinary.uploader
from models.song_model import add_song, get_all_songs
from config.db import db
import cloudinary.api
import cloudinary
from config.cloudinary_config import *

song = Blueprint("song", __name__)
songs_collection = db["songs"]
@song.route("/songs", methods=["GET"])
def get_songs():
    try:
        songs = get_all_songs()
        return jsonify(songs), 200
    except Exception as e:
        print("FETCH ERROR:", e)
        return jsonify({"msg": "Failed to fetch songs"}), 500
@song.route("/sync-songs", methods=["GET"])
def sync_songs():
    try:
        result = cloudinary.api.resources(resource_type="video",max_results=500)

        print("CLOUDINARY RESULT:", result)

        synced = 0

        for item in result.get("resources", []):
            song_url = item["secure_url"]
            song_name = item["public_id"].split("/")[-1] + ".mp3"

            existing = songs_collection.find_one({"url": song_url})

            if not existing:
                songs_collection.insert_one({
                    "name": song_name,
                    "url": song_url
                })
                synced += 1

        return jsonify({"msg": f"{synced} songs synced"}), 200

    except Exception as e:
        print("❌ SYNC ERROR FULL:", str(e))
        return jsonify({"msg": str(e)}), 500
@song.route("/upload-song", methods=["POST"])
def upload_song():
    try:
        file = request.files.get("file")
        print(request.files)

        if not file:
            return jsonify({"msg":"No file provided"}), 400
        
        result = cloudinary.uploader.upload(file, resource_type="auto")

        song_data = {
            "name": file.filename,
            "url":result["secure_url"]
        }

        inserted = songs_collection.insert_one(song_data)

        print("INSERTED ID:", inserted.inserted_id)

        return jsonify({"msg": "uploaded"}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"msg": "failed"}), 500