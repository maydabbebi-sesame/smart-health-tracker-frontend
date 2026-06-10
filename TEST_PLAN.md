# SmartHealth Frontend - Comprehensive Test Plan

## Executive Summary

**Overall API Integration Status:** 83% Complete (10/12 mocks)

| Status | Count | Notes |
|--------|-------|-------|
| ✓ Complete | 2 | AI Analysis, Profile |
| ⚠ Partial | 4 | Dashboard, Health History, Symptoms, Weight Data |
| ✗ Missing | 3 | Admin, Activity Data, Health Plan Items |
| — Unused | 2 | Notifications, AI Insights |

---

## Phase 1: Unit Testing (Service Level)

Test each service in isolation to ensure real API calls work correctly.

### 1.1 Authentication Service

**File:** `src/services/authService.js`

#### Test 1.1.1: Login Success
```javascript
Preconditions: Backend running, user exists
Steps:
1. Call login('user@example.com', 'password123')
2. Verify response.success === true
3. Verify response.data.token exists
4. Verify response.data.user contains uid, email, name
5. Verify localStorage has TOKEN_KEY and USER_KEY set

Expected Result: ✓ PASS
Acceptance: Token stored, user data available
```

#### Test 1.1.2: Login Failure
```javascript
Steps:
1. Call login('user@example.com', 'wrongpassword')
2. Verify response.success === false
3. Verify response.error contains message
4. Verify localStorage unchanged

Expected Result: ✓ PASS
Acceptance: Error message displayed, no token stored
```

#### Test 1.1.3: Registration
```javascript
Steps:
1. Call register('New User', 'newuser@example.com', 'password123')
2. Verify response.success === true
3. Verify backend created user record

Expected Result: ✓ PASS
Acceptance: User registered, email verification required
```

#### Test 1.1.4: Email Verification
```javascript
Preconditions: User registered but not verified
Steps:
1. Call verifyEmail('user@example.com', '123456')
2. Verify response.success === true
3. Verify user.verified === true in backend

Expected Result: ✓ PASS
Acceptance: User can now login
```

#### Test 1.1.5: MFA Setup & Verification
```javascript
Preconditions: User logged in
Steps:
1. Call requestMFA(user.uid)
2. Verify response.data.qrCode or secret
3. Call verifyMFA(user.uid, '000000')
4. Verify response.success === true

Expected Result: ✓ PASS
Acceptance: MFA enabled on account
```

---

### 1.2 Profile Service

**File:** `src/services/profileService.js`

#### Test 1.2.1: Get Profile
```javascript
Preconditions: Authenticated, token in headers
Steps:
1. Call getPatientProfile()
2. Verify response.success === true
3. Verify response.data contains: uid, name, email, role

Expected Result: ✓ PASS
Acceptance: User profile loaded
```

#### Test 1.2.2: Update Profile
```javascript
Preconditions: Authenticated
Steps:
1. Call updateUserProfile({ name: 'New Name', bio: 'New bio' })
2. Verify response.success === true
3. Verify response.data.name === 'New Name'
4. Verify backend updated

Expected Result: ✓ PASS
Acceptance: Profile changes saved
```

#### Test 1.2.3: Change Password
```javascript
Preconditions: Authenticated
Steps:
1. Call changePassword('oldPassword123', 'newPassword456')
2. Verify response.success === true
3. Verify login works with new password

Expected Result: ✓ PASS
Acceptance: Password changed, can login with new password
```

---

### 1.3 Vitals Service

**File:** `src/services/vitalsService.js`

#### Test 1.3.1: Record Vital
```javascript
Preconditions: Authenticated
Steps:
1. Call recordVital({ type: 'heart_rate', value: 72 })
2. Verify response.success === true
3. Verify response.data.id exists
4. Verify backend stored record

Expected Result: ✓ PASS
Acceptance: Vital recorded with timestamp
```

#### Test 1.3.2: Get Vitals List
```javascript
Preconditions: User has vitals recorded
Steps:
1. Call getVitals(1, 20)
2. Verify response.success === true
3. Verify response.data.data is array
4. Verify pagination included

Expected Result: ✓ PASS
Acceptance: Vitals paginated correctly
```

