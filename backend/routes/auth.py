from flask import Blueprint, request, jsonify
from models.user_model import create_user, find_user_by_email
from flask_bcrypt import Bcrypt
import jwt
import datetime
import os

auth = Blueprint("auth", __name__)
bcrypt = Bcrypt()

print("MONGO:",os.getenv("MONGO_URI"))
# signup
@auth.route("/signup", methods=["POST"])
def signup():
    data = request.json

    if not data:
        return jsonify({"msg":"No data recieved"}), 400
    

    existing_user = find_user_by_email(data["email"])
    if existing_user:
        return jsonify({"msg": "User already exists"}), 400
    
    hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed_password
    }

    create_user(user)

    return jsonify({"msg": "User created successfully"}), 201

# Login
@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return jsonify({"msg": "No data received"}), 400
    
    user = find_user_by_email(data["email"])
    if not user:
        return jsonify({"msg":"User not found"}), 404
    
    if not bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({"msg": "Invalid credentials"}), 401
    
    token = jwt.encode({
        "email": user["email"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    },os.getenv("JWT_SECRET"), algorithm="HS256")

    return jsonify({"token": token, "name": user["name"]})
