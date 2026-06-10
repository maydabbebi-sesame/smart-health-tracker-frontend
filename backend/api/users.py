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
