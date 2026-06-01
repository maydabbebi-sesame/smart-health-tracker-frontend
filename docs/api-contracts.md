# Smart Health Tracker API Contracts

This document describes the backend contracts expected by the frontend MVP.
Current implementation is frontend-only and uses mocks through `src/services/*`.

## Auth

### `POST /auth/login`

Request:

```json
{
  "email": "maya@smarthealth.local",
  "password": "password"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-1",
    "name": "Maya Ben Ali",
    "email": "maya@smarthealth.local",
    "role": "patient"
  }
}
```

### `POST /auth/register`

Request:

```json
{
  "name": "Maya Ben Ali",
  "email": "maya@smarthealth.local",
  "password": "password"
}
```

Response: same shape as login.

### `GET /auth/me`

Response:

```json
{
  "id": "user-1",
  "name": "Maya Ben Ali",
  "email": "maya@smarthealth.local",
  "role": "patient"
}
```

## Symptoms

### `GET /symptoms/options`

Response:

```json
[
  "Headache",
  "Fever",
  "Fatigue",
  "Chest Pain",
  "Cough",
  "Dizziness",
  "Nausea",
  "Shortness of Breath"
]
```

### `POST /symptoms/analyze`

Request:

```json
{
  "age": 29,
  "gender": "Female",
  "weight": 68,
  "symptoms": ["Chest Pain", "Fatigue"],
  "description": "Chest tightness after walking, with mild fatigue today.",
  "consent": true
}
```

Response:

```json
{
  "id": "analysis-id",
  "analysis": {
    "riskLevel": "Moderate",
    "summary": "Your symptoms may indicate a short-term respiratory or fatigue pattern.",
    "recommendations": [
      "Rest and hydrate over the next 24 hours.",
      "Track your temperature twice daily.",
      "Contact a healthcare professional if symptoms become severe."
    ],
    "confidence": 86
  }
}
```

Possible errors:

```json
{
  "message": "Validation error",
  "fields": {
    "symptoms": "Select at least one symptom."
  }
}
```

## Dashboard

### `GET /dashboard/summary`

Response:

```json
{
  "stats": [
    { "label": "Wellness score", "value": "84%", "icon": "heart" },
    { "label": "Symptoms logged", "value": "6", "icon": "activity" }
  ],
  "healthPlanItems": [
    "Log evening symptoms",
    "Review medication reminder"
  ]
}
```

### `GET /dashboard/charts`

Response:

```json
{
  "heartRateData": [{ "day": "Mon", "bpm": 76 }],
  "weightData": [{ "week": "W1", "weight": 72.4 }],
  "activityData": [{ "day": "Mon", "steps": 6400, "sleep": 7.1 }]
}
```

## AI Analysis

### `GET /ai-analysis/latest`

Response:

```json
{
  "analysis": {
    "riskLevel": "Moderate",
    "summary": "AI analysis summary",
    "recommendations": ["Recommendation 1"],
    "confidence": 86
  },
  "insights": [
    "Fatigue appears more frequently after short sleep nights."
  ]
}
```

## Health History

### `GET /health-history`

Response:

```json
[
  {
    "title": "Annual wellness check",
    "date": "May 20, 2026",
    "type": "Routine"
  }
]
```

## Notifications

### `GET /notifications`

Response:

```json
[
  {
    "id": "notif-1",
    "title": "Weekly summary ready",
    "text": "Your weekly health summary is ready.",
    "status": "New"
  }
]
```

### `PATCH /notifications/:id/read`

Response:

```json
{
  "id": "notif-1",
  "read": true
}
```

## Profile

### `GET /profile`

Response:

```json
{
  "name": "Maya Ben Ali",
  "email": "maya@smarthealth.local",
  "location": "Tunis, Tunisia",
  "profileStatus": "Verified account",
  "healthProfileStatus": "Basic details complete"
}
```

### `PATCH /profile`

Request:

```json
{
  "name": "Maya Ben Ali",
  "location": "Tunis, Tunisia"
}
```

Response: updated profile object.

## Admin

### `GET /admin/summary`

Response:

```json
[
  { "label": "Registered users", "value": "2,418" },
  { "label": "AI analyses today", "value": "684" },
  { "label": "Open support alerts", "value": "12" }
]
```

## Frontend Notes

- Current auth is a fake JWT stored in `localStorage`.
- Current API calls are mocked in `src/services/*`.
- Backend integration should replace service internals while preserving exported function names where possible.
- User roles are only `patient` and optional `admin`.
- No doctor/practitioner routes are expected.
