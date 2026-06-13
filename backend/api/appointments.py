from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_appointment
from auth import token_required, roles_required
from email_utils import send_email
from datetime import datetime, timedelta

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("", methods=["GET"])
@token_required
def get_appointments():
    """List appointments.

    GET /api/appointments?user_uid=<user_uid>&doctor_uid=<doctor_uid>
    Response: [ { uid, user_uid, doctor_uid, appointment_date, appointment_time, reason, status }, ... ]
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    user_uid = request.args.get("user_uid")
    doctor_uid = request.args.get("doctor_uid")
    user_id = decode_id(user_uid) if user_uid else None
    doctor_id = decode_id(doctor_uid) if doctor_uid else None

    if user_uid and user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400
    if doctor_uid and doctor_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    if user_id and g.current_user.get("role") != "admin" and g.current_user.get("uid") != user_uid:
        return jsonify({"error": "Forbidden"}), 403

    if user_id and doctor_id:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = %s AND doctor_id = %s",
            (user_id, doctor_id)
        )
    elif user_id:
        cursor.execute("SELECT * FROM appointments WHERE user_id = %s", (user_id,))
    elif doctor_id:
        cursor.execute("SELECT * FROM appointments WHERE doctor_id = %s", (doctor_id,))
    else:
        cursor.execute("SELECT * FROM appointments")

    appointments = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_appointment(item) for item in appointments])


@appointments_bp.route("/<uid>", methods=["GET"])
@token_required
def get_appointment(uid: str):
    """Get appointment details by UID.

    GET /api/appointments/<uid>
    Response: { uid, user_uid, doctor_uid, appointment_date, appointment_time, reason, status }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    appointment = cursor.fetchone()
    cursor.close()
    conn.close()

    if appointment:
        if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(appointment["user_id"]):
            return jsonify({"error": "Forbidden"}), 403
        return jsonify(publicize_appointment(appointment))
    return jsonify({"error": "Appointment not found"}), 404


def _send_appointment_email(subject: str, body: str, to_email: str):
    if to_email:
        send_email(to_email, subject, body)


def _get_user_doctor_emails(conn, user_id: int, doctor_id: int):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT email, name FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.execute("SELECT email, name FROM doctors WHERE id = %s", (doctor_id,))
    doctor = cursor.fetchone()
    cursor.close()
    return user, doctor


def _send_confirmation_emails(conn, user_id: int, doctor_id: int, appointment_date: str, appointment_time: str):
    user, doctor = _get_user_doctor_emails(conn, user_id, doctor_id)
    if not user or not doctor:
        return
    body = (
        f"Your appointment with Dr. {doctor.get('name')} is scheduled for {appointment_date} at {appointment_time}.\n"
        f"Thank you for choosing SmartHealth."
    )
    _send_appointment_email(
        "Appointment Confirmation",
        body,
        user.get("email")
    )
    _send_appointment_email(
        "New Appointment Scheduled",
        f"A new appointment has been booked with {user.get('name')} on {appointment_date} at {appointment_time}.",
        doctor.get("email")
    )


def _send_reminder_email(conn, appointment):
    user, doctor = _get_user_doctor_emails(conn, appointment["user_id"], appointment["doctor_id"])
    if not user or not doctor:
        return
    body = (
        f"Reminder: You have an appointment with Dr. {doctor.get('name')} on {appointment.get('appointment_date')} at {appointment.get('appointment_time')}.\n"
        "Please arrive 10 minutes early."
    )
    _send_appointment_email("Appointment Reminder", body, user.get("email"))