#### Test 1.3.3: Get Vital Evolution
```javascript
Preconditions: Multiple vitals of same type recorded
Steps:
1. Call getVitalEvolution('heart_rate', 'week')
2. Verify response.success === true
3. Verify data contains trend information
4. Verify timestamps in ISO8601

Expected Result: ✓ PASS
Acceptance: Chart data ready for visualization
```

---

### 1.4 Appointments Service

**File:** `src/services/appointmentsService.js`

#### Test 1.4.1: Get Doctors
```javascript
Preconditions: Backend has doctors
Steps:
1. Call getDoctors(1, 20) (from doctorsService)
2. Verify response.success === true
3. Verify doctors have: id, name, specialization

Expected Result: ✓ PASS
Acceptance: Doctor list displayed
```

#### Test 1.4.2: Create Appointment
```javascript
Preconditions: Doctor ID known
Steps:
1. Call createAppointment({ doctorId, date, time, reason })
2. Verify response.success === true
3. Verify response.data.id exists
4. Verify backend created appointment

Expected Result: ✓ PASS
Acceptance: Appointment scheduled
```

#### Test 1.4.3: Get Appointments
```javascript
Preconditions: User has appointments
Steps:
1. Call getAppointments(1, 20)
2. Verify response.success === true
3. Verify appointments have: id, date, time, doctorName

Expected Result: ✓ PASS
Acceptance: Appointments listed correctly
```

#### Test 1.4.4: Cancel Appointment
```javascript
Preconditions: Appointment exists
Steps:
1. Call cancelAppointment(appointmentId, 'Schedule conflict')
2. Verify response.success === true
3. Verify backend status changed to 'cancelled'

Expected Result: ✓ PASS
Acceptance: Appointment cancelled
```

---

### 1.5 Alerts Service

**File:** `src/services/alertsService.js`

#### Test 1.5.1: Get Alerts
```javascript
Preconditions: Alerts exist (from vitals or forms)
Steps:
1. Call getAlerts(1, 20)
2. Verify response.success === true
3. Verify alerts have: id, title, severity, message

Expected Result: ✓ PASS
Acceptance: Alerts displayed
```

#### Test 1.5.2: Mark Alert Read
```javascript
Preconditions: Unread alert exists
Steps:
1. Call markAlertAsRead(alertId)
2. Verify response.success === true
3. Verify alert.read === true

Expected Result: ✓ PASS
Acceptance: Alert marked as read
```

#### Test 1.5.3: Acknowledge Alert
```javascript
Preconditions: Alert exists
Steps:
1. Call acknowledgeAlert(alertId)
2. Verify response.success === true
3. Verify alert.acknowledged === true

Expected Result: ✓ PASS
Acceptance: Alert dismissed by user
```

---

### 1.6 Forms Service

**File:** `src/services/formsService.js`

#### Test 1.6.1: Submit Symptom Form
```javascript
Preconditions: Form data validated
Steps:
1. Call submitForm('symptom_assessment', { mainSymptoms: [...], ... })
2. Verify response.success === true
3. Verify response.data.id exists
4. Verify backend triggered alert if needed

Expected Result: ✓ PASS
Acceptance: Form submitted, AI analysis available
```

#### Test 1.6.2: Get Form History
```javascript
Preconditions: Forms submitted
Steps:
1. Call getFormHistory(1, 20)
2. Verify response.success === true
3. Verify forms have: id, submittedAt, answers

Expected Result: ✓ PASS
Acceptance: Form history displayed
```

---

### 1.7 AI Analysis Service

**File:** `src/services/aiAnalysisService.js`

#### Test 1.7.1: Analyze Symptoms
```javascript
Preconditions: Valid symptom data
Steps:
1. Call analyzeSymptoms({ symptoms: [...], severity: 'moderate' })
2. Verify response.success === true
3. Verify response.analysis contains: recommendations, urgency

Expected Result: ✓ PASS
Acceptance: AI analysis provided
```

#### Test 1.7.2: Get Recommendations
```javascript
Preconditions: Health data available
Steps:
1. Call getRecommendations({ vitals: [...] })
2. Verify response.success === true
3. Verify recommendations is array

Expected Result: ✓ PASS
Acceptance: Personalized recommendations shown
```

---

### 1.8 Dashboard Service

**File:** `src/services/dashboardService.js`

