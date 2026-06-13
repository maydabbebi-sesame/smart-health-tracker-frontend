from flask import Blueprint, jsonify, request, g

from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_vital
from auth import token_required
from alerts import insert_alert
from flask import Response
import csv
import io
from datetime import datetime, timezone
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

vitals_bp = Blueprint("vitals", __name__, url_prefix="/api/vitals")


def _gather_vital_alerts(vitals: dict) -> tuple[bool, str, str]:
    warnings = []

    heart_rate = vitals.get("heart_rate")
    if heart_rate is not None:
        if heart_rate < 50 or heart_rate > 100:
            warnings.append(f"heart_rate={heart_rate}")

    systolic_bp = vitals.get("systolic_bp")
    diastolic_bp = vitals.get("diastolic_bp")
    if systolic_bp is not None and diastolic_bp is not None:
        if systolic_bp > 140 or systolic_bp < 90:
            warnings.append(f"systolic_bp={systolic_bp}")
        if diastolic_bp > 90 or diastolic_bp < 60:
            warnings.append(f"diastolic_bp={diastolic_bp}")

    temperature = vitals.get("temperature")
    if temperature is not None and (temperature > 38.0 or temperature < 36.0):
        warnings.append(f"temperature={temperature}")

    oxygen = vitals.get("oxygen_saturation")
    if oxygen is not None and oxygen < 95:
        warnings.append(f"oxygen_saturation={oxygen}")

    respiratory_rate = vitals.get("respiratory_rate")
    if respiratory_rate is not None and (respiratory_rate > 20 or respiratory_rate < 12):
        warnings.append(f"respiratory_rate={respiratory_rate}")

    if warnings:
        title = "Abnormal vital signs detected"
        message = "Abnormal readings: " + ", ".join(warnings)
        return True, title, message
    return False, "", ""


# Absolute validation limits to avoid absurd values
ABSOLUTE_LIMITS = {
    "heart_rate": (20, 300),
    "systolic_bp": (50, 300),
    "diastolic_bp": (30, 200),
    "temperature": (30.0, 45.0),
    "oxygen_saturation": (50.0, 100.0),
    "respiratory_rate": (5, 60),
}


@vitals_bp.route("", methods=["POST"])
@token_required
def submit_vitals():
    """Submit health vital constants for a user."""
    required_fields = ["user_uid", "heart_rate", "systolic_bp", "diastolic_bp"]
    data, error = validate_json_fields(required_fields)
    if error:
        return error

    user_id = decode_id(data["user_uid"])
    if user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != data["user_uid"]:
        return jsonify({"error": "Forbidden"}), 403

    try:
        heart_rate = int(data["heart_rate"])
        systolic_bp = int(data["systolic_bp"])
        diastolic_bp = int(data["diastolic_bp"])
    except (TypeError, ValueError):
        return jsonify({"error": "Vital fields must be numeric"}), 400

    temperature = data.get("temperature")
    oxygen_saturation = data.get("oxygen_saturation")
    respiratory_rate = data.get("respiratory_rate")
    notes = data.get("notes", "")

    if temperature is not None:
        try:
            temperature = float(temperature)
        except (TypeError, ValueError):
            return jsonify({"error": "temperature must be numeric"}), 400

    if oxygen_saturation is not None:
        try:
            oxygen_saturation = float(oxygen_saturation)
        except (TypeError, ValueError):
            return jsonify({"error": "oxygen_saturation must be numeric"}), 400

    if respiratory_rate is not None:
        try:
            respiratory_rate = int(respiratory_rate)
        except (TypeError, ValueError):
            return jsonify({"error": "respiratory_rate must be numeric"}), 400

    # Validate absolute ranges
    def _validate_limit(name, value):
        if value is None:
            return None
        lo, hi = ABSOLUTE_LIMITS.get(name, (None, None))
        if lo is None or hi is None:
            return None
        if not (lo <= value <= hi):
            return (
                jsonify({"error": f"{name} out of allowed range ({lo} - {hi})"}),
                400,
            )
        return None

    for field, val in (
        ("heart_rate", heart_rate),
        ("systolic_bp", systolic_bp),
        ("diastolic_bp", diastolic_bp),
        ("temperature", temperature),
        ("oxygen_saturation", oxygen_saturation),
        ("respiratory_rate", respiratory_rate),
    ):
        err = _validate_limit(field, val)
        if err:
            return err

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation, respiratory_rate, notes, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())",
        (
            user_id,
            heart_rate,
            systolic_bp,
            diastolic_bp,
            temperature,
            oxygen_saturation,
            respiratory_rate,
            notes,
        ),
    )
    conn.commit()
    vital_id = cursor.lastrowid

    should_alert, title, message = _gather_vital_alerts({
        "heart_rate": heart_rate,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "temperature": temperature,
        "oxygen_saturation": oxygen_saturation,
        "respiratory_rate": respiratory_rate,
    })
    if should_alert:
        insert_alert(conn, user_id, title, message, category="vitals")

    cursor.close()
    conn.close()
    return jsonify({"message": "Vitals recorded successfully!", "uid": encode_id(vital_id)}), 201