@appointments_bp.route("", methods=["POST"])
@token_required
def add_appointment():
    """Create a new appointment.

    POST /api/appointments
    Body JSON: { user_uid, doctor_uid, appointment_date, appointment_time, reason?, reminder_days? }
    Response: { message, uid }
    """
    data, error = validate_json_fields(["user_uid", "doctor_uid", "appointment_date", "appointment_time"])
    if error:
        return error

    user_id = decode_id(data["user_uid"])
    doctor_id = decode_id(data["doctor_uid"])
    if user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400
    if doctor_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != data["user_uid"]:
        return jsonify({"error": "Forbidden"}), 403

    try:
        reminder_days = int(data.get("reminder_days", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "reminder_days must be an integer"}), 400
    if reminder_days < 0 or reminder_days > 30:
        return jsonify({"error": "reminder_days must be between 0 and 30"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, reason, status, reminder_days, reminder_sent) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (
            user_id,
            doctor_id,
            data["appointment_date"],
            data["appointment_time"],
            data.get("reason", ""),
            "scheduled",
            reminder_days,
            0,
        )
    )
    conn.commit()
    appointment_id = cursor.lastrowid
    _send_confirmation_emails(conn, user_id, doctor_id, data["appointment_date"], data["appointment_time"])
    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment created successfully!", "uid": encode_id(appointment_id)}), 201


@appointments_bp.route("/<uid>", methods=["PUT"])
@token_required
def update_appointment(uid: str):
    """Update an existing appointment.

    PUT /api/appointments/<uid>
    Body JSON: { appointment_date?, appointment_time?, reason?, status?, reminder_days? }
    Response: { message }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    data, error = get_request_data()
    if error:
        return error

    if not data:
        return jsonify({"error": "No valid fields to update"}), 400

    fields = {}
    if "appointment_date" in data:
        fields["appointment_date"] = data["appointment_date"]
    if "appointment_time" in data:
        fields["appointment_time"] = data["appointment_time"]
    if "reason" in data:
        fields["reason"] = data["reason"]
    if "status" in data:
        fields["status"] = data["status"]
    if "reminder_days" in data:
        try:
            reminder_days = int(data["reminder_days"])
            if reminder_days < 0 or reminder_days > 30:
                raise ValueError
            fields["reminder_days"] = reminder_days
        except (TypeError, ValueError):
            return jsonify({"error": "reminder_days must be between 0 and 30"}), 400

    if not fields:
        return jsonify({"error": "No valid fields to update"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    existing = cursor.fetchone()
    if existing is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(existing["user_id"]):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    set_clauses = []
    params = []
    for field, value in fields.items():
        set_clauses.append(f"{field} = %s")
        params.append(value)
    params.append(internal_id)

    cursor.execute(
        f"UPDATE appointments SET {', '.join(set_clauses)} WHERE id = %s",
        tuple(params)
    )
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found or no changes applied"}), 404

    conn.commit()
    _send_confirmation_emails(
        conn,
        existing["user_id"],
        existing["doctor_id"],
        fields.get("appointment_date", existing["appointment_date"]),
        fields.get("appointment_time", existing["appointment_time"])
    )
    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment updated successfully!"})


@appointments_bp.route("/<uid>", methods=["DELETE"])
@token_required
def delete_appointment(uid: str):
    """Cancel an appointment by UID.

    DELETE /api/appointments/<uid>
    Response: { message }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    appointment = cursor.fetchone()
    if appointment is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404
    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(appointment["user_id"]):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute("DELETE FROM appointments WHERE id = %s", (internal_id,))
    conn.commit()
    _send_appointment_email(
        "Appointment Cancelled",
        f"Your appointment scheduled on {appointment.get('appointment_date')} at {appointment.get('appointment_time')} has been cancelled.",
        _get_user_doctor_emails(conn, appointment["user_id"], appointment["doctor_id"])[0].get("email") if _get_user_doctor_emails(conn, appointment["user_id"], appointment["doctor_id"])[0] else None
    )
    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment deleted successfully!"})


