# SmartHealth API Contract Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:5000/api`  
**Last Updated:** June 10, 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Database Schemas](#database-schemas)
7. [Frontend vs Backend Model Differences](#frontend-vs-backend-model-differences)

---

## Authentication

### Token-Based Authentication
- **Method:** Bearer token in Authorization header
- **Format:** `Authorization: Bearer <token>`
- **Token Type:** JWT (encrypted with Fernet)
- **Expiry:** Configurable (default: varies by config)
- **Token Payload:**
  ```json
  {
    "uid": "encoded_user_id",
    "role": "user|doctor|admin",
    "exp": "timestamp"
  }
  ```

### Social Login Providers
- **Google:** OAuth 2.0 with ID token verification
- **Facebook:** OAuth 2.0 with access token validation
- **Apple:** OAuth 2.0 with ID token (RS256)

### Security Features
- **Email Verification:** Required before account activation
- **MFA (Multi-Factor Authentication):** Optional 6-digit code via email
- **Account Lockout:** After N failed login attempts (configurable)
- **Token Revocation:** On logout

---

## Authorization

### Role-Based Access Control (RBAC)
Three roles available: `user`, `doctor`, `admin`

| Endpoint | User | Doctor | Admin |
|----------|------|--------|-------|
| GET /api/users | ✗ | ✗ | ✓ |
| GET /api/doctors | ✓ | ✓ | ✓ |
| POST /api/doctors | ✗ | ✗ | ✓ |
| POST /api/alerts (create) | ✗ | ✓ | ✓ |
| POST /api/appointments/send-reminders | ✗ | ✗ | ✓ |
| POST /api/vitals | ✓* | ✓* | ✓ |
| GET /api/vitals | ✓* | ✓* | ✓ |

*Can access own data; admin can access all

---

## Data Models

### User Model
```json
{
  "uid": "encoded_id",
  "name": "string",
  "email": "string",
  "role": "user|doctor|admin",
  "is_verified": boolean,
  "provider": "google|facebook|apple|null",
  "provider_id": "string|null"
}
```

**Backend DB Fields (not exposed in API):**
- `id`: INT (internal)
- `password`: VARCHAR(255) (hashed)
- `verification_code`: VARCHAR(64)
- `verification_expiry`: DATETIME
- `mfa_enabled`: TINYINT(1)
- `mfa_code`: VARCHAR(16)
- `mfa_expiry`: DATETIME
- `failed_attempts`: INT (default: 0)
- `locked_until`: DATETIME

### Doctor Model
```json
{
  "uid": "encoded_id",
  "name": "string",
  "specialization": "string",
  "location": "string",
  "email": "string",
  "phone": "string",
  "bio": "string",
  "availability": "JSON|null"
}
```

**Availability Format (example):**
```json
{
  "monday": ["09:00-12:00", "14:00-18:00"],
  "tuesday": ["09:00-12:00", "14:00-18:00"],
  ...
}
```

### Appointment Model
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "doctor_uid": "encoded_id",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM:SS",
  "reason": "string",
  "status": "scheduled|completed|cancelled",
  "reminder_days": "int",
  "reminder_sent": boolean,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Vital Signs Model
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "heart_rate": "int (50-300 bpm)",
  "systolic_bp": "int (50-300 mmHg)",
  "diastolic_bp": "int (30-200 mmHg)",
  "temperature": "float (30.0-45.0 °C, optional)",
  "oxygen_saturation": "float (50.0-100.0 %, optional)",
  "respiratory_rate": "int (5-60, optional)",
  "notes": "string",
  "recorded_at": "ISO8601",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

**Normal Ranges:**
- Heart Rate: 50-100 bpm
- Systolic BP: 90-140 mmHg
- Diastolic BP: 60-90 mmHg
- Temperature: 36.0-38.0 °C
- O2 Saturation: ≥95%
- Respiratory Rate: 12-20 breaths/min

### Alert Model
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "title": "string",
  "message": "string",
  "category": "general|vitals|form|appointment",
  "is_read": boolean,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Form/Questionnaire Model
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "questionnaire_name": "string",
  "answers": "JSON object",
  "status": "submitted|processed|reviewed",
  "submitted_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

## API Endpoints

### Authentication Module (`/api/auth`)

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "user|doctor|admin (optional, default: user)"
}
```

**Response:** (201 Created)
```json
{
  "message": "User registered successfully; verify email to activate account",
  "uid": "encoded_id"
}
```

**Notes:**
- Requires admin token to register doctor/admin roles
- Verification email sent automatically
- User cannot login until email verified

---

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (No MFA):** (200 OK)
```json
{
  "access_token": "encrypted_jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Response (MFA Enabled):** (200 OK)
```json
{
  "mfa_required": true,
  "message": "MFA code sent"
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Email not verified, account locked
- `400 Bad Request`: Missing fields

---

#### POST /api/auth/login/google
Social login with Google.

**Request:**
```json
{
  "id_token": "string"
}
```

**Response:** (200 OK)
```json
{
  "access_token": "encrypted_jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### POST /api/auth/login/facebook
Social login with Facebook.

**Request:**
```json
{
  "access_token": "string"
}
```

**Response:** (200 OK)
```json
{
  "access_token": "encrypted_jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### POST /api/auth/login/apple
Social login with Apple.

**Request:**
```json
{
  "id_token": "string"
}
```

**Response:** (200 OK)
```json
{
  "access_token": "encrypted_jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### POST /api/auth/logout
Logout and revoke token.

**Auth Required:** Yes (Bearer token)

**Response:** (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/verify-email
Verify email with verification code.

**Request:**
```json
{
  "uid": "encoded_id",
  "code": "string (6-digit code)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- `400 Bad Request`: Invalid/expired code
- `404 Not Found`: User not found
- `200 OK`: Already verified (no error)

---

#### POST /api/auth/request-verification
Request a new verification code.

**Request:**
```json
{
  "email": "string"
}
```

**Response:** (200 OK)
```json
{
  "message": "Verification code generated and sent"
}
```

---

#### POST /api/auth/verify-mfa
Verify MFA code after login.

**Request:**
```json
{
  "email": "string",
  "code": "string (6-digit)"
}
```

**Response:** (200 OK)
```json
{
  "access_token": "encrypted_jwt",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### Users Module (`/api/users`)

#### GET /api/users
List all users (admin only).

**Auth Required:** Yes  
**Role Required:** Admin

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "name": "string",
    "email": "string",
    "role": "user|doctor|admin",
    "is_verified": boolean
  }
]
```

---

#### POST /api/users
Create a new user (without password, or with optional password).

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (optional)",
  "role": "string (optional, default: user)"
}
```

**Response:** (201 Created)
```json
{
  "message": "User added successfully!",
  "uid": "encoded_id"
}
```

---

#### GET /api/users/<uid>
Get user profile (requires auth).

**Auth Required:** Yes

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "name": "string",
  "email": "string",
  "role": "string",
  "is_verified": boolean
}
```

---

#### PUT /api/users/<uid>
Update user profile.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "name": "string",
  "email": "string"
}
```

**Response:** (200 OK)
```json
{
  "message": "User updated successfully!"
}
```

---

#### DELETE /api/users/<uid>
Delete a user.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Response:** (200 OK)
```json
{
  "message": "User deleted successfully!"
}
```

---

#### POST /api/users/reset-password
Reset user password.

**Auth Required:** Yes

**Request:**
```json
{
  "new_password": "string",
  "current_password": "string (if not admin)",
  "uid": "encoded_id (admin only)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Password updated successfully!"
}
```

---

### Doctors Module (`/api/doctors`)

#### GET /api/doctors
List all doctors with optional filtering.

**Auth Required:** No (public endpoint)

**Query Parameters:**
- `specialization`: Optional filter
- `location`: Optional filter (partial match)

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "name": "string",
    "specialization": "string",
    "location": "string",
    "email": "string",
    "phone": "string",
    "bio": "string"
  }
]
```

---

#### GET /api/doctors/<uid>
Get doctor details.

**Auth Required:** No

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "name": "string",
  "specialization": "string",
  "location": "string",
  "email": "string",
  "phone": "string",
  "bio": "string",
  "availability": "JSON|null"
}
```

---

#### GET /api/doctors/<uid>/availability
Get doctor's availability schedule.

**Auth Required:** No

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "name": "string",
  "specialization": "string",
  "location": "string",
  "availability": [
    {
      "day": "monday",
      "slots": ["09:00-12:00", "14:00-18:00"]
    }
  ]
}
```

---

#### POST /api/doctors/<uid>/confirm
Send confirmation message to user about a doctor.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "user_uid": "encoded_id",
  "appointment_date": "YYYY-MM-DD (optional)",
  "appointment_time": "HH:MM:SS (optional)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Confirmation sent to user email."
}
```

