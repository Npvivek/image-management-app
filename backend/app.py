from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user,
)
from werkzeug.utils import secure_filename
import os
import logging

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = "your_secret_key"
login_manager = LoginManager(app)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Mock user data (replace this with a database)
users = {
    "user": {"password": "password", "role": "normal"},
    "admin": {"password": "adminpassword", "role": "admin"},
}

# Mock labels data (replace this with a database)
image_labels = {}

# Set up logging configuration
logging.basicConfig(filename="app.log", level=logging.ERROR)


class User(UserMixin):
    pass


@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        user = User()
        user.id = user_id
        user.role = users[user_id]["role"]
        app.logger.info(f"Loaded user: {user_id}, Role: {user.role}")
        return user
    return None


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_paginated_images(page, per_page):
    try:
        all_images = os.listdir(app.config["UPLOAD_FOLDER"])
        start = (page - 1) * per_page
        end = start + per_page

        paginated_images = all_images[start:end]

        return [
            {
                "filename": img,
                "path": f"/uploads/{img}",
                "label": image_labels.get(img, ""),
            }
            for img in paginated_images
        ]
    except Exception as e:
        app.logger.error(f"Error getting paginated images: {e}")
        return []


@app.route("/")
def hello():
    return "I am the backend!"


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if username in users and users[username]["password"] == password:
            user = User()
            user.id = username
            user.role = users[username]["role"]
            login_user(user)
            return jsonify({"message": "Login successful", "role": user.role}), 200
        else:
            return jsonify({"message": "Login failed"}), 401
    except Exception as e:
        app.logger.error(f"Error during login: {e}")
        return (
            jsonify({"message": "An error occurred during login. Please try again."}),
            500,
        )


@app.route("/logout")
@login_required
def logout():
    try:
        logout_user()
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        app.logger.error(f"Error during logout: {e}")
        return (
            jsonify({"message": "An error occurred during logout. Please try again."}),
            500,
        )


@app.route("/user")
@login_required
def get_user():
    try:
        return jsonify({"username": current_user.id, "role": current_user.role}), 200
    except Exception as e:
        app.logger.error(f"Error getting user data: {e}")
        return jsonify({"message": "An error occurred while fetching user data."}), 500


@app.route("/upload", methods=["POST"])
@login_required
def upload_file():
    try:
        if "files" not in request.files:
            return jsonify({"message": "No files part"}), 400

        files = request.files.getlist("files")

        for file in files:
            if file.filename == "":
                return jsonify({"message": "No selected file"}), 400

            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            else:
                return (
                    jsonify(
                        {
                            "message": f"File upload failed for {file.filename}. "
                            "Allowed extensions: jpg, jpeg, png, gif"
                        }
                    ),
                    400,
                )

        return jsonify({"message": "Files uploaded successfully"}), 200

    except Exception as e:
        app.logger.error(f"Error during file upload: {e}")
        return (
            jsonify(
                {"message": "An error occurred during file upload. Please try again."}
            ),
            500,
        )


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/images", methods=["GET"])
@login_required
def get_images():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))

        images = get_paginated_images(page, per_page)

        return jsonify(images)
    except Exception as e:
        app.logger.error(f"Error getting images: {e}")
        return jsonify({"message": "An error occurred while fetching images."}), 500


@app.route("/admin-dashboard")
@login_required
def admin_dashboard():
    try:
        if current_user.role == "admin":
            return jsonify({"message": "Welcome to the Admin Dashboard!"}), 200
        else:
            return jsonify({"message": "Unauthorized access to Admin Dashboard"}), 403
    except Exception as e:
        app.logger.error(f"Error accessing Admin Dashboard: {e}")
        return (
            jsonify({"message": "An error occurred while accessing Admin Dashboard."}),
            500,
        )


@app.route("/label", methods=["POST", "DELETE"])
@login_required
def manage_label():
    try:
        data = request.get_json()

        # Modified: Admin can create labels
        if current_user.role == "admin" and request.method == "POST":
            label = data.get("label")
            if label and label not in image_labels:
                image_labels[label] = label
                return jsonify({"message": "Label created successfully"}), 200
            else:
                return (
                    jsonify({"message": "Label already exists or invalid label"}),
                    400,
                )

        # Modified: Admin can delete labels
        elif current_user.role == "admin" and request.method == "DELETE":
            labels = data.get("labels", [])
            for label in labels:
                image_labels.pop(label, None)
            return jsonify({"message": "Labels deleted successfully"}), 200
        else:
            return jsonify({"message": "Unauthorized access"}), 403

    except Exception as e:
        app.logger.error(f"Error managing label: {e}")
        return (
            jsonify(
                {"message": "An error occurred while managing label. Please try again."}
            ),
            500,
        )


# If an unhandled exception occurs, log it
@app.errorhandler(Exception)
def handle_error(e):
    app.logger.error(f"Unhandled Exception: {str(e)}")
    return jsonify({"message": "Internal Server Error"}), 500


if __name__ == "__main__":
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    app.run(port=5001, debug=True)
