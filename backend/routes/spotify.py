from flask import Blueprint, redirect, request, jsonify
import requests
import base64
from config.spotify_config import *
from pymongo import MongoClient

spotify = Blueprint("spotify", __name__)

access_token = None
refresh_token = None

# ✅ MongoDB
client = MongoClient("mongodb+srv://Jeelmakwana:Jeel%40018@cluster0.43mydqv.mongodb.net/?retryWrites=true&w=majority")
db = client["music_app"]
collection = db["spotify_tokens"]

# ✅ Load refresh token from DB
doc = collection.find_one({"type": "spotify"})
if doc:
    refresh_token = doc.get("refresh_token")


# ================= LOGIN =================
@spotify.route("/spotify/login")
def login():
    scope = "user-modify-playback-state user-read-playback-state streaming"

    auth_url = (
        "https://accounts.spotify.com/authorize"
        f"?client_id={SPOTIFY_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={SPOTIFY_REDIRECT_URI}"
        f"&scope={scope}"
    )

    return redirect(auth_url)


# ================= CALLBACK =================
@spotify.route("/spotify/callback")
def callback():
    global access_token, refresh_token

    code = request.args.get("code")
    if not code:
        return "Error: No code received"

    token_url = "https://accounts.spotify.com/api/token"

    auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI
    }

    res = requests.post(token_url, headers=headers, data=data)
    tokens = res.json()

    print("spotify token response:", tokens)

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")

    # ✅ SAVE refresh token in DB
    if refresh_token:
        collection.update_one(
            {"type": "spotify"},
            {"$set": {"refresh_token": refresh_token}},
            upsert=True
        )

    if not access_token:
        return f"Error getting access token: {tokens}"

    return "Spotify Connected! You can close this tab."


# ================= REFRESH TOKEN =================
def refresh_access_token():
    global access_token, refresh_token

    if not refresh_token:
        print("❌ No refresh token found")
        return

    url = "https://accounts.spotify.com/api/token"

    auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }

    res = requests.post(url, headers=headers, data=data)
    tokens = res.json()

    access_token = tokens.get("access_token")

    print("✅ Access token refreshed")

def get_active_device_id():
    url = "https://api.spotify.com/v1/me/player/devices"
    res = spotify_request("GET", url)
    data = res.json()

    devices = data.get("devices", [])

    if not devices:
        print("❌ No devices found")
        return None

    for device in devices:
        if device.get("is_active"):
            return device.get("id")

    return devices[0].get("id")
# ================= AUTO GENERATE TOKEN =================
def generate_access_token():
    global refresh_token

    if refresh_token:
        print("🔄 Generating access token from DB refresh token...")
        refresh_access_token()


# ================= HEADERS =================
def get_headers():
    global access_token

    # ❌ No token → generate
    if not access_token:
        print("⚠️ No access token → generating...")
        refresh_access_token()

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # 🔍 test token
    test = requests.get("https://api.spotify.com/v1/me", headers=headers)

    if test.status_code == 401:
        print("⚠️ Token expired → refreshing...")
        refresh_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

    return headers


# ================= MAIN REQUEST HANDLER =================
def spotify_request(method, url):
    headers = get_headers()

    if method == "PUT":
        res = requests.put(url, headers=headers)
    elif method == "POST":
        res = requests.post(url, headers=headers)
    else:
        res = requests.get(url, headers=headers)

    # 🔴 TOKEN EXPIRED → RETRY
    if res.status_code == 401:
        print("🔁 Retrying after refresh...")
        refresh_access_token()

        headers = get_headers()

        if method == "PUT":
            res = requests.put(url, headers=headers)
        elif method == "POST":
            res = requests.post(url, headers=headers)
        else:
            res = requests.get(url, headers=headers)

    return res


# ================= CONTROLS =================
@spotify.route("/spotify/play", methods=["POST"])
def play():
    device_id = get_active_device_id()

    if not device_id:
        return jsonify({"error": "No active device"}), 400

    url = f"https://api.spotify.com/v1/me/player/play?device_id={device_id}"

    res = requests.put(url, headers=get_headers())

    print("PLAY RESPONSE:", res.text)
    return jsonify({"msg": "Playing"})