---

#### POST /api/doctors
Create a new doctor (admin only).

**Auth Required:** Yes  
**Role Required:** Admin

**Request:**
```json
{
  "name": "string",
  "specialization": "string",
  "email": "string",
  "phone": "string",
  "location": "string (optional)",
  "bio": "string (optional)",
  "availability": "JSON (optional)"
}
```

**Response:** (201 Created)
```json
{
  "message": "Doctor added successfully!",
  "uid": "encoded_id"
}
```

---

### Appointments Module (`/api/appointments`)

#### GET /api/appointments
List appointments with optional filtering.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Filter by user (admin or own uid)
- `doctor_uid`: Filter by doctor

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "user_uid": "encoded_id",
    "doctor_uid": "encoded_id",
    "appointment_date": "YYYY-MM-DD",
    "appointment_time": "HH:MM:SS",
    "reason": "string",
    "status": "scheduled|completed|cancelled",
    "reminder_days": 1,
    "reminder_sent": false,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

---

#### GET /api/appointments/<uid>
Get appointment details.

**Auth Required:** Yes  
**Ownership Check:** Own appointment or admin

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "doctor_uid": "encoded_id",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM:SS",
  "reason": "string",
  "status": "scheduled|completed|cancelled",
  "reminder_days": 1,
  "reminder_sent": false,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

