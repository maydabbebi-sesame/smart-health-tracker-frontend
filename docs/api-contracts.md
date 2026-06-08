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
  "age": 52,
  "biologicalSex": "F",
  "weight": 72,
  "height": 163,
  "pregnancyStatus": "Non",
  "bloodPressureSys": 148,
  "bloodPressureDia": 92,
  "heartRate": 82,
  "spo2": 97,
  "temperature": 37.4,
  "glycemia": null,
  "weightVariation": "Stable",
  "chronicDiseases": ["HTA", "Diabete T1/T2"],
  "hasDrugAllergies": "Oui",
  "drugAllergies": "Penicilline, Ibuprofene",
  "familyHistory": ["Cardio", "Diabete"],
  "tobacco": "Non",
  "tobaccoQuantity": "",
  "alcohol": "Oui",
  "alcoholQuantity": "Occasionnel",
  "hasCurrentMedications": "Oui",
  "currentMedications": "Metformine 1000mg 2x/j, Amlodipine 5mg/j",
  "supplements": "",
  "treatmentAdherence": "Toujours",
  "symptoms": ["Fatigue", "Cephalees"],
  "otherSymptoms": "",
  "painIntensity": 6,
  "symptomDuration": "Semaines",
  "painLocation": ["Tete"],
  "triggers": ["Stress"],
  "generalState": "Moyen",
  "physicalActivity": "Sedentaire",
  "diet": ["Diabetique"],
  "sleepQuality": "Mauvais",
  "stressLevel": 4,
  "description": "Contexte additionnel libre saisi par le patient.",
  "consent": true
}
```

Payload notes from `Indicateurs_formulaire.xlsx`:

- Required core fields: `age`, `biologicalSex`, `weight`, `height`, `chronicDiseases`, `hasDrugAllergies`, `tobacco`, `alcohol`, `hasCurrentMedications`, `symptoms`, `consent`.
- Conditional fields: `pregnancyStatus` if `biologicalSex = F`, `drugAllergies` if `hasDrugAllergies = Oui` (entered as multiple frontend rows and serialized before submission), `tobaccoQuantity` if `tobacco = Oui`, `alcoholQuantity` if `alcohol = Oui`, `currentMedications` if `hasCurrentMedications = Oui`, `supplements` if `hasSupplements = Oui`, `symptomDuration` when symptoms are selected, `painIntensity` when a pain symptom is selected, `glycemia` mainly if chronic disease includes diabetes.
- Optional indicators: device measures, family history, treatment adherence, pain location, triggers, general state, physical activity, diet, sleep quality, stress level, free-text description.
- The backend LLM prompt can derive IMC from `weight` and `height`.

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
