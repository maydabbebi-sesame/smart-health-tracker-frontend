import os
import sys
import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch

import werkzeug
if not hasattr(werkzeug, "__version__"):
    werkzeug.__version__ = "3.0.0"

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import api.app_backend as app_backend
import users
import doctors
import appointments
import alerts
import forms
import auth
from security import encode_id


class ApiValidationTests(unittest.TestCase):
    def setUp(self):
        self.client = app_backend.app.test_client()
        self.client.testing = True
        # Provide a default Authorization header for endpoints that require auth
        self.client.environ_base['HTTP_AUTHORIZATION'] = 'Bearer dummy-token'
        # Patch auth.decode_auth_token to return an admin payload by default
        patcher = patch('auth.decode_auth_token', return_value={"uid": encode_id(1), "role": "admin"})
        self.addCleanup(patcher.stop)
        patcher.start()

    def make_db_mock(self):
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        return mock_conn, mock_cursor

    def test_add_user_missing_name_returns_400(self):
        response = self.client.post("/api/users", json={"email": "jane@example.com"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required fields", response.get_json()["error"])

    def test_add_user_missing_email_returns_400(self):
        response = self.client.post("/api/users", json={"name": "Jane Doe"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required fields", response.get_json()["error"])

    def test_add_user_invalid_json_returns_400(self):
        response = self.client.post(
            "/api/users",
            data="not-json",
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Invalid JSON payload")

    @patch("users.get_db_connection")
    def test_add_user_calls_db_and_returns_200(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn

        response = self.client.post(
            "/api/users",
            json={"name": "Jane Doe", "email": "jane@example.com"}
        )

        self.assertEqual(response.status_code, 200)
        mock_cursor.execute.assert_called_once_with(
            "INSERT INTO users (name, email) VALUES (%s, %s)",
            ("Jane Doe", "jane@example.com")
        )

    def test_add_doctor_missing_required_returns_400(self):
        response = self.client.post(
            "/api/doctors",
            json={"name": "Dr. Ahmed", "email": "ahmed@example.com", "phone": "+123456789"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required fields", response.get_json()["error"])

    @patch("doctors.get_db_connection")
    def test_add_doctor_calls_db_and_returns_201(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.lastrowid = 7

        response = self.client.post(
            "/api/doctors",
            json={
                "name": "Dr. Ahmed",
                "specialization": "Cardiology",
                "email": "ahmed@example.com",
                "phone": "+123456789",
                "bio": "Experienced cardiologist."
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("uid", response.get_json())
        mock_cursor.execute.assert_called_once()

    @patch("doctors.get_db_connection")
    def test_get_doctors_filters_by_specialization_and_location(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {"id": 1, "name": "Dr. Ahmed", "specialization": "Cardiology", "location": "Downtown", "email": "ahmed@example.com", "phone": "+123456789", "bio": "Experienced cardiologist."}
        ]

        response = self.client.get("/api/doctors?specialization=Cardiology&location=Downtown")

        self.assertEqual(response.status_code, 200)
        results = response.get_json()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["specialization"], "Cardiology")
        self.assertEqual(results[0]["location"], "Downtown")

    @patch("doctors.get_db_connection")
    def test_get_doctor_availability_returns_parsed_schedule(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchone.return_value = {
            "availability": "[{\"day\": \"Monday\", \"slots\": [\"09:00\"]}]",
            "location": "Downtown",
            "name": "Dr. Ahmed",
            "specialization": "Cardiology"
        }

        response = self.client.get(f"/api/doctors/{encode_id(1)}/availability")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["uid"], encode_id(1))
        self.assertEqual(payload["location"], "Downtown")
        self.assertEqual(payload["availability"], [{"day": "Monday", "slots": ["09:00"]}])

    @patch("doctors.send_email")
    @patch("doctors.get_db_connection")
    def test_confirm_doctor_sends_email_to_user_and_doctor(self, mock_db_connection, mock_send_email):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchone.side_effect = [
            {"email": "patient@example.com", "name": "Jane Doe"},
            {"name": "Dr. Ahmed", "specialization": "Cardiology", "location": "Downtown", "email": "ahmed@example.com", "availability": "[]"}
        ]

        response = self.client.post(
            f"/api/doctors/{encode_id(1)}/confirm",
            json={"user_uid": encode_id(1), "appointment_date": "2026-07-01", "appointment_time": "10:00:00"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["message"], "Confirmation sent to user email.")
        self.assertEqual(mock_send_email.call_count, 1)
        mock_send_email.assert_called_with(
            "patient@example.com",
            "Doctor Confirmation: Dr. Ahmed",
            "Hello Jane Doe,\nHere is the confirmation for Dr. Dr. Ahmed (Cardiology) at Downtown.\nRequested appointment: 2026-07-01 at 10:00:00.\nDoctor availability: []\nThank you for using SmartHealth."
        )

    @patch("appointments._send_confirmation_emails")
    @patch("appointments.get_db_connection")
    def test_add_appointment_with_reminder_days_returns_201(self, mock_db_connection, mock_confirm):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.lastrowid = 13

        response = self.client.post(
            "/api/appointments",
            json={
                "user_uid": encode_id(1),
                "doctor_uid": encode_id(2),
                "appointment_date": "2026-06-16",
                "appointment_time": "10:00:00",
                "reason": "Regular checkup",
                "reminder_days": 3
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["uid"], encode_id(13))
        self.assertTrue(any("reminder_days" in str(call.args[0]) for call in mock_cursor.execute.call_args_list))

    @patch("appointments._send_reminder_email")
    @patch("appointments.get_db_connection")
    def test_send_appointment_reminders_invokes_reminder_email(self, mock_db_connection, mock_send_reminder):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {"id": 1, "user_id": 1, "doctor_id": 2, "appointment_date": datetime.now().date(), "appointment_time": "10:00:00", "reminder_days": 1, "status": "scheduled"}
        ]

        response = self.client.post("/api/appointments/send-reminders")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(mock_send_reminder.called)
        self.assertIn("Reminders sent", response.get_json()["message"])

    def test_add_appointment_missing_required_returns_400(self):
        response = self.client.post(
            "/api/appointments",
            json={"doctor_uid": encode_id(1), "appointment_date": "2026-06-15", "appointment_time": "14:30:00"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required fields", response.get_json()["error"])

    @patch("forms.get_db_connection")
    @patch("forms.insert_alert")
    def test_submit_form_triggers_alert_for_urgent_symptom(self, mock_insert_alert, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.lastrowid = 10

        response = self.client.post(
            "/api/forms",
            json={
                "user_uid": encode_id(1),
                "questionnaire_name": "symptom_check",
                "answers": {"chest_pain": "Yes, severe"}
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("uid", response.get_json())
        mock_insert_alert.assert_called_once()

    def test_collect_form_alerts_detects_chest_pain_string(self):
        should_alert, title, message = forms._collect_form_alerts(
            "symptom_check", {"chest_pain": "Yes, severe"}
        )

        self.assertTrue(should_alert)
        self.assertIn("Urgent issue", title)
        self.assertIn("chest_pain", message)

    def test_collect_form_alerts_does_not_trigger_for_nonurgent_answers(self):
        should_alert, title, message = forms._collect_form_alerts(
            "symptom_check", {"cough": "mild"}
        )

        self.assertFalse(should_alert)
        self.assertEqual(title, "")
        self.assertEqual(message, "")

    @patch("vitals.get_db_connection")
    @patch("vitals.insert_alert")
    def test_submit_vitals_triggers_alert_for_abnormal_values(self, mock_insert_alert, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.lastrowid = 11

        response = self.client.post(
            "/api/vitals",
            json={
                "user_uid": encode_id(1),
                "heart_rate": 110,
                "systolic_bp": 150,
                "diastolic_bp": 95,
                "temperature": 38.5,
                "oxygen_saturation": 93,
                "respiratory_rate": 24
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("uid", response.get_json())
        mock_insert_alert.assert_called_once()

    @patch("vitals.get_db_connection")
    def test_submit_vitals_rejects_out_of_range_values(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn

        response = self.client.post(
            "/api/vitals",
            json={
                "user_uid": encode_id(1),
                "heart_rate": 10,
                "systolic_bp": 150,
                "diastolic_bp": 95
            }
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("heart_rate out of allowed range", response.get_json()["error"])
        mock_cursor.execute.assert_not_called()

    @patch("vitals.get_db_connection")
    @patch("vitals.insert_alert")
    def test_update_vitals_triggers_alert_when_abnormal(self, mock_insert_alert, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        existing_vital = {
            "id": 11,
            "user_id": 1,
            "heart_rate": 90,
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "temperature": 37.0,
            "oxygen_saturation": 98,
            "respiratory_rate": 16,
            "notes": None
        }
        updated_vital = existing_vital.copy()
        updated_vital.update({
            "heart_rate": 45,
            "systolic_bp": 150,
            "diastolic_bp": 95,
        })
        mock_cursor.fetchone.side_effect = [existing_vital, updated_vital]

        response = self.client.put(
            f"/api/vitals/{encode_id(11)}",
            json={
                "heart_rate": 45,
                "systolic_bp": 150,
                "diastolic_bp": 95
            }
        )

        self.assertEqual(response.status_code, 200)
        mock_insert_alert.assert_called_once()
        self.assertTrue(any("UPDATE vitals SET" in str(call.args[0]) for call in mock_cursor.execute.call_args_list))

    @patch("vitals.get_db_connection")
    def test_vitals_evolution_returns_measure_history(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {"recorded_at": "2026-05-01 12:00:00", "value": 70},
            {"recorded_at": "2026-05-02 12:00:00", "value": 72},
        ]

        response = self.client.get(
            f"/api/vitals/evolution?user_uid={encode_id(1)}&measure=heart_rate&from=2026-05-01&to=2026-05-02"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [
            {"recorded_at": "2026-05-01 12:00:00", "value": 70},
            {"recorded_at": "2026-05-02 12:00:00", "value": 72},
        ])

    @patch("vitals.get_db_connection")
    def test_vitals_export_csv_returns_csv(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {
                "recorded_at": "2026-05-01 12:00:00",
                "heart_rate": 70,
                "systolic_bp": 120,
                "diastolic_bp": 80,
                "temperature": 37.0,
                "oxygen_saturation": 98,
                "respiratory_rate": 16,
                "notes": ""
            }
        ]

        response = self.client.get(
            f"/api/vitals/export?user_uid={encode_id(1)}&format=csv"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "text/csv")
        self.assertTrue(response.get_data(as_text=True).startswith("recorded_at,heart_rate,systolic_bp,diastolic_bp,temperature,oxygen_saturation,respiratory_rate,notes"))

    @patch("vitals.get_db_connection")
    def test_vitals_export_pdf_returns_pdf(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {
                "recorded_at": "2026-05-01 12:00:00",
                "heart_rate": 70,
                "systolic_bp": 120,
                "diastolic_bp": 80,
                "temperature": 37.0,
                "oxygen_saturation": 98,
                "respiratory_rate": 16,
                "notes": ""
            }
        ]

        response = self.client.get(
            f"/api/vitals/export?user_uid={encode_id(1)}&format=pdf"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/pdf")
        self.assertTrue(response.data.startswith(b"%PDF"))

    def test_update_appointment_with_no_fields_returns_400(self):
        response = self.client.put(
            f"/api/appointments/{encode_id(1)}",
            json={}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("No valid fields to update", response.get_json()["error"])

    @patch("appointments._send_confirmation_emails")
    @patch("appointments.get_db_connection")
    def test_update_appointment_calls_db_and_returns_200(self, mock_db_connection, mock_send_confirmation):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn

        response = self.client.put(
            f"/api/appointments/{encode_id(1)}",
            json={
                "appointment_date": "2026-06-16",
                "appointment_time": "15:00:00",
                "status": "confirmed"
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(mock_cursor.execute.call_count, 2)
        self.assertTrue(any(
            call.args[0].startswith("UPDATE appointments SET")
            for call in mock_cursor.execute.call_args_list
        ))

    @patch("appointments.get_db_connection")
    def test_get_appointment_by_uid_returns_200(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchone.return_value = {
            "id": 1,
            "user_id": 1,
            "doctor_id": 2,
            "appointment_date": "2026-06-15",
            "appointment_time": "14:30:00",
            "reason": "Regular checkup",
            "status": "scheduled"
        }

        response = self.client.get(f"/api/appointments/{encode_id(1)}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["uid"], encode_id(1))

    @patch("appointments.get_db_connection")
    def test_list_appointments_by_doctor_uid_returns_200(self, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchall.return_value = [
            {"id": 1, "user_id": 1, "doctor_id": 2, "appointment_date": "2026-06-15", "appointment_time": "14:30:00", "reason": "Checkup", "status": "scheduled"}
        ]

        response = self.client.get(f"/api/appointments?doctor_uid={encode_id(2)}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()), 1)
        self.assertEqual(response.get_json()[0]["doctor_uid"], encode_id(2))

    @patch("appointments.get_db_connection")
    def test_create_appointment_invalid_reminder_returns_400(self, mock_db_connection):
        response = self.client.post(
            "/api/appointments",
            json={
                "user_uid": encode_id(1),
                "doctor_uid": encode_id(2),
                "appointment_date": "2026-06-15",
                "appointment_time": "14:30:00",
                "reminder_days": 31
            }
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("reminder_days must be between 0 and 30", response.get_json()["error"])

    @patch("appointments.get_db_connection")
    def test_update_appointment_invalid_reminder_returns_400(self, mock_db_connection):
        response = self.client.put(
            f"/api/appointments/{encode_id(1)}",
            json={"reminder_days": 999}
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("reminder_days must be between 0 and 30", response.get_json()["error"])

    @patch("appointments._get_user_doctor_emails", return_value=(
        {"email": "patient@example.com", "name": "Jane Doe"},
        {"email": "doctor@example.com", "name": "Dr. Ahmed"}
    ))
    @patch("appointments._send_appointment_email")
    @patch("appointments.get_db_connection")
    def test_delete_appointment_returns_200(self, mock_db_connection, mock_send_email, mock_get_emails):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchone.return_value = {
            "id": 1,
            "user_id": 1,
            "doctor_id": 2,
            "appointment_date": "2026-06-15",
            "appointment_time": "14:30:00"
        }

        response = self.client.delete(f"/api/appointments/{encode_id(1)}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["message"], "Appointment deleted successfully!")
        self.assertTrue(any(call.args[0].startswith("DELETE FROM appointments WHERE") for call in mock_cursor.execute.call_args_list))
        self.assertEqual(mock_get_emails.call_count, 2)

    def test_get_doctor_not_found_returns_404(self):
        with patch("doctors.get_db_connection") as mock_db_connection:
            mock_conn, mock_cursor = self.make_db_mock()
            mock_db_connection.return_value = mock_conn
            mock_cursor.fetchone.return_value = None

            response = self.client.get(f"/api/doctors/{encode_id(999)}")
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.get_json()["error"], "Doctor not found")

    def test_get_appointment_not_found_returns_404(self):
        with patch("appointments.get_db_connection") as mock_db_connection:
            mock_conn, mock_cursor = self.make_db_mock()
            mock_db_connection.return_value = mock_conn
            mock_cursor.fetchone.return_value = None

            response = self.client.get(f"/api/appointments/{encode_id(999)}")
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.get_json()["error"], "Appointment not found")

    @patch("alerts.get_db_connection")
    @patch("auth.decode_auth_token")
    def test_create_alert_missing_required_returns_400(self, mock_decode_auth, mock_db_connection):
        mock_db_connection.return_value = MagicMock()
        mock_decode_auth.return_value = {"uid": encode_id(1), "role": "doctor"}

        response = self.client.post(
            "/api/alerts",
            headers={"Authorization": "Bearer fake-token"},
            json={"user_uid": encode_id(2), "message": "Reminder without title"}
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required fields", response.get_json()["error"])

    @patch("alerts.get_db_connection")
    @patch("auth.decode_auth_token")
    def test_get_alert_not_found_returns_404(self, mock_decode_auth, mock_db_connection):
        mock_conn, mock_cursor = self.make_db_mock()
        mock_db_connection.return_value = mock_conn
        mock_cursor.fetchone.return_value = None
        mock_decode_auth.return_value = {"uid": encode_id(1), "role": "admin"}

        response = self.client.get(
            f"/api/alerts/{encode_id(999)}",
            headers={"Authorization": "Bearer fake-token"}
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"], "Alert not found")


if __name__ == "__main__":
    unittest.main()
