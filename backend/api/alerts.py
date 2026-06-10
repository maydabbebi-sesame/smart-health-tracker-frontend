from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_alert
from auth import token_required, roles_required
from email_utils import send_email


def insert_alert(conn, user_id: int, title: str, message: str, category: str = "general") -> int:
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO alerts (user_id, title, message, category, is_read) VALUES (%s, %s, %s, %s, %s)",
        (user_id, title, message, category, 0)
    )
    conn.commit()
    alert_id = cursor.lastrowid
    # Try to notify the user by email (best-effort)
    try:
        cur2 = conn.cursor(dictionary=True)
        cur2.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        u = cur2.fetchone()
        if u and u.get("email"):
            send_email(u.get("email"), f"[SmartHealth] {title}", message)
        cur2.close()
    except Exception:
        # swallow errors; notifications are best-effort
        pass
    cursor.close()
    return alert_id

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@alerts_bp.route("", methods=["GET"])
@token_required
def list_alerts():
    """List alerts for a user or admin.

    GET /api/alerts?user_uid=<uid>&unread_only=true
    Response: [ { uid, user_uid, title, message, category, is_read, created_at, updated_at }, ... ]
    """
    user_uid = request.args.get("user_uid")
    unread_only = request.args.get("unread_only", "false").lower() in ("1", "true", "yes")

    current_user = g.current_user
    current_uid = current_user.get("uid")
    current_role = current_user.get("role")

    if user_uid:
        user_id = decode_id(user_uid)
        if user_id is None:
            return jsonify({"error": "Invalid user UID"}), 400
        if current_role != "admin" and current_uid != user_uid:
            return jsonify({"error": "Forbidden"}), 403
    elif current_role != "admin":
        user_id = decode_id(current_uid)
    else:
        user_id = None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if user_id is not None:
        if unread_only:
            cursor.execute(
                "SELECT * FROM alerts WHERE user_id = %s AND is_read = 0 ORDER BY created_at DESC",
                (user_id,)
            )
        else:
            cursor.execute(
                "SELECT * FROM alerts WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
    else:
        if unread_only:
            cursor.execute(
                "SELECT * FROM alerts WHERE is_read = 0 ORDER BY created_at DESC"
            )
        else:
            cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC")

    alerts = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_alert(item) for item in alerts])


@alerts_bp.route("/<uid>", methods=["GET"])
@token_required
def get_alert(uid: str):
    """Get a single alert by UID."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid alert UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM alerts WHERE id = %s", (internal_id,))
    alert = cursor.fetchone()
    cursor.close()
    conn.close()

    if alert is None:
        return jsonify({"error": "Alert not found"}), 404

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(alert["user_id"]):
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(publicize_alert(alert))


@alerts_bp.route("", methods=["POST"])
@token_required
@roles_required("admin", "doctor")
def create_alert():
    """Create a new alert for a user."""
    data, error = validate_json_fields(["user_uid", "title", "message"])
    if error:
        return error

    user_id = decode_id(data["user_uid"])
    if user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    category = data.get("category", "general")
    is_read = 0

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO alerts (user_id, title, message, category, is_read) VALUES (%s, %s, %s, %s, %s)",
        (user_id, data["title"], data["message"], category, is_read)
    )
    conn.commit()
    alert_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return jsonify({"message": "Alert created successfully!", "uid": encode_id(alert_id)}), 201


@alerts_bp.route("/<uid>", methods=["PUT"])
@token_required
def update_alert(uid: str):
    """Update an alert's read status or content."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid alert UID"}), 400

    data, error = get_request_data()
    if error:
        return error

    update_fields = {}
    if "title" in data:
        update_fields["title"] = data["title"]
    if "message" in data:
        update_fields["message"] = data["message"]
    if "category" in data:
        update_fields["category"] = data["category"]
    if "is_read" in data:
        update_fields["is_read"] = 1 if bool(data["is_read"]) else 0

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM alerts WHERE id = %s", (internal_id,))
    alert = cursor.fetchone()
    if alert is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Alert not found"}), 404

    is_owner = g.current_user.get("uid") == encode_id(alert["user_id"])
    if g.current_user.get("role") != "admin" and not is_owner:
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    if g.current_user.get("role") == "user" and any(field in data for field in ["title", "message", "category"]):
        cursor.close()
        conn.close()
        return jsonify({"error": "Users may only update read status"}), 403

    set_clauses = []
    params = []
    for field, value in update_fields.items():
        set_clauses.append(f"{field} = %s")
        params.append(value)
    params.append(internal_id)

    cursor.execute(
        f"UPDATE alerts SET {', '.join(set_clauses)} WHERE id = %s",
        tuple(params)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Alert updated successfully!"})


@alerts_bp.route("/<uid>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_alert(uid: str):
    """Delete an alert by UID."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid alert UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts WHERE id = %s", (internal_id,))
    if cursor.rowcount == 0:
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"error": "Alert not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Alert deleted successfully!"})
