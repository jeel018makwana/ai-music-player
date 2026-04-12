from flask import Flask
from flask_cors import CORS
from routes.auth import auth
from dotenv import load_dotenv
from routes.song import song
from routes.spotify import spotify
import os

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(auth)
app.register_blueprint(song)
app.register_blueprint(spotify)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)