#### Test 1.8.1: Get Dashboard Summary
```javascript
Preconditions: User has vitals, appointments, alerts
Steps:
1. Call getDashboardSummary()
2. Verify response.success === true
3. Verify response.data.stats contains:
   - totalVitalsRecorded (number)
   - upcomingAppointments (number)
   - pendingAlerts (number)
   - wellnessScore (0-100)

Expected Result: ✓ PASS
Acceptance: Dashboard stats calculated correctly
```

#### Test 1.8.2: Get Dashboard Charts
```javascript
Preconditions: Latest vitals recorded
Steps:
1. Call getDashboardCharts()
2. Verify response.success === true
3. Verify response.data.heartRateData exists

Expected Result: ✓ PASS
Acceptance: Chart data available
```

---

## Phase 2: Integration Testing (Page Level)

Test pages with real services to ensure UI integrates correctly.

### 2.1 LoginPage Integration

#### Test 2.1.1: Complete Login Flow
```javascript
Steps:
1. Navigate to /login
2. Enter email 'user@example.com'
3. Enter password 'password123'
4. Click "Login"
5. Wait for page to redirect to /dashboard
6. Verify Dashboard displays user data

Expected Result: ✓ PASS
Acceptance: User logged in, redirected to dashboard
```

#### Test 2.1.2: Login Error Handling
```javascript
Steps:
1. Navigate to /login
2. Enter wrong credentials
3. Click "Login"
4. Verify error message displays
5. Verify not redirected

Expected Result: ✓ PASS
Acceptance: Error shown, user stays on login page
```

### 2.2 DashboardPage Integration

#### Test 2.2.1: Dashboard Loads Stats ⚠️ ISSUE
```javascript
Current Issue: healthPlanItems undefined
Steps:
1. Navigate to /dashboard
2. Wait for data to load
3. Verify "Total Vitals" shows count
4. Verify "Upcoming Appointments" shows count
5. Verify "Pending Alerts" shows count
6. Verify "Wellness Score" shows 0-100 number

Expected Result: ⚠️ PARTIAL (missing healthPlanItems)
Acceptance: Stats display correctly after fix
Fix Required: See Issue #1 in Fixes section
```

### 2.3 ProfilePage Integration

#### Test 2.3.1: Profile Loads
```javascript
Steps:
1. Navigate to /profile
2. Wait for profile data to load
3. Verify name, email, bio display

Expected Result: ✓ PASS
Acceptance: Profile data displayed
```

#### Test 2.3.2: Profile Update
```javascript
Steps:
1. On profile page, edit bio field
2. Click Save
3. Wait for confirmation
4. Refresh page
5. Verify bio persists

Expected Result: ✓ PASS
Acceptance: Profile updated and persisted
```

### 2.4 SymptomsPage Integration

#### Test 2.4.1: Submit Symptom Form
```javascript
Steps:
1. Navigate to /symptoms
2. Fill form with:
   - Main symptoms: ['fever', 'cough']
   - Duration: '3 days'
   - Severity: 'moderate'
   - Other fields as required
3. Click Submit
4. Wait for analysis
5. Verify recommendations displayed

Expected Result: ✓ PASS
Acceptance: Form submitted, AI analysis shown
```

### 2.5 HistoryPage Integration

#### Test 2.5.1: Health History Loads
```javascript
Steps:
1. Navigate to /history
2. Wait for records to load
3. Verify vitals displayed in table

Expected Result: ⚠️ PARTIAL (structure mismatch)
Acceptance: After fix, vitals displayed correctly
Fix Required: See Issue #2 in Fixes section
```

---

## Phase 3: Error Handling Tests

Test error scenarios for robustness.

### 3.1 Network Errors

#### Test 3.1.1: API Unreachable
```javascript
Preconditions: Backend stopped
Steps:
1. Navigate to /dashboard
2. Observe error message
3. Verify "Retry" button appears
4. Start backend
5. Click Retry
6. Verify data loads

Expected Result: ✓ PASS
Acceptance: Graceful error handling, retry works
```

#### Test 3.1.2: Request Timeout
```javascript
Preconditions: Backend responds slowly
Steps:
1. Set timeout to 500ms
2. Make slow API call
3. Observe timeout error
4. Verify user can retry

Expected Result: ✓ PASS
Acceptance: Timeout handled gracefully
```

### 3.2 Authentication Errors