#### POST /api/appointments
Create a new appointment.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "user_uid": "encoded_id",
  "doctor_uid": "encoded_id",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM:SS",
  "reason": "string (optional)",
  "reminder_days": "int 0-30 (optional, default: 1)"
}
```

**Response:** (201 Created)
```json
{
  "message": "Appointment created successfully!",
  "uid": "encoded_id"
}
```

**Side Effects:**
- Confirmation emails sent to user and doctor
- Alert created if urgent symptoms detected in reason

---

#### PUT /api/appointments/<uid>
Update an appointment.

**Auth Required:** Yes  
**Ownership Check:** Own appointment or admin

**Request:**
```json
{
  "appointment_date": "YYYY-MM-DD (optional)",
  "appointment_time": "HH:MM:SS (optional)",
  "reason": "string (optional)",
  "status": "scheduled|completed|cancelled (optional)",
  "reminder_days": "int 0-30 (optional)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Appointment updated successfully!"
}
```

---

#### DELETE /api/appointments/<uid>
Cancel an appointment.

**Auth Required:** Yes  
**Ownership Check:** Own appointment or admin

**Response:** (200 OK)
```json
{
  "message": "Appointment deleted successfully!"
}
```

**Side Effects:**
- Cancellation email sent to user

---

#### POST /api/appointments/send-reminders
Send appointment reminders (admin only).

**Auth Required:** Yes  
**Role Required:** Admin

**Response:** (200 OK)
```json
{
  "message": "Reminders sent: N"
}
```

---

### Vital Signs Module (`/api/vitals`)

#### POST /api/vitals
Record vital signs.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "user_uid": "encoded_id",
  "heart_rate": "int (required)",
  "systolic_bp": "int (required)",
  "diastolic_bp": "int (required)",
  "temperature": "float (optional)",
  "oxygen_saturation": "float (optional)",
  "respiratory_rate": "int (optional)",
  "notes": "string (optional)"
}
```

**Response:** (201 Created)
```json
{
  "message": "Vitals recorded successfully!",
  "uid": "encoded_id"
}
```

