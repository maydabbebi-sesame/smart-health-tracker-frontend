from flask import Flask, jsonify
from flask_cors import CORS

from appointments import appointments_bp
from config import PORT
from doctors import doctors_bp
from sh_common.db import get_db_connection

app = Flask(__name__)
CORS(app)

app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)


@app.route("/internal/stats")
def internal_stats():
    """Counts consumed by users-service's /api/admin/statistics fan-out.
    Not behind token_required: only reachable service-to-service, never
    routed through the gateway to the public internet.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM external_doctors")
    total_doctors = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM appointments")
    total_appointments = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'")
    scheduled_appointments = cursor.fetchone()["count"]
    cursor.close()
    conn.close()
    return jsonify({
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "scheduled_appointments": scheduled_appointments,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
