import re

from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from validators import validate_json_fields, get_request_data
from security import decode_id, encode_id, publicize_external_doctor, publicize_health_center
from auth import token_required, roles_required
from email_utils import send_email
from osm_places import (
    geocode_address,
    search_nearby_facilities,
    upsert_osm_doctors,
    upsert_osm_health_centers,
    haversine_km,
)

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")

# The Doctor Agent's AI decision naturally says "Médecin généraliste" (full,
# conversational French), but med.tn/platform doctors are stored under just
# the bare specialty ("Généraliste") — a LIKE '%Médecin généraliste%' can
# never match a shorter stored value that doesn't contain "Médecin" at all.
# Strip the generic role prefix before using the specialty as a LIKE filter.
_GENERIC_SPECIALTY_PREFIX_RE = re.compile(r"^(médecin|docteur|dr\.?)\s+", re.IGNORECASE)


def _specialty_filter_text(specialization):
    if not specialization:
        return specialization
    return _GENERIC_SPECIALTY_PREFIX_RE.sub("", specialization).strip()


def _with_distance(records, coords):
    """Attach a distanceKm to each (already-publicized) record when the
    search was anchored to a geocoded address, so stored rows (platform/
    med.tn/osm alike) sort the same way live OSM results used to."""
    if not coords:
        return records
    lat, lng, _city = coords
    for record in records:
        if record.get("lat") is not None and record.get("lng") is not None:
            record["distanceKm"] = round(haversine_km(lat, lng, record["lat"], record["lng"]), 1)
        else:
            record["distanceKm"] = None
    records.sort(key=lambda r: (r["distanceKm"] is None, r["distanceKm"]))
    return records


