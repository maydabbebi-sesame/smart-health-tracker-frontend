from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_doctor
from auth import token_required, roles_required
from email_utils import send_email

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")


@doctors_bp.route("", methods=["GET"])
def get_doctors():
    """List doctors with optional specialization and location filtering.

    GET /api/doctors?specialization=<specialization>&location=<location>
    Response: [ { uid, name, specialization, location, email, phone, bio }, ... ]
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    specialization = request.args.get("specialization")
    location = request.args.get("location")

    query = "SELECT * FROM doctors"
    filters = []
    params = []
    if specialization:
        filters.append("specialization = %s")
        params.append(specialization)
    if location:
        filters.append("location LIKE %s")
        params.append(f"%{location}%")
    if filters:
        query += " WHERE " + " AND ".join(filters)

    cursor.execute(query, tuple(params))
    doctors = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_doctor(doc) for doc in doctors])


@doctors_bp.route("/<uid>", methods=["GET"])
def get_doctor(uid: str):
    """Get doctor details by UID.

    GET /api/doctors/<uid>
    Response: { uid, name, specialization, location, email, phone, bio, availability }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM doctors WHERE id = %s", (internal_id,))
    doctor = cursor.fetchone()
    cursor.close()
    conn.close()

    if doctor:
        return jsonify(publicize_doctor(doctor))
    return jsonify({"error": "Doctor not found"}), 404


@doctors_bp.route("/<uid>/availability", methods=["GET"])
def get_doctor_availability(uid: str):
    """Get a doctor's availability schedule.

    GET /api/doctors/<uid>/availability
    Response: { uid, availability }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT availability, location, name, specialization FROM doctors WHERE id = %s", (internal_id,))
    doctor = cursor.fetchone()
    cursor.close()
    conn.close()

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    availability = doctor.get("availability")
    if isinstance(availability, str):
        try:
            import json
            availability = json.loads(availability)
        except Exception:
            pass

    return jsonify({
        "uid": uid,
        "name": doctor.get("name"),
        "specialization": doctor.get("specialization"),
        "location": doctor.get("location"),
        "availability": availability or []
    })


@doctors_bp.route("/<uid>/confirm", methods=["POST"])
@token_required
def confirm_doctor(uid: str):
    """Send a confirmation message for a doctor to the user.

    POST /api/doctors/<uid>/confirm
    Body JSON: { user_uid, appointment_date?, appointment_time? }
    """
    data, error = get_request_data()
    if error:
        return error

    user_uid = data.get("user_uid")
    if not user_uid:
        return jsonify({"error": "Missing required field: user_uid"}), 400

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != user_uid:
        return jsonify({"error": "Forbidden"}), 403

    user_id = decode_id(user_uid)
    doctor_id = decode_id(uid)
    if user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400
    if doctor_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT email, name FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.execute("SELECT * FROM doctors WHERE id = %s", (doctor_id,))
    doctor = cursor.fetchone()
    cursor.close()
    conn.close()

    if user is None or doctor is None:
        return jsonify({"error": "User or doctor not found"}), 404

    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")
    body = [
        f"Hello {user.get('name')},",
        f"Here is the confirmation for Dr. {doctor.get('name')} ({doctor.get('specialization')}) at {doctor.get('location')}.",
    ]
    if appointment_date and appointment_time:
        body.append(f"Requested appointment: {appointment_date} at {appointment_time}.")
    if doctor.get("availability"):
        body.append("Doctor availability: " + str(doctor.get("availability")))
    body.append("Thank you for using SmartHealth.")
    body_text = "\n".join(body)
    send_email(user.get("email"), f"Doctor Confirmation: {doctor.get('name')}", body_text)

    return jsonify({"message": "Confirmation sent to user email."})


@doctors_bp.route("", methods=["POST"])
@token_required
@roles_required("admin")
def add_doctor():
    """Create a new doctor record.

    POST /api/doctors
    Body JSON: { name, specialization, email, phone, location?, bio?, availability? }
    Response: { message, uid }
    """
    data, error = validate_json_fields(["name", "specialization", "email", "phone"])
    if error:
        return error

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO doctors (name, specialization, location, email, phone, bio, availability) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (
            data["name"],
            data["specialization"],
            data.get("location", ""),
            data["email"],
            data["phone"],
            data.get("bio", ""),
            data.get("availability")
        )
    )
    conn.commit()
    doctor_id = cursor.lastrowid
    uid = encode_id(doctor_id)
    cursor.close()
    conn.close()
    return jsonify({"message": "Doctor added successfully!", "uid": uid}), 201