#### Test 3.2.1: Token Expired
```javascript
Preconditions: Valid token, simulate expiration
Steps:
1. Set token expiry to past date
2. Navigate to /profile
3. Observe unauthorized error
4. Verify redirect to /login

Expected Result: ✓ PASS
Acceptance: User redirected to login
```

#### Test 3.2.2: Invalid Token
```javascript
Preconditions: Token in localStorage
Steps:
1. Manually corrupt token in console
2. Navigate to /profile
3. Observe error
4. Verify redirect to /login

Expected Result: ✓ PASS
Acceptance: Invalid token handled
```

### 3.3 Validation Errors

#### Test 3.3.1: Invalid Form Data
```javascript
Steps:
1. Navigate to /symptoms
2. Submit form with invalid data
3. Observe validation error message

Expected Result: ✓ PASS
Acceptance: Client-side validation working
```

#### Test 3.3.2: Server Validation Error
```javascript
Steps:
1. Intercept request
2. Send malformed data
3. Observe server error response

Expected Result: ✓ PASS
Acceptance: Server validation working
```

---

## Phase 4: Mock vs Real Data Verification

Verify data structures match between mocks and API responses.

### 4.1 Profile Data
```javascript
Mock: { name, email, location, profileStatus }
API: { uid, name, email, phone, role, bio, verified }

Test:
1. Load profile via API
2. Verify all expected fields present
3. Check data types match

Expected Result: ⚠️ PARTIAL (location field missing)
Acceptance: Fields map correctly after transformation
```

### 4.2 Dashboard Stats
```javascript
Mock: Array of { label, value, icon } objects
API: Object of { totalVitalsRecorded, upcomingAppointments, ... }

Test:
1. Get dashboard summary
2. Verify stats is object not array
3. Check numeric values

Expected Result: ⚠️ NEEDS FIX
Acceptance: Service returns correct format
Fix Required: See Issue #3
```

### 4.3 Vitals Data
```javascript
Mock: { title, date, type, value }
API: { id, type, value, timestamp, unit }

Test:
1. Record vital
2. Get vitals list
3. Verify all fields present

Expected Result: ✓ PASS
Acceptance: Data structure aligned
```

---

## Phase 5: Performance Tests

Verify API response times are acceptable.

### 5.1 Load Time Benchmarks

```javascript
Target Response Times:
- Login: < 2 seconds
- Get Profile: < 1 second
- Get Vitals List: < 2 seconds
- Create Vital: < 1 second
- Get Dashboard: < 3 seconds
- AI Analysis: < 10 seconds (LLM processing)

Test:
1. Make API call
2. Measure response time
3. Compare to target

Expected Result: ✓ PASS if < target
Acceptance: All endpoints meet SLA
```

### 5.2 Pagination Performance

```javascript
Test:
1. Get vitals with pageSize: 100
2. Measure response time
3. Verify data completeness

Expected Result: ✓ PASS
Acceptance: Large result sets handled efficiently
```

---

## Known Issues & Fixes Required

### Issue #1: Dashboard healthPlanItems Missing ⚠️ HIGH PRIORITY

**Location:** `src/pages/DashboardPage.jsx` line 265

**Problem:**
```javascript
// Currently returns:
{ stats: { totalVitalsRecorded, upcomingAppointments, ... } }

// But code expects:
summary.healthPlanItems[0]  // ← UNDEFINED ERROR
```

**Fix Required:**
```javascript
// Option 1: Backend provides health plan items
// Add endpoint: GET /users/health-plan

// Option 2: Frontend generates dummy data
const healthPlanItems = []

// Option 3: Remove feature from dashboard
// Don't render health plan section
```

**Status:** 🔴 BLOCKER - Must fix before integration testing

---

### Issue #2: Admin Dashboard Missing Service Wrapper ⚠️ HIGH PRIORITY

**Location:** `src/pages/admin/` (AdminDashboardPage.jsx)

**Problem:**
```javascript
// Directly imports mock instead of using service
import { adminStats } from '../mocks/admin.mock'
```

**Fix Required:**
```javascript
// Create adminService.js
// Create getAdminStats() function
// Add backend endpoint: GET /admin/statistics

// Then update component:
import { getAdminStats } from '../services/adminService'
```

**Status:** 🔴 BLOCKER - Can't test admin features without this

---

### Issue #3: Health History Structure Mismatch ⚠️ MEDIUM PRIORITY

**Location:** `src/pages/HistoryPage.jsx`

