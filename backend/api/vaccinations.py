import mysql.connector
from flask import Blueprint, jsonify, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_vaccination
from auth import token_required

vaccinations_bp = Blueprint("vaccinations", __name__, url_prefix="/api/vaccinations")


@vaccinations_bp.route("", methods=["GET"])
@token_required
def get_vaccinations():
    """List the current user's vaccination records.

    GET /api/vaccinations
    Response: [ { uid, name, date_label, status, ... }, ... ]
    """
    internal_id = decode_id(g.current_user.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM vaccinations WHERE user_id = %s ORDER BY created_at DESC",
            (internal_id,),
        )
        entries = cursor.fetchall()
        cursor.close()
    finally:
        conn.close()
    return jsonify([publicize_vaccination(entry) for entry in entries])


@vaccinations_bp.route("", methods=["POST"])
@token_required
def add_vaccination():
    """Create a vaccination record for the current user.

    POST /api/vaccinations
    Body JSON: { name, date_label?, status? }
    Response: { message, uid }
    """
    data, error = validate_json_fields(["name"])
    if error:
        return error

    internal_id = decode_id(g.current_user.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO vaccinations (user_id, name, date_label, status) VALUES (%s, %s, %s, %s)",
                (internal_id, data["name"], data.get("date_label"), data.get("status")),
            )
            conn.commit()
        except mysql.connector.Error as exc:
            conn.rollback()
            return jsonify({"error": f"Database error: {exc}"}), 500
        finally:
            entry_id = cursor.lastrowid
            cursor.close()
    finally:
        conn.close()
    return jsonify({"message": "Vaccination added successfully", "uid": encode_id(entry_id)}), 201


@vaccinations_bp.route("/<uid>", methods=["PUT"])
@token_required
def update_vaccination(uid: str):
    """Update a vaccination record owned by the current user (or admin)."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid vaccination UID"}), 400

    data, error = get_request_data()
    if error:
        return error

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vaccinations WHERE id = %s", (internal_id,))
        entry = cursor.fetchone()
        cursor.close()
        if entry is None:
            return jsonify({"error": "Vaccination not found"}), 404

        if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(entry["user_id"]):
            return jsonify({"error": "Forbidden"}), 403

        allowed_fields = ["name", "date_label", "status"]
        update_fields = {field: data[field] for field in allowed_fields if field in data}
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400

        cursor = conn.cursor()
        try:
            set_clauses = ", ".join(f"{field} = %s" for field in update_fields)
            params = list(update_fields.values()) + [internal_id]
            cursor.execute(f"UPDATE vaccinations SET {set_clauses} WHERE id = %s", tuple(params))
            conn.commit()
        except mysql.connector.Error as exc:
            conn.rollback()
            return jsonify({"error": f"Database error: {exc}"}), 500
        finally:
            cursor.close()
    finally:
        conn.close()
    return jsonify({"message": "Vaccination updated successfully"})


@vaccinations_bp.route("/<uid>", methods=["DELETE"])
@token_required
def delete_vaccination(uid: str):
    """Delete a vaccination record owned by the current user (or admin)."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid vaccination UID"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vaccinations WHERE id = %s", (internal_id,))
        entry = cursor.fetchone()
        cursor.close()
        if entry is None:
            return jsonify({"error": "Vaccination not found"}), 404

        if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(entry["user_id"]):
            return jsonify({"error": "Forbidden"}), 403

        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM vaccinations WHERE id = %s", (internal_id,))
            conn.commit()
        except mysql.connector.Error as exc:
            conn.rollback()
            return jsonify({"error": f"Database error: {exc}"}), 500
        finally:
            cursor.close()
    finally:
        conn.close()
    return jsonify({"message": "Vaccination deleted successfully"})
