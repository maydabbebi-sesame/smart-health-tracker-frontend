from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from security import decode_id, encode_id, publicize_user
from auth import token_required, roles_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@token_required
@roles_required("admin")
def get_admin_users():
    """List all users for admin management."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_user(user) for user in users])


@admin_bp.route("/users/<uid>", methods=["GET"])
@token_required
@roles_required("admin")
def get_admin_user(uid: str):
    """Get a specific user by UID for admin."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id = %s", (internal_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(publicize_user(user))


@admin_bp.route("/users/<uid>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_admin_user(uid: str):
    """Delete a user by UID (admin only)."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

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
    return jsonify({"message": "User deleted successfully"})


@admin_bp.route("/statistics", methods=["GET"])
@token_required
@roles_required("admin")
def get_admin_statistics():
    """Get platform statistics for admin dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    stats = {}

    cursor.execute("SELECT COUNT(*) as count FROM users")
    stats["total_users"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    stats["admin_users"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM doctors")
    stats["total_doctors"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM appointments")
    stats["total_appointments"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'")
    stats["scheduled_appointments"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM vitals")
    stats["total_vitals"] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE is_read = 0")
    stats["unread_alerts"] = cursor.fetchone()["count"]

    cursor.close()
    conn.close()
    return jsonify(stats)


@admin_bp.route("/activity-log", methods=["GET"])
@token_required
@roles_required("admin")
def get_activity_log():
    """Get recent platform activity log."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Try to read from an activity_log table if it exists
    try:
        limit = request.args.get("limit", 50, type=int)
        cursor.execute("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT %s", (limit,))
        logs = cursor.fetchall()
        # Publicize UIDs in logs
        for log in logs:
            if log.get("user_id"):
                log["user_uid"] = encode_id(log["user_id"])
                del log["user_id"]
            if log.get("id"):
                log["uid"] = encode_id(log["id"])
                del log["id"]
    except Exception:
        # If activity_log table doesn't exist, build activity from recent records
        logs = []

        # Recent user registrations
        cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10")
        for user in cursor.fetchall():
            logs.append({
                "uid": encode_id(user["id"]),
                "action": "user_registered",
                "description": f"User {user['name']} ({user['email']}) registered",
                "created_at": str(user.get("created_at", ""))
            })

        # Recent appointments
        cursor.execute("SELECT id, user_id, doctor_id, status, created_at FROM appointments ORDER BY created_at DESC LIMIT 10")
        for appt in cursor.fetchall():
            logs.append({
                "uid": encode_id(appt["id"]),
                "action": "appointment_created",
                "description": f"Appointment (status: {appt['status']})",
                "user_uid": encode_id(appt["user_id"]) if appt.get("user_id") else None,
                "created_at": str(appt.get("created_at", ""))
            })

        # Sort by created_at descending
        logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    cursor.close()
    conn.close()
    return jsonify(logs)
