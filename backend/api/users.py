from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_user
from auth import token_required, roles_required
from werkzeug.security import check_password_hash, generate_password_hash

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("", methods=["GET"])
@token_required
@roles_required("admin")
def get_users():
    """List all users.

    GET /api/users
    Response: [ { uid, name, email }, ... ]
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_user(user) for user in users])


@users_bp.route("", methods=["POST"])
def add_user():
    """Create a new user.

    POST /api/users
    Body JSON: { name, email, password }
    Response: { message, uid }
    """
    # Backwards-compatible: password is optional for create user endpoint.
    data, error = get_request_data()
    if error:
        return error

    if "name" not in data or "email" not in data:
        return jsonify({"error": "Missing required fields: name, email"}), 400

    password = data.get("password")
    role = data.get("role", "user")

    conn = get_db_connection()
    cursor = conn.cursor()
    if password:
        password_hash = generate_password_hash(password)
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                       (data["name"], data["email"], password_hash, role))
    else:
        cursor.execute("INSERT INTO users (name, email) VALUES (%s, %s)",
                       (data["name"], data["email"]))

    conn.commit()
    user_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({"message": "User added successfully!", "uid": encode_id(user_id)})


@users_bp.route("/<uid>", methods=["PUT"])
@token_required
def update_user(uid: str):
    """Update an existing user.

    PUT /api/users/<uid>
    Body JSON: { name, email }
    Response: { message }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    if g.current_user.get("uid") != uid and g.current_user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data, error = validate_json_fields(["name", "email"])
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET name = %s, email = %s WHERE id = %s",
        (data["name"], data["email"], internal_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "User updated successfully!"})


@users_bp.route("/<uid>", methods=["DELETE"])
@token_required
def delete_user(uid: str):
    """Delete a user by UID.

    DELETE /api/users/<uid>
    Response: { message }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    if g.current_user.get("uid") != uid and g.current_user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (internal_id,))
    if cursor.rowcount == 0:
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "User deleted successfully!"})


@users_bp.route("/reset-password", methods=["POST"])
@token_required
def reset_password():
    data, error = get_request_data()
    if error:
        return error

    new_password = data.get("new_password")
    current_password = data.get("current_password")
    target_uid = data.get("uid")

    if not new_password:
        return jsonify({"error": "Missing required field: new_password"}), 400

    requester = g.current_user
    target_internal_id = None

    if target_uid:
        if requester.get("role") != "admin":
            return jsonify({"error": "Forbidden"}), 403

        target_internal_id = decode_id(target_uid)
        if target_internal_id is None:
            return jsonify({"error": "Invalid user UID"}), 400
    else:
        if requester.get("uid") is None:
            return jsonify({"error": "Unable to determine current user"}), 401

        target_internal_id = decode_id(requester.get("uid"))
        if target_internal_id is None:
            return jsonify({"error": "Invalid current user UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id = %s", (target_internal_id,))
    user = cursor.fetchone()
    cursor.close()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if requester.get("role") != "admin" or target_uid is None:
        if not current_password:
            conn.close()
            return jsonify({"error": "Missing required field: current_password"}), 400
        if not check_password_hash(user["password"], current_password):
            conn.close()
            return jsonify({"error": "Invalid current password"}), 401

    cursor = conn.cursor()
    password_hash = generate_password_hash(new_password)
    cursor.execute("UPDATE users SET password = %s WHERE id = %s", (password_hash, target_internal_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Password updated successfully!"})


@users_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    """Get the current user's profile."""
    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id = %s", (internal_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(publicize_user(user))


@users_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    """Update the current user's profile."""
    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    allowed_fields = ["name", "email", "phone", "date_of_birth", "gender", "address", "emergency_contact"]
    updates = []
    values = []
    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = %s")
            values.append(data[field])

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    values.append(internal_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", tuple(values))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Profile updated successfully"})


@users_bp.route("/profile", methods=["DELETE"])
@token_required
def delete_profile():
    """Delete the current user's account."""
    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (internal_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Account deleted successfully"})


@users_bp.route("/change-password", methods=["POST"])
@token_required
def change_password():
    """Change the current user's password."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not current_password or not new_password:
        return jsonify({"error": "Missing required fields: current_password, new_password"}), 400

    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT password FROM users WHERE id = %s", (internal_id,))
    user = cursor.fetchone()
    if not user or not check_password_hash(user["password"], current_password):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid current password"}), 401

    password_hash = generate_password_hash(new_password)
    cursor.execute("UPDATE users SET password = %s WHERE id = %s", (password_hash, internal_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Password changed successfully"})


@users_bp.route("/profile-picture", methods=["POST"])
@token_required
def upload_profile_picture():
    """Upload a profile picture for the current user."""
    import os

    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Validate file type
    allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed_extensions:
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"}), 400

    # Save file
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "profile_pictures")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{requester.get('uid')}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    # Update user record
    picture_url = f"/uploads/profile_pictures/{filename}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET profile_picture = %s WHERE id = %s", (picture_url, internal_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Profile picture uploaded successfully", "url": picture_url})