@vitals_bp.route("/<uid>", methods=["PUT"])
@token_required
def update_vital(uid: str):
    """Update an existing vital record (owner or admin)."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid vital UID"}), 400

    data, error = get_request_data()
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vitals WHERE id = %s", (internal_id,))
    vital = cursor.fetchone()
    if vital is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Vital record not found"}), 404

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(vital["user_id"]):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    allowed = ["heart_rate", "systolic_bp", "diastolic_bp", "temperature", "oxygen_saturation", "respiratory_rate", "notes"]
    update_fields = {}
    for field in allowed:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        cursor.close()
        conn.close()
        return jsonify({"error": "No valid fields to update"}), 400

    # parse and validate types
    try:
        if "heart_rate" in update_fields:
            update_fields["heart_rate"] = int(update_fields["heart_rate"])
        if "systolic_bp" in update_fields:
            update_fields["systolic_bp"] = int(update_fields["systolic_bp"])
        if "diastolic_bp" in update_fields:
            update_fields["diastolic_bp"] = int(update_fields["diastolic_bp"])
        if "respiratory_rate" in update_fields:
            update_fields["respiratory_rate"] = int(update_fields["respiratory_rate"])
        if "temperature" in update_fields:
            update_fields["temperature"] = float(update_fields["temperature"])
        if "oxygen_saturation" in update_fields:
            update_fields["oxygen_saturation"] = float(update_fields["oxygen_saturation"])
    except (TypeError, ValueError):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid types for vitals fields"}), 400

    for field, val in update_fields.items():
        err = None
        if field in ABSOLUTE_LIMITS:
            lo, hi = ABSOLUTE_LIMITS[field]
            if not (lo <= val <= hi):
                err = (jsonify({"error": f"{field} out of allowed range ({lo} - {hi})"}), 400)
        if err:
            cursor.close()
            conn.close()
            return err

    set_clauses = []
    params = []
    for field, val in update_fields.items():
        set_clauses.append(f"{field} = %s")
        params.append(val)
    params.append(internal_id)

    cursor.execute(f"UPDATE vitals SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s", tuple(params))
    conn.commit()

    # re-fetch and check for alerts
    cursor.execute("SELECT * FROM vitals WHERE id = %s", (internal_id,))
    updated = cursor.fetchone()
    should_alert, title, message = _gather_vital_alerts({
        "heart_rate": updated.get("heart_rate"),
        "systolic_bp": updated.get("systolic_bp"),
        "diastolic_bp": updated.get("diastolic_bp"),
        "temperature": updated.get("temperature"),
        "oxygen_saturation": updated.get("oxygen_saturation"),
        "respiratory_rate": updated.get("respiratory_rate"),
    })
    if should_alert:
        insert_alert(conn, updated.get("user_id"), title, message, category="vitals")

    cursor.close()
    conn.close()
    return jsonify({"message": "Vital updated successfully!"})


@vitals_bp.route("/evolution", methods=["GET"])
@token_required
def vitals_evolution():
    """Return data for charting evolution of a single measure.

    Query params: user_uid (optional for admin), measure, from (YYYY-MM-DD), to (YYYY-MM-DD)
    """
    measure = request.args.get("measure")
    if measure not in ("heart_rate", "systolic_bp", "diastolic_bp", "temperature", "oxygen_saturation", "respiratory_rate"):
        return jsonify({"error": "Invalid or missing measure parameter"}), 400

    user_uid = request.args.get("user_uid")
    current = g.current_user
    if user_uid:
        user_id = decode_id(user_uid)
        if user_id is None:
            return jsonify({"error": "Invalid user UID"}), 400
        if current.get("role") != "admin" and current.get("uid") != user_uid:
            return jsonify({"error": "Forbidden"}), 403
    elif current.get("role") != "admin":
        user_id = decode_id(current.get("uid"))
    else:
        return jsonify({"error": "user_uid required for admin"}), 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")
    params = [user_id]
    query = f"SELECT recorded_at, {measure} as value FROM vitals WHERE user_id = %s"
    if date_from:
        query += " AND recorded_at >= %s"
        params.append(date_from)
    if date_to:
        query += " AND recorded_at <= %s"
        params.append(date_to)
    query += " ORDER BY recorded_at ASC"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([{"recorded_at": r.get("recorded_at"), "value": r.get("value")} for r in rows])


@vitals_bp.route("/export", methods=["GET"])
@token_required
def export_vitals():
    """Export vitals history for a user in CSV or PDF. Query: user_uid, format=csv|pdf, from, to"""
    fmt = request.args.get("format", "csv").lower()
    user_uid = request.args.get("user_uid")
    current = g.current_user
    if user_uid:
        user_id = decode_id(user_uid)
        if user_id is None:
            return jsonify({"error": "Invalid user UID"}), 400
        if current.get("role") != "admin" and current.get("uid") != user_uid:
            return jsonify({"error": "Forbidden"}), 403
    elif current.get("role") != "admin":
        user_id = decode_id(current.get("uid"))
    else:
        return jsonify({"error": "user_uid required for admin"}), 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")
    params = [user_id]
    query = "SELECT * FROM vitals WHERE user_id = %s"
    if date_from:
        query += " AND recorded_at >= %s"
        params.append(date_from)
    if date_to:
        query += " AND recorded_at <= %s"
        params.append(date_to)
    query += " ORDER BY recorded_at DESC"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["recorded_at", "heart_rate", "systolic_bp", "diastolic_bp", "temperature", "oxygen_saturation", "respiratory_rate", "notes"])
        for r in rows:
            writer.writerow([
                r.get("recorded_at"), r.get("heart_rate"), r.get("systolic_bp"), r.get("diastolic_bp"), r.get("temperature"), r.get("oxygen_saturation"), r.get("respiratory_rate"), r.get("notes")
            ])
        csv_data = output.getvalue()
        output.close()
        cursor.close()
        conn.close()
        current_date = datetime.now(timezone.utc).date()
        headers = {
            "Content-Disposition": f"attachment; filename=vitals_{user_id}_{current_date}.csv",
            "Content-Type": "text/csv",
        }
        return Response(csv_data, headers=headers)
    elif fmt == "pdf":
        if not REPORTLAB_AVAILABLE:
            cursor.close()
            conn.close()
            return jsonify({"error": "PDF export not available (reportlab not installed)"}), 500
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 50
        current_date = datetime.now(timezone.utc).date()
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Vitals Export for user {user_id} - {current_date}")
        y -= 30
        p.setFont("Helvetica", 10)
        for r in rows:
            line = f"{r.get('recorded_at')} | HR:{r.get('heart_rate')} | BP:{r.get('systolic_bp')}/{r.get('diastolic_bp')} | Temp:{r.get('temperature')} | O2:{r.get('oxygen_saturation')} | RR:{r.get('respiratory_rate')}"
            p.drawString(50, y, line)
            y -= 14
            if y < 50:
                p.showPage()
                y = height - 50
        p.save()
        pdf = buffer.getvalue()
        buffer.close()
        cursor.close()
        conn.close()
        headers = {
            "Content-Disposition": f"attachment; filename=vitals_{user_id}_{current_date}.pdf",
            "Content-Type": "application/pdf",
        }
        return Response(pdf, headers=headers)
    else:
        cursor.close()
        conn.close()
        return jsonify({"error": "Unsupported export format"}), 400


@vitals_bp.route("", methods=["GET"])
@token_required
def list_vitals():
    """List health vital records for the requesting user or admin."""
    user_uid = request.args.get("user_uid")
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
        cursor.execute("SELECT * FROM vitals WHERE user_id = %s ORDER BY recorded_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM vitals ORDER BY recorded_at DESC")

    vitals = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_vital(item) for item in vitals])


@vitals_bp.route("/<uid>", methods=["GET"])
@token_required
def get_vital(uid: str):
    """Get a specific vital record by UID."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid vital UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vitals WHERE id = %s", (internal_id,))
    vital = cursor.fetchone()
    cursor.close()
    conn.close()

    if vital is None:
        return jsonify({"error": "Vital record not found"}), 404

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(vital["user_id"]):
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(publicize_vital(vital))


@vitals_bp.route("/latest/<vital_type>", methods=["GET"])
@token_required
def get_latest_vital(vital_type: str):
    """Get the most recent vital record of a specific type for the current user."""
    allowed_types = ["heart_rate", "systolic_bp", "diastolic_bp", "temperature", "oxygen_saturation", "respiratory_rate"]
    if vital_type not in allowed_types:
        return jsonify({"error": f"Invalid vital type. Allowed: {', '.join(allowed_types)}"}), 400

    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        f"SELECT * FROM vitals WHERE user_id = %s AND {vital_type} IS NOT NULL ORDER BY created_at DESC LIMIT 1",
        (internal_id,)
    )
    vital = cursor.fetchone()
    cursor.close()
    conn.close()

    if vital is None:
        return jsonify({"error": "No vital records found for this type"}), 404

    return jsonify(publicize_vital(vital))