@doctors_bp.route("", methods=["GET"])
def get_doctors():
    """List doctors with optional specialization and location filtering.

    GET /api/doctors?specialization=<specialization>&location=<location>
    Response: [ { uid, source, name, specialization, location, email, phone, bio, availability }, ... ]
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    specialization = request.args.get("specialization")
    location = request.args.get("location")

    query = "SELECT * FROM external_doctors"
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
    return jsonify([publicize_external_doctor(doc) for doc in doctors])


@doctors_bp.route("/external", methods=["GET"])
@token_required
def get_external_doctors():
    """List external_doctors for appointment booking (scraped med.tn entries,
    OSM-sourced practitioners, and platform-added doctors alike).

    GET /api/doctors/external?query=<texte>&specialization=<texte>&location=<texte>
    Response: [ { uid, source, name, specialization, location, sourceUrl, phone, lat, lng }, ... ]
    """
    query_term = request.args.get("query", "").strip()
    specialization = request.args.get("specialization", "").strip()
    location = request.args.get("location", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT * FROM external_doctors"
    filters, params = [], []
    if query_term:
        filters.append("(name LIKE %s OR specialization LIKE %s OR location LIKE %s)")
        params.extend([f"%{query_term}%"] * 3)
    if specialization:
        filters.append("specialization LIKE %s")
        params.append(f"%{specialization}%")
    if location:
        filters.append("location LIKE %s")
        params.append(f"%{location}%")
    if filters:
        sql += " WHERE " + " AND ".join(filters)
    sql += " ORDER BY name LIMIT 100"

    cursor.execute(sql, tuple(params))
    doctors = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_external_doctor(doc) for doc in doctors])


@doctors_bp.route("/nearby", methods=["GET"])
def get_doctors_nearby():
    """Doctor Agent search: doctors and health centers around a patient
    address, combining the stored external_doctors/health_centers directory
    with a live Overpass (OpenStreetMap) lookup. OSM results are upserted
    into those tables (keyed by their OSM id) before the directory is
    queried, so a fresh search in a given area both answers the patient and
    grows the stored directory for next time.

    GET /api/doctors/nearby?address=<texte>&specialization=<texte>
    Response: { doctors: [...], centers: [...], warning?: str }
    """
    address = request.args.get("address", "").strip()
    specialization = request.args.get("specialization", "").strip()
    specialty_filter_text = _specialty_filter_text(specialization)

    # Resolve the patient's free-text input to a canonical city name first —
    # stored addresses ("Mornag Ben arous Tunisie") rarely contain whatever
    # extra words the patient typed ("Ben Arous Centre"), so matching against
    # the raw input made the LIKE filters below fail for anything but an
    # exact city name. Falls back to the raw text if geocoding fails.
    coords = geocode_address(address) if address else None
    location_filter_text = coords[2] if coords else address

    if coords:
        lat, lng, _city = coords
        osm_doctors, osm_centers = search_nearby_facilities(lat, lng, keyword=specialty_filter_text or None)
        upsert_osm_doctors(osm_doctors)
        upsert_osm_health_centers(osm_centers)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    doctor_query = "SELECT * FROM external_doctors"
    doctor_filters, doctor_params = [], []
    if specialty_filter_text:
        doctor_filters.append("specialization LIKE %s")
        doctor_params.append(f"%{specialty_filter_text}%")
    if location_filter_text:
        doctor_filters.append("location LIKE %s")
        doctor_params.append(f"%{location_filter_text}%")
    if doctor_filters:
        doctor_query += " WHERE " + " AND ".join(doctor_filters)
    cursor.execute(doctor_query, tuple(doctor_params))
    doctors = _with_distance([publicize_external_doctor(doc) for doc in cursor.fetchall()], coords)

    # health_centers is OSM-only: its `location` text comes from addr:* tags
    # that are frequently empty or in Arabic (OSM's local-language tagging in
    # Tunisia), so a location-text LIKE filter would silently exclude most
    # rows. Every row does carry lat/lng though, so distance is the filter
    # that actually works once an address has been geocoded.
    cursor.execute("SELECT * FROM health_centers")
    all_centers = [publicize_health_center(c) for c in cursor.fetchall()]
    if coords:
        lat, lng, _city = coords
        centers = [
            c for c in all_centers
            if c.get("lat") is not None and c.get("lng") is not None
            and haversine_km(lat, lng, c["lat"], c["lng"]) <= 20
        ]
    else:
        centers = all_centers
    centers = _with_distance(centers, coords)

    cursor.close()
    conn.close()

    response = {"doctors": doctors, "centers": centers}
    if address and not coords:
        response["warning"] = "Adresse non reconnue, résultats sans tri par distance."
    return jsonify(response)


@doctors_bp.route("/<uid>", methods=["GET"])
def get_doctor(uid: str):
    """Get doctor details by UID.

    GET /api/doctors/<uid>
    Response: { uid, source, name, specialization, location, email, phone, bio, availability }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM external_doctors WHERE id = %s", (internal_id,))
    doctor = cursor.fetchone()
    cursor.close()
    conn.close()

    if doctor:
        return jsonify(publicize_external_doctor(doctor))
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
    cursor.execute("SELECT availability, location, name, specialization FROM external_doctors WHERE id = %s", (internal_id,))
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
    cursor.execute("SELECT * FROM external_doctors WHERE id = %s", (doctor_id,))
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
    """Create a new platform doctor record in external_doctors.

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
        "INSERT INTO external_doctors (source, name, specialization, location, email, phone, bio, availability, scraped_at) "
        "VALUES ('platform', %s, %s, %s, %s, %s, %s, %s, NOW())",
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


@doctors_bp.route("/search", methods=["GET"])
def search_doctors():
    """Search for doctors by name, specialization, or location.

    GET /api/doctors/search?query=<search_term>
    """
    query_term = request.args.get("query", "")
    if not query_term:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    search_pattern = f"%{query_term}%"
    cursor.execute(
        "SELECT * FROM external_doctors WHERE name LIKE %s OR specialization LIKE %s OR location LIKE %s",
        (search_pattern, search_pattern, search_pattern)
    )
    doctors = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_external_doctor(doc) for doc in doctors])


@doctors_bp.route("/<uid>/appointments", methods=["GET"])
@token_required
def get_doctor_appointments(uid: str):
    """Get all appointments for a specific doctor."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM external_doctors WHERE id = %s", (internal_id,))
    doctor = cursor.fetchone()
    if not doctor:
        cursor.close()
        conn.close()
        return jsonify({"error": "Doctor not found"}), 404

    cursor.execute("SELECT * FROM appointments WHERE doctor_id = %s ORDER BY appointment_date DESC", (internal_id,))
    appointments = cursor.fetchall()
    cursor.close()
    conn.close()

    from security import publicize_appointment
    return jsonify([publicize_appointment(appt) for appt in appointments])


@doctors_bp.route("/<uid>/rate", methods=["POST"])
@token_required
def rate_doctor(uid: str):
    """Rate a doctor and optionally leave a review.

    POST /api/doctors/<uid>/rate
    Body JSON: { rating: 1-5, review?: string }
    """
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid doctor UID"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    rating = data.get("rating")
    if rating is None or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    review = data.get("review", "")

    requester = g.current_user
    user_internal_id = decode_id(requester.get("uid"))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM external_doctors WHERE id = %s", (internal_id,))
    doctor = cursor.fetchone()
    if not doctor:
        cursor.close()
        conn.close()
        return jsonify({"error": "Doctor not found"}), 404

    cursor.execute(
        "INSERT INTO doctor_ratings (doctor_id, user_id, rating, review, created_at) VALUES (%s, %s, %s, %s, NOW())",
        (internal_id, user_internal_id, rating, review)
    )
    cursor.execute(
        "UPDATE external_doctors SET rating = (SELECT AVG(rating) FROM doctor_ratings WHERE doctor_id = %s), "
        "rating_count = (SELECT COUNT(*) FROM doctor_ratings WHERE doctor_id = %s) WHERE id = %s",
        (internal_id, internal_id, internal_id)
    )

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Rating submitted successfully"})