**Problem:**
```javascript
// Mock data has display-friendly structure
{ title: 'Blood Pressure Check', date, type: 'Vitals' }

// API returns vital measurements
{ type: 'blood_pressure', value: 140/90, timestamp }
```

**Fix Required:**
```javascript
// Add transformation in healthHistoryService.js
// Map vital type to display format
const formatVitalForDisplay = (vital) => ({
  title: getDisplayName(vital.type),
  date: vital.timestamp,
  value: vital.value,
  type: 'Vitals'
})
```

**Status:** 🟡 NEEDS WORK - Data flows but formatting wrong

---

### Issue #4: Missing Activity Data Endpoint ⚠️ MEDIUM PRIORITY

**Location:** `src/pages/DashboardPage.jsx` line 247

**Problem:**
```javascript
// No backend endpoint for activity/steps data
// Mock has: { day, steps, calories }
```

**Fix Required:**
```javascript
// Option 1: Add endpoint GET /vitals/activity
// Option 2: Use wearable API integration
// Option 3: Remove activity widget from dashboard
```

**Status:** 🟡 FEATURE GAP - Non-critical but requested

---

### Issue #5: Dashboard Stats Structure ⚠️ MEDIUM PRIORITY

**Location:** `dashboardService.js` and `DashboardPage.jsx`

**Problem:**
```javascript
// Mock expects array of display objects:
dashboardStats.map(stat => <div>{stat.label}: {stat.value}</div>)

// Service returns aggregated object:
{ totalVitalsRecorded: 42, upcomingAppointments: 3, ... }
```

**Status:** 🟡 NEEDS TRANSFORMATION - Component mapping wrong

---

## Test Execution Schedule

### Week 1: Unit Tests
- [ ] Day 1-2: Auth Service tests
- [ ] Day 3: Profile & Vitals tests
- [ ] Day 4: Appointments & Alerts tests
- [ ] Day 5: Forms & AI tests

### Week 2: Integration Tests
- [ ] Day 1: Login & Registration flow
- [ ] Day 2: Dashboard & Profile pages
- [ ] Day 3: Symptoms & History pages
- [ ] Day 4: Appointments & Admin pages
- [ ] Day 5: Error scenarios

### Week 3: Performance & Polish
- [ ] Day 1-2: Performance benchmarks
- [ ] Day 3: Error handling edge cases
- [ ] Day 4: UI/UX validation
- [ ] Day 5: Final sign-off

---

## Test Execution Environment

### Backend Requirements
```bash
# Running backend
cd backend/api
python app_backend.py

# Verify endpoints:
curl http://localhost:5000/auth/login
curl http://localhost:5000/users/profile
```

### Frontend Requirements
```bash
# Running frontend
npm run dev

# API base URL
VITE_API_BASE_URL=http://localhost:5000
```

### Testing Tools
- **Manual Testing:** Browser DevTools, Postman
- **Automated Testing:** Jest, React Testing Library (optional)
- **API Testing:** Postman Collection (smarthealth.postman_collection.json)

---

## Test Case Priority

### 🔴 CRITICAL (Must Pass)
- Login/Authentication
- Get Profile
- Record/Get Vitals
- Create/Cancel Appointments
- Dashboard loads without errors
- AI Analysis works

### 🟡 HIGH (Should Pass)
- Form submission
- Alert management
- Doctor search
- History viewing
- Error handling
- Session management

### 🟢 LOW (Nice to Have)
- Admin functions
- Activity tracking
- Advanced filtering
- Export functionality

---

## Sign-Off Criteria

**Integration Complete When:**
- [ ] All critical tests pass
- [ ] No undefined errors in console
- [ ] All pages load with real data
- [ ] Error messages user-friendly
- [ ] Token refresh working
- [ ] Pagination functional
- [ ] Performance acceptable (<3s load time)
- [ ] No mock data imports remaining (except for reference)
- [ ] Documentation updated
- [ ] Ready for UAT

---

## Regression Test Checklist

Before release, verify:
- [ ] Login flow unchanged
- [ ] Dashboard displays correctly
- [ ] Profile CRUD operations work
- [ ] Vitals recording functional
- [ ] Appointments can be booked
- [ ] Alerts display properly
- [ ] Forms submit correctly
- [ ] Symptoms analyzed correctly
- [ ] No console errors
- [ ] No memory leaks