@appointments_bp.route("/send-reminders", methods=["POST"])
@token_required
@roles_required("admin")
def send_appointment_reminders():
    """Send appointment reminders for appointments due within reminder_days."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM appointments WHERE reminder_sent = 0 AND status = 'scheduled'"
    )
    appointments = cursor.fetchall()
    sent = 0
    today = datetime.now().date()
    for appointment in appointments:
        try:
            appointment_date = appointment.get("appointment_date")
            reminder_days = appointment.get("reminder_days", 1)
            if appointment_date and (appointment_date - today).days <= reminder_days:
                _send_reminder_email(conn, appointment)
                cursor.execute("UPDATE appointments SET reminder_sent = 1 WHERE id = %s", (appointment.get("id"),))
                sent += 1
        except Exception:
            continue
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"Reminders sent: {sent}"})


@appointments_bp.route("/<uid>/cancel", methods=["POST"])
@token_required
def cancel_appointment(uid: str):
    """Cancel a specific appointment with an optional reason."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    appointment = cursor.fetchone()
    if not appointment:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    requester = g.current_user
    user_internal_id = decode_id(requester.get("uid"))
    if requester.get("role") != "admin" and appointment.get("user_id") != user_internal_id:
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute(
        "UPDATE appointments SET status = 'cancelled', notes = CONCAT(IFNULL(notes, ''), %s) WHERE id = %s",
        (f"\nCancellation reason: {reason}" if reason else "", internal_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment cancelled successfully"})


@appointments_bp.route("/available-slots", methods=["GET"])
@token_required
def get_available_slots():
    """Get available appointment slots for a doctor on a specific date."""
    doctor_uid = request.args.get("doctorId")
    date_str = request.args.get("date")
    if not doctor_uid or not date_str:
        return jsonify({"error": "Missing required parameters: doctorId, date"}), 400

    doctor_id = decode_id(doctor_uid)
    if doctor_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get existing appointments for this doctor on this date
    cursor.execute(
        "SELECT appointment_time FROM appointments WHERE doctor_id = %s AND appointment_date = %s AND status != 'cancelled'",
        (doctor_id, target_date)
    )
    booked_times = [row["appointment_time"] for row in cursor.fetchall()]

    # Generate available slots (9:00-17:00, 30 min intervals)
    all_slots = []
    for hour in range(9, 17):
        for minute in [0, 30]:
            slot_time = f"{hour:02d}:{minute:02d}"
            all_slots.append(slot_time)

    available_slots = [slot for slot in all_slots if slot not in [str(t)[:5] if hasattr(t, 'seconds') else str(t)[:5] for t in booked_times]]

    cursor.close()
    conn.close()
    return jsonify({"date": date_str, "doctor_uid": doctor_uid, "available_slots": available_slots})


@appointments_bp.route("/<uid>/confirm", methods=["POST"])
@token_required
def confirm_appointment(uid: str):
    """Confirm a scheduled appointment."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    appointment = cursor.fetchone()
    if not appointment:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    requester = g.current_user
    user_internal_id = decode_id(requester.get("uid"))
    if requester.get("role") != "admin" and appointment.get("user_id") != user_internal_id:
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute("UPDATE appointments SET status = 'confirmed' WHERE id = %s", (internal_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment confirmed successfully"})


@appointments_bp.route("/<uid>/reminder", methods=["POST"])
@token_required
def send_single_reminder(uid: str):
    """Send a reminder for a specific appointment."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid appointment UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM appointments WHERE id = %s", (internal_id,))
    appointment = cursor.fetchone()
    if not appointment:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    requester = g.current_user
    user_internal_id = decode_id(requester.get("uid"))
    if requester.get("role") != "admin" and appointment.get("user_id") != user_internal_id:
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    try:
        _send_reminder_email(conn, appointment)
        cursor.execute("UPDATE appointments SET reminder_sent = 1 WHERE id = %s", (internal_id,))
        conn.commit()
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({"error": "Failed to send reminder"}), 500

    cursor.close()
    conn.close()
    return jsonify({"message": "Reminder sent successfully"})
