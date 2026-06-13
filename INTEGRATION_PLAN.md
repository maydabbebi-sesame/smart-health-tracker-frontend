# SmartHealth Frontend-Backend Integration Plan

## Objective
Align frontend React app with backend APIs by replacing all in-memory mock data with real API calls. Keep frontend as the source of truth for data models.

---

## Current State Analysis

### Frontend Status
- **8 Pages** with mock data
- **7 Services** all using mock data with artificial delays
- **6 Mock Files** in src/mocks/
- **Real Integration**: Only MediAssist chat works with real API
- **Data Models**: Defined implicitly via Zod schemas and mock data (no TypeScript interfaces)
- **State Management**: Zustand stores for theme and MediAssist

### Backend Status
- **37+ API Endpoints** across 7 modules
- **JWT Authentication** with email verification and MFA
- **6 Database Tables** with full data persistence
- **Auto-Alert Generation** from vitals and form submissions
- **Role-Based Access** (user, doctor, admin)
- **Postman Collection** available for testing

---

## Integration Strategy

### Phase 1: Foundation Setup
1. **Create TypeScript Interfaces** (`src/types/models.ts`)
   - Define all frontend data models as source of truth
   - Align with backend responses
   - Include request/response DTO types

2. **Create API Constants** (`src/constants/apiEndpoints.ts`)
   - All backend endpoints
   - Base paths for each module

3. **Setup Environment** (`.env` file)
   - API base URL pointing to backend
   - Timeout configurations
   - Development vs production settings

### Phase 2: Service Layer Migration
Replace each mock service with real API calls:

1. **authService.js** → Connect to `/auth/*` endpoints
   - Login, register, email verification, MFA
   - Store JWT token
   - Handle role-based redirects

2. **profileService.js** → Connect to `/users/*` endpoints
   - Get user profile data
   - Update user information
   - Store profile locally for source of truth

3. **dashboardService.js** → Aggregate data from multiple endpoints
   - Fetch latest vitals → dashboard stats
   - Fetch recent appointments
   - Fetch pending alerts
   - Calculate wellness score client-side

4. **vitalsService.js** (NEW) → Connect to `/vitals/*` endpoints
   - Record new vital measurements
   - List vitals history
   - Get vital evolution charts
   - Export vitals data

5. **appointmentsService.js** (NEW) → Connect to `/appointments/*` endpoints
   - List user's appointments
   - Create new appointments
   - Update appointments
   - Get available doctor slots

6. **alertsService.js** (NEW) → Connect to `/alerts/*` endpoints
   - Fetch all alerts
   - Mark alerts as read
   - Acknowledge critical alerts

7. **aiAnalysisService.js** → Already using real API, enhance with:
   - Connect symptom form submissions to backend `/forms/*` endpoints
   - Integrate with MediAssist service

8. **doctorService.js** (NEW) → Connect to `/doctors/*` endpoints
   - List all doctors
   - Get doctor details
   - Get doctor availability

### Phase 3: Component Updates
Update components to use new services:

1. **LoginPage.jsx** → Use real auth service
2. **RegisterPage.jsx** → Use real auth service
3. **DashboardPage.jsx** → Aggregate real data
4. **ProfilePage.jsx** → Real user data
5. **SymptomsPage.jsx** → Submit to real forms endpoint
6. **HistoryPage.jsx** → Real vitals history
7. **SettingsPage.jsx** → Real user settings
8. **AIAnalysisPage.jsx** → Real symptom analysis

### Phase 4: Remove Mock Data
- Remove `.delay()` mock calls
- Delete mock files (keep as reference)
- Delete mockApi.js

---

## Data Model Alignment

### Frontend Models (Source of Truth)

#### User Model
```javascript
{
  uid: string,              // from auth
  name: string,
  email: string,
  role: "user" | "doctor" | "admin",
  verified: boolean,
  mfaEnabled: boolean,
  profilePicture: string,   // optional, not in backend
  bio: string,
  phone: string,            // optional
  dateOfBirth: ISO8601,     // optional
  address: string,          // optional
  city: string,             // optional
  country: string,          // optional
}
```

#### Vital Model
```javascript
{
  id: string,
  userId: string,
  timestamp: ISO8601,
  type: "heart_rate" | "blood_pressure" | "temperature" | "oxygen" | "respiratory_rate",
  value: number,
  unit: string,
  notes: string,
  alertGenerated: boolean,
}
```

#### Appointment Model
```javascript
{
  id: string,
  userId: string,
  doctorId: string,
  date: ISO8601,
  time: string,
  reason: string,
  status: "scheduled" | "completed" | "cancelled",
  notes: string,
  reminderEnabled: boolean,
  createdAt: ISO8601,
}
```

#### Alert Model
```javascript
{
  id: string,
  userId: string,
  type: "vital" | "form" | "appointment",
  severity: "low" | "medium" | "high" | "critical",
  title: string,
  message: string,
  sourceId: string,         // vital/form/appointment ID
  read: boolean,
  acknowledged: boolean,
  createdAt: ISO8601,
}
```

#### Doctor Model
```javascript
{
  id: string,
  name: string,
  specialization: string,
  bio: string,
  phone: string,
  location: string,
  availability: object,     // JSON availability schedule
  rating: number,
  verified: boolean,
}
```

### Key Differences to Handle
- Backend stores UIDs as base64 → decode/encode as needed
- Backend timestamps are ISO8601 → parse with Date()
- Dashboard wellness score not in backend → calculate client-side
- Location not in user table → optional field from appointment address

---

## Implementation Checklist

### Step 1: Models & Types
- [ ] Create `src/types/models.ts` with TypeScript interfaces
- [ ] Create `src/constants/apiEndpoints.ts` with all endpoints
- [ ] Create `.env` with API_BASE_URL

### Step 2: Utilities
- [ ] Create `src/utils/apiHelpers.ts` for common transformations
- [ ] Add error handling utilities
- [ ] Add response parsing utilities

### Step 3: Services (One at a Time)
- [ ] Update authService
- [ ] Update profileService
- [ ] Create/update vitalsService
- [ ] Create/update appointmentsService
- [ ] Create/update alertsService
- [ ] Update aiAnalysisService
- [ ] Create/update dashboardService (depends on vitals)

### Step 4: Components
- [ ] Update pages to use new services
- [ ] Add loading/error states
- [ ] Add user feedback (toast notifications)

### Step 5: Testing
- [ ] Test auth flow (login → profile)
- [ ] Test data fetching (dashboard)
- [ ] Test data submission (symptoms, vitals)
- [ ] Test error handling

### Step 6: Cleanup
- [ ] Remove mock files
- [ ] Remove mock delays
- [ ] Clean up unused mock imports

---

## Environment Setup

Create `.env` file in project root:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
```

For local development, ensure backend is running on port 5000.

---

## Testing Strategy

1. **Integration Testing**: Use Postman collection to verify all endpoints work
2. **Frontend Testing**: Test each service independently with real API
3. **E2E Testing**: Test complete user flows (auth → dashboard → vitals)
4. **Mock Fallback**: Consider keeping mock mode for offline development

---

## Notes
- Frontend maintains session token in localStorage (auth.js)
- MediAssist service already working with real API (good reference)
- API responses use ISO8601 timestamps (parse immediately on receive)
- All responses have `success` and `data` fields in wrapper
- Error responses have `error` field with message

---

## Estimated Timeline
- Phase 1 (Setup): 1 hour
- Phase 2 (Services): 4-6 hours (depends on parallel work)
- Phase 3 (Components): 2-3 hours
- Phase 4 (Testing & Cleanup): 2 hours
- **Total: ~10 hours**

