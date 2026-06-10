# smarthealth

## Setup

1. Copy `.env.example` to `.env` and update the values for your environment.
2. Install dependencies inside `api` using the virtual environment:
   ```bash
   cd api
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   ```
3. Run the database migration:
   ```bash
   cd api
   .venv\Scripts\python.exe run_migrations.py
   ```

## Email verification and MFA

- New registration now stores `is_verified`, `verification_code`, and `verification_expiry`.
- Verification emails are sent using SMTP via `api/email_utils.py`.
- MFA codes are sent by email when `mfa_enabled` is set for a user.
- Use `POST /api/auth/verify-email`, `POST /api/auth/request-verification`, and `POST /api/auth/verify-mfa`.

## Test script

A self-contained API flow test script is available at `api/test_auth_flow.py`.
Run it from the repository root after starting the virtual environment:

```bash
cd api
.venv\Scripts\python.exe test_auth_flow.py
```

## Vitals API

The vitals API provides endpoints to create, update, fetch history, retrieve evolution data, and export history.

### Submit vitals
- `POST /api/vitals`
- Required body fields: `user_uid`, `heart_rate`, `systolic_bp`, `diastolic_bp`
- Optional body fields: `temperature`, `oxygen_saturation`, `respiratory_rate`, `notes`
- Validates values and creates alerts when abnormal readings are detected.

#### Test steps
1. Log in and set `{{authToken}}` in Postman via `Auth > Login`.
2. Ensure `{{userUid}}` is set for the target user.
3. Send `POST /api/vitals` with a valid JSON body.
4. Verify the response returns `201` and an `uid`.

#### Postman variable notes
- `{{authToken}}` should be set from the login response.
- `{{userUid}}` should be the encoded user UID of the patient.
- After submitting vitals, use `{{vitalUid}}` for `GET /api/vitals/{{vitalUid}}` and `PUT /api/vitals/{{vitalUid}}`.

### Update a vital record
- `PUT /api/vitals/{{vitalUid}}`
- Accepts the same vitals fields plus `notes`.
- Updates `updated_at` and may trigger an alert if abnormalities remain.

#### Test steps
1. Use the `{{vitalUid}}` returned by `Submit Vitals`.
2. Send `PUT /api/vitals/{{vitalUid}}` with updated measurement values.
3. Verify the response returns `200`.

### List vitals history
- `GET /api/vitals?user_uid={{userUid}}`
- Returns all vitals records for the specified user, newest first.

#### Test steps
1. Send `GET /api/vitals?user_uid={{userUid}}`.
2. Verify the response is an array of records with `recorded_at`, `created_at`, and `updated_at`.

### Get vitals evolution
- `GET /api/vitals/evolution?user_uid={{userUid}}&measure=heart_rate&from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns an ordered time series of measurement values for charting.

#### Test steps
1. Send a GET request with `measure`, `from`, and `to` query parameters.
2. Verify the response returns an array of objects with `recorded_at` and `value`.

### Export vitals history
- `GET /api/vitals/export?user_uid={{userUid}}&format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/vitals/export?user_uid={{userUid}}&format=pdf&from=YYYY-MM-DD&to=YYYY-MM-DD`
- Downloads a CSV or PDF file containing the selected history.

#### Test steps
1. Send `GET /api/vitals/export` with `format=csv` or `format=pdf`.
2. Confirm the response includes `Content-Disposition` and the correct file type.

### cURL examples

#### Submit vitals
```bash
curl -X POST http://localhost:5000/api/vitals \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_uid": "'$USER_UID'",
    "heart_rate": 110,
    "systolic_bp": 150,
    "diastolic_bp": 95,
    "temperature": 38.2,
    "oxygen_saturation": 93,
    "respiratory_rate": 22,
    "notes": "Patient feels short of breath."
  }'
```

#### Update vital record
```bash
curl -X PUT http://localhost:5000/api/vitals/$VITAL_UID \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heart_rate": 98,
    "systolic_bp": 130,
    "diastolic_bp": 82,
    "notes": "Routine update"
  }'
```

#### Get vitals evolution
```bash
curl -X GET "http://localhost:5000/api/vitals/evolution?user_uid=$USER_UID&measure=heart_rate&from=2026-05-01&to=2026-05-07" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

#### Export vitals CSV
```bash
curl -X GET "http://localhost:5000/api/vitals/export?user_uid=$USER_UID&format=csv&from=2026-05-01&to=2026-05-07" \
  -H "Authorization: Bearer $AUTH_TOKEN" -o vitals.csv
```

#### Export vitals PDF
```bash
curl -X GET "http://localhost:5000/api/vitals/export?user_uid=$USER_UID&format=pdf&from=2026-05-01&to=2026-05-07" \
  -H "Authorization: Bearer $AUTH_TOKEN" -o vitals.pdf
```

## Notes

- `api/config.py` uses `python-dotenv` and reads configuration from `.env` or environment variables.
- `api/run_migrations.py` tracks applied migrations in a `migrations` table.