@spotify.route("/spotify/play-song", methods=["POST"])
def play_song():
    data = request.json
    song_name = data.get("song")

    search_url = f"https://api.spotify.com/v1/search?q={song_name}&type=track&limit=10"
    search_res = spotify_request("GET", search_url)
    items = search_res.json().get("tracks", {}).get("items", [])

    if not items:
        return jsonify({"msg": "Song not found"}), 404

    uri = items[0]["uri"]

    device_id = get_active_device_id()

    if not device_id:
        return jsonify({"error": "No active device"}), 400

    play_url = f"https://api.spotify.com/v1/me/player/play?device_id={device_id}"

    body = {
        "context_uri": items[0]["album"]["uri"]
    }

    res = requests.put(play_url, headers=get_headers(), json=body)

    return jsonify({"msg": "Playing song"})
@spotify.route("/spotify/pause", methods=["POST"])
def pause():
    url = "https://api.spotify.com/v1/me/player/pause"
    res = spotify_request("PUT", url)
    print("PAUSE RESPONSE:", res.text)
    return jsonify({"msg": "Paused", "res": res.text})


@spotify.route("/spotify/next", methods=["POST"])
def next_track():
    device_id = get_active_device_id()

    if not device_id:
        return jsonify({"error": "No active device"}), 400

    url = f"https://api.spotify.com/v1/me/player/next?device_id={device_id}"
    res = spotify_request("POST", url)

    print("NEXT RESPONSE:", res.text)
    return jsonify({"msg": "Next", "res": res.text})

@spotify.route("/spotify/previous", methods=["POST"])
def previous_track():
    device_id = get_active_device_id()

    if not device_id:
        return jsonify({"error": "No active device"}), 400

    url = f"https://api.spotify.com/v1/me/player/previous?device_id={device_id}"
    res = spotify_request("POST", url)

    print("PREVIOUS RESPONSE:", res.text)
    return jsonify({"msg": "Previous", "res": res.text})
# ================= VOLUME CONTROL =================

@spotify.route("/spotify/volume-up", methods=["POST"])
def volume_up():
    try:
        # 🎯 current volume fetch
        res = spotify_request("GET", "https://api.spotify.com/v1/me/player")
        data = res.json()

        current_volume = data.get("device", {}).get("volume_percent", 50)

        # 🔼 increase volume
        new_volume = min(current_volume + 10, 100)

        url = f"https://api.spotify.com/v1/me/player/volume?volume_percent={new_volume}"
        spotify_request("PUT", url)

        print(f"🔊 Volume Up: {current_volume} → {new_volume}")

        return jsonify({
            "msg": "Volume increased",
            "volume": new_volume
        })

    except Exception as e:
        print("Volume Up Error:", e)
        return jsonify({"error": str(e)}), 500


@spotify.route("/spotify/volume-down", methods=["POST"])
def volume_down():
    try:
        # 🎯 current volume fetch
        res = spotify_request("GET", "https://api.spotify.com/v1/me/player")
        data = res.json()

        current_volume = data.get("device", {}).get("volume_percent", 50)

        # 🔽 decrease volume
        new_volume = max(current_volume - 10, 0)

        url = f"https://api.spotify.com/v1/me/player/volume?volume_percent={new_volume}"
        spotify_request("PUT", url)

        print(f"🔉 Volume Down: {current_volume} → {new_volume}")

        return jsonify({
            "msg": "Volume decreased",
            "volume": new_volume
        })

    except Exception as e:
        print("Volume Down Error:", e)
        return jsonify({"error": str(e)}), 500

# ================= DEVICES =================
@spotify.route("/spotify/devices")
def get_devices():
    url = "https://api.spotify.com/v1/me/player/devices"
    res = spotify_request("GET", url)
    print("DEVICES:", res.json())
    return res.json()


# ================= MANUAL REFRESH =================
@spotify.route("/spotify/refresh-manual")
def refresh_token_route():
    refresh_access_token()
    return jsonify({"msg": "Token refreshed"})


# ✅ AUTO RUN ON SERVER START
generate_access_token()