**Validation:**
- Heart Rate: 50-300 bpm
- Systolic BP: 50-300 mmHg
- Diastolic BP: 30-200 mmHg
- Temperature: 30.0-45.0 °C
- O2 Saturation: 50.0-100.0%
- Respiratory Rate: 5-60

**Side Effects:**
- Alert created if readings outside normal range

---

#### GET /api/vitals
List vital records.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Filter by user (admin or own uid)

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "user_uid": "encoded_id",
    "heart_rate": 72,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "temperature": 37.1,
    "oxygen_saturation": 98.5,
    "respiratory_rate": 16,
    "notes": "string",
    "recorded_at": "ISO8601",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

---

#### GET /api/vitals/<uid>
Get a specific vital record.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "heart_rate": 72,
  "systolic_bp": 120,
  "diastolic_bp": 80,
  "temperature": 37.1,
  "oxygen_saturation": 98.5,
  "respiratory_rate": 16,
  "notes": "string",
  "recorded_at": "ISO8601",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

#### PUT /api/vitals/<uid>
Update a vital record.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "heart_rate": "int (optional)",
  "systolic_bp": "int (optional)",
  "diastolic_bp": "int (optional)",
  "temperature": "float (optional)",
  "oxygen_saturation": "float (optional)",
  "respiratory_rate": "int (optional)",
  "notes": "string (optional)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Vital updated successfully!"
}
```

---

#### GET /api/vitals/evolution
Get vital signs evolution for charting.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Required for admin, optional for users (defaults to self)
- `measure`: Required (heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation, respiratory_rate)
- `from`: Optional (YYYY-MM-DD)
- `to`: Optional (YYYY-MM-DD)

**Response:** (200 OK)
```json
[
  {
    "recorded_at": "ISO8601",
    "value": 72.5
  }
]
```

---

#### GET /api/vitals/export
Export vital signs history.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Required for admin
- `format`: csv or pdf (default: csv)
- `from`: Optional (YYYY-MM-DD)
- `to`: Optional (YYYY-MM-DD)

**Response:** (200 OK)
- **CSV:** File download with MIME type `text/csv`
- **PDF:** File download with MIME type `application/pdf`

---

### Alerts Module (`/api/alerts`)

#### GET /api/alerts
List alerts.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Filter by user (admin or own uid)
- `unread_only`: Boolean (true, false, yes, no, 1, 0)

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "user_uid": "encoded_id",
    "title": "string",
    "message": "string",
    "category": "general|vitals|form|appointment",
    "is_read": false,
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

---

#### GET /api/alerts/<uid>
Get a specific alert.

**Auth Required:** Yes  
**Ownership Check:** Own alert or admin

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "title": "string",
  "message": "string",
  "category": "general|vitals|form|appointment",
  "is_read": false,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

#### POST /api/alerts
Create a new alert (admin/doctor only).

**Auth Required:** Yes  
**Role Required:** Admin or Doctor

**Request:**
```json
{
  "user_uid": "encoded_id",
  "title": "string",
  "message": "string",
  "category": "string (optional, default: general)"
}
```

**Response:** (201 Created)
```json
{
  "message": "Alert created successfully!",
  "uid": "encoded_id"
}
```

---

#### PUT /api/alerts/<uid>
Update an alert (mark as read, update content).

**Auth Required:** Yes  
**Ownership Check:** Own alert or admin

**Request:**
```json
{
  "is_read": "boolean (optional)",
  "title": "string (optional)",
  "message": "string (optional)"
}
```

**Response:** (200 OK)
```json
{
  "message": "Alert updated successfully!"
}
```

---

#### DELETE /api/alerts/<uid>
Delete an alert.

**Auth Required:** Yes  
**Ownership Check:** Own alert or admin

**Response:** (200 OK)
```json
{
  "message": "Alert deleted successfully!"
}
```

---

### Forms/Questionnaires Module (`/api/forms`)

#### POST /api/forms
Submit a form/questionnaire.

**Auth Required:** Yes  
**Ownership Check:** Own data or admin

**Request:**
```json
{
  "user_uid": "encoded_id",
  "questionnaire_name": "string",
  "answers": {
    "field_name": "value",
    "field_name_2": "value"
  }
}
```

**Response:** (201 Created)
```json
{
  "message": "Form submitted successfully!",
  "uid": "encoded_id"
}
```

**Triggers:**
- Alert created if urgent keywords detected (chest pain, difficulty breathing, etc.)

---

#### GET /api/forms
List form submissions.

**Auth Required:** Yes

**Query Parameters:**
- `user_uid`: Filter by user (admin or own uid)

**Response:** (200 OK)
```json
[
  {
    "uid": "encoded_id",
    "user_uid": "encoded_id",
    "questionnaire_name": "string",
    "answers": { "field": "value" },
    "status": "submitted|processed|reviewed",
    "submitted_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

---

#### GET /api/forms/<uid>
Get a specific form submission.

**Auth Required:** Yes  
**Ownership Check:** Own form or admin

**Response:** (200 OK)
```json
{
  "uid": "encoded_id",
  "user_uid": "encoded_id",
  "questionnaire_name": "string",
  "answers": { "field": "value" },
  "status": "submitted|processed|reviewed",
  "submitted_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Status | Meaning | Example Scenario |
|--------|---------|------------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid JSON, missing fields |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission, account locked |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, reportlab missing |

### Specific Error Messages

| Error | Status | Cause |
|-------|--------|-------|
| "Invalid JSON payload" | 400 | Non-JSON request body |
| "Missing required fields: X, Y, Z" | 400 | Required field not provided |
| "Invalid {field} UID" | 400 | UID decode failed |
| "Authorization header missing or invalid" | 401 | No Bearer token |
| "Invalid or expired token" | 401 | Token validation failed |
| "Token has been revoked" | 401 | User logged out |
| "Forbidden" | 403 | RBAC violation |
| "Email address not verified" | 403 | User not verified |
| "Account locked due to too many failed attempts" | 403 | Brute force protection |
| "{field} not found" | 404 | Resource doesn't exist |
| "Unsupported export format" | 400 | Only csv/pdf accepted |

---

## Database Schemas

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_code VARCHAR(64) DEFAULT NULL,
  verification_expiry DATETIME DEFAULT NULL,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_code VARCHAR(16) DEFAULT NULL,
  mfa_expiry DATETIME DEFAULT NULL,
  provider VARCHAR(50) DEFAULT NULL,
  provider_id VARCHAR(255) DEFAULT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME DEFAULT NULL
);
```

### Doctors Table
```sql
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  location VARCHAR(255) DEFAULT '',
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  bio VARCHAR(2000) DEFAULT '',
  availability TEXT DEFAULT NULL
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(2000) DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  reminder_days INT NOT NULL DEFAULT 1,
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### Vitals Table
```sql
CREATE TABLE vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  heart_rate INT NOT NULL,
  systolic_bp INT NOT NULL,
  diastolic_bp INT NOT NULL,
  temperature FLOAT DEFAULT NULL,
  oxygen_saturation FLOAT DEFAULT NULL,
  respiratory_rate INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Forms Table
```sql
CREATE TABLE forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  questionnaire_name VARCHAR(255) NOT NULL,
  answers TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Frontend vs Backend Model Differences

### Dashboard/Stats (Mock vs Real)

**Frontend Mock:**
```javascript
{
  label: 'Wellness score',
  value: '84%',
  icon: 'heart'
}
```

**Backend Reality:**
- ❌ No `/api/dashboard` or `/api/stats` endpoint exists
- Must be calculated from vitals, alerts, and form data
- **Recommendation:** Frontend should aggregate data from:
  - `GET /api/vitals?user_uid=<uid>` (latest vitals)
  - `GET /api/alerts?user_uid=<uid>&unread_only=true` (unread count)
  - Calculate wellness score client-side

### Heart Rate/Activity Data (Mock vs Real)

**Frontend Mock:**
```javascript
{
  day: 'Mon',
  bpm: 76
}
```

**Backend Reality:**
- Use `GET /api/vitals/evolution?measure=heart_rate&from=<date>&to=<date>`
- Backend returns `{ recorded_at, value }` format
- Frontend must transform timestamps to day labels

### Profile Data (Mock vs Real)

**Frontend Mock:**
```javascript
{
  name: 'Maya Ben Ali',
  email: 'maya@smarthealth.local',
  location: 'Tunis, Tunisia',
  profileStatus: 'Verified account'
}
```

**Backend Reality:**
- Location NOT stored in users table
- `profileStatus` based on `is_verified` field
- Use `GET /api/users/<uid>` endpoint
- Frontend must map boolean to "Verified account" text

### Doctors (Mock vs Real)

**Frontend Mock:** Minimal doctor data in arrays

**Backend Reality:**
- `GET /api/doctors` returns full details: specialization, location, bio, availability
- Phone number included (not in mock)
- Availability is JSON object with day/time slots

### Vital Signs (Mock vs Real)

**Frontend Mock:** Simple array of readings

**Backend Reality:**
- Optional fields: temperature, O2 saturation, respiratory rate
- Automatic alert generation for abnormal values
- Validation limits on all fields
- `recorded_at` vs `created_at` timestamps

### Alerts (Mock vs Real)

**Frontend Mock:** No mock data found

**Backend Reality:**
- Auto-generated on:
  - Abnormal vitals submission
  - Form submission with urgent keywords
  - Appointment created
- Categories: general, vitals, form, appointment
- Email notifications sent automatically

### Forms/Questionnaires (Mock vs Real)

**Frontend Mock:** No mock data found

**Backend Reality:**
- Flexible JSON `answers` object
- Alert triggered by keyword detection
- Supported triggers: chest pain, difficulty breathing, shortness of breath, severe headache, fainting, high fever, blood in urine, palpitations, dizziness, blurred vision

---

## Common Integration Issues

### 1. UID Encoding/Decoding
- **Issue:** Frontend receives encoded UIDs, must use them in subsequent requests
- **Solution:** Store received UIDs as-is; don't try to decode them client-side
- **Example:** `"uid": "eyJkYXRhIjogMTJ9"` → use this exact value in next request

### 2. Timestamps Format
- **Issue:** Backend returns ISO8601 format; some frontend code may expect Unix timestamps
- **Solution:** Parse with `new Date()` or date library
- **Example:** `"2024-06-10T14:30:00"` → use JavaScript date parser

### 3. Role-Based Filtering
- **Issue:** Endpoints behave differently based on user role
- **Solution:** Handle 403 Forbidden gracefully; request returns different data for users vs admin
- **Note:** Admin can access all users; regular users can only access their own data

### 4. Missing Required Fields
- **Issue:** Some fields are optional in requests (temperature, bio, reason)
- **Solution:** Check field nullability before displaying
- **Example:** Temperature may be null if not provided during vital submission

### 5. Social Login Provider Availability
- **Issue:** Google/Facebook/Apple endpoints return 401 if provider not configured
- **Solution:** Test provider configuration in config.py before integrating
- **Fallback:** Always provide traditional email/password login

### 6. Email Notifications Timing
- **Issue:** Email notifications are "best-effort"; failures are silently caught
- **Solution:** Don't rely on email delivery; show in-app notifications
- **Note:** Verification codes still work even if email fails

### 7. MFA Code Expiry
- **Issue:** MFA codes expire after configurable seconds (default unknown)
- **Solution:** Show user clear expiry message; allow request-new-code UX
- **Endpoint:** No explicit MFA resend; user must try login again

---

## Rate Limiting & Quotas

**Status:** ❌ Not implemented

Currently no rate limiting on API endpoints. Recommend implementing:
- 5 failed login attempts → 15 minute lockout (already implemented)
- API request rate limiting: 100 requests/minute per user
- Export rate limiting: 1 export per hour

---

## Postman Collection Available

API definitions available at: `backend/api/smarthealth.postman_collection.json`

**To Import:**
1. Open Postman
2. Click "Import"
3. Select `smarthealth.postman_collection.json`
4. Collections will appear with all endpoints categorized by module

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-10 | 1.0 | Initial API contract documentation |

---

**Document End**
