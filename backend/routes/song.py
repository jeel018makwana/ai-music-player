from flask import Blueprint, request, jsonify
import cloudinary.uploader
from models.song_model import add_song, get_all_songs


song = Blueprint("song", __name__)


@song.route("/songs", methods=["GET"])
def get_songs():
    try:
        songs = get_all_songs()
        return jsonify(songs), 200
    except Exception as e:
        print("FETCH ERROR:", e)
        return jsonify({"msg": "Failed to fetch songs"}), 500

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

        add_song(song_data)

        return jsonify({"msg":"Song uploaded", "url":result["secure_url"]}), 200
    
    except Exception as e:
        print("UPLOAD ERROR:",e)
        return jsonify({"msg":"Upload failed"}), 500