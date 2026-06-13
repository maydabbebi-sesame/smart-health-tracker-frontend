# SmartHealth Mock Data - Visual Summary & Diagrams

## 1. Coverage Status at a Glance

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 MOCK COVERAGE SUMMARY                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                         ┃
┃  ✓ COMPLETE        2 mocks   ████░░░░░░░  28%        ┃
┃  ⚠ PARTIAL         4 mocks   ██████████░░  57%        ┃
┃  ✗ MISSING         3 mocks   ██░░░░░░░░░░  43%        ┃
┃                                                         ┃
┃  CRITICAL ISSUES:  3 bugs found                       ┃
┃  DATA MISMATCHES:  4 structure differences             ┃
┃  UNUSED MOCKS:     2 exports                           ┃
┃                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 2. Mock Files Status Overview

```
Mock File Name              Exports   Coverage   Status    Priority
────────────────────────────────────────────────────────────────────
admin.mock.js               3         ✗ 0%      MISSING   🔴 HIGH
aiAnalysis.mock.js          2         ✓ 100%    COMPLETE  ✓ OK
dashboard.mock.js           5         ⚠ 40%     PARTIAL   🔴 HIGH
healthHistory.mock.js       1         ⚠ 50%     PARTIAL   🟡 MED
notifications.mock.js       1         ✗ 0%      UNUSED    🟢 LOW
profile.mock.js             1         ✓ 100%    COMPLETE  ✓ OK
symptoms.mock.js            1         ⚠ 0%      CONFLICT  🟡 MED
────────────────────────────────────────────────────────────────────
TOTAL                       14        ⚠ 42%     MIXED     
```

---

## 3. Component → Service → API Flow

### ✓ Fully Integrated (ProfilePage)
```
ProfilePage.jsx
    ↓
    └─→ profileService.getPatientProfile()
        ↓
        └─→ apiClient.get('/api/users/profile')
            ↓
            └─→ Backend: /api/users/{id}
                ✓ Returns: { id, name, email, ... }
                ✓ Structure: Matches mock
```

### ✓ Fully Integrated (AIAnalysisPage)
```
SymptomForm.jsx
    ↓
    └─→ symptomService.analyzeSymptoms()
        ↓
        └─→ aiAnalysisService.analyzeSymptoms()
            ↓
            └─→ apiClient.post('/api/ai/analyze', payload)
                ✓ Returns: { riskLevel, summary, recommendations, confidence }
                ✓ Structure: Matches mock exactly
```

### ⚠ Partially Integrated (DashboardPage) - 🔴 ISSUES
```
DashboardPage.jsx
    ├─→ getDashboardSummary()
    │   ├─→ getVitals()
    │   │   └─→ /api/vitals/list ✓
    │   ├─→ getAppointments()
    │   │   └─→ /api/appointments/list ✓
    │   └─→ getUnreadAlertCount()
    │       └─→ /api/alerts ✓
    │   └─→ Returns: { stats: {...} }
    │       ⚠ healthPlanItems MISSING ❌
    │       ⚠ stats structure MISMATCHED ❌
    │
    ├─→ getDashboardCharts()
    │   ├─→ getLatestVital('heart_rate')
    │   │   └─→ /api/vitals/latest/heart_rate ✓
    │   ├─→ getLatestVital('blood_pressure')
    │   │   └─→ /api/vitals/latest/blood_pressure ✓
    │   └─→ getLatestVital('temperature')
    │       └─→ /api/vitals/latest/temperature ✓
    │   └─→ Returns: { heartRateData, bpData, tempData }
    │       ✓ heartRateData exists
    │       ⚠ weightData MISSING ❌
    │       ⚠ activityData MISSING ❌
    │
    └─→ Component references:
        ├─ summary.stats (line 119) ❌ Structure mismatch
        ├─ charts.heartRateData (line 191) ✓ Works
        ├─ charts.weightData (line 221) ⚠ Unclear source
        ├─ charts.activityData (line 247) ❌ No API
        └─ summary.healthPlanItems (line 265) ❌ UNDEFINED
```

### ✗ Not Integrated (AdminDashboardPage)
```
AdminDashboardPage.jsx
    ├─ DIRECT IMPORT: import { adminStats } from '../../mocks/admin.mock'
    ├─ NO SERVICE LAYER
    ├─ NO API CALL
    └─ Status: Mock data only 🔴
```

### ⚠ Partially Integrated (HistoryPage)
```
HistoryPage.jsx
    ↓
    └─→ getHealthHistory()
        ↓
        └─→ getVitals() [from vitalsService]
            ↓
            └─→ /api/vitals/list
                ✓ Returns: { id, type, value, recorded_at, ... }
                ⚠ Structure: Doesn't match display mock
                   Mock expects: { title, date, type: 'Routine' }
                   API returns: { type: 'heart_rate', value: 76 }
```

---

## 4. Data Flow Diagram: Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                        DashboardPage                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┬──────────────────────────────────┐    │
│  │  useQuery hooks     │  Data requirements               │    │
│  ├─────────────────────┼──────────────────────────────────┤    │
│  │ summary             │ .stats[]                         │    │
│  │                     │ .healthPlanItems[]               │    │
│  │                     │ .wellnessScore                   │    │
│  ├─────────────────────┼──────────────────────────────────┤    │
│  │ charts              │ .heartRateData                   │    │
│  │                     │ .weightData                      │    │
│  │                     │ .activityData                    │    │
│  └─────────────────────┴──────────────────────────────────┘    │
│              ↓                           ↓                      │
│      ┌──────────────────┐       ┌───────────────────┐           │
│      │getDashboardSummary│       │getDashboardCharts │          │
│      └──────────────────┘       └───────────────────┘          │
│              ↓                           ↓                      │
│  ┌────────────────────────┐  ┌──────────────────────────┐      │
│  │  Calls:                │  │  Calls:                  │      │
│  │ • getVitals()          │  │ • getLatestVital()       │      │
│  │ • getAppointments()    │  │   - heart_rate           │      │
│  │ • getUnreadAlertCount()│  │   - blood_pressure       │      │
│  └────────────────────────┘  │   - temperature          │      │
│              ↓                │                          │      │
│  ┌────────────────────────┐  └──────────────────────────┘      │
│  │  API Responses:        │           ↓                        │
│  │ ✓ vitals count         │  ┌──────────────────────────┐     │
│  │ ✓ appointments count   │  │  API Responses:          │     │
│  │ ✓ alerts count         │  │ ✓ heartRateData array    │     │
│  │ ⚠ NO healthPlanItems  │  │ ⚠ NO weightData          │     │
│  └────────────────────────┘  │ ✗ NO activityData        │     │
│                              └──────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

RENDERING:
├─ Greeting
├─ Wellness Score (from wellnessScore) ✓
├─ Stats Cards (from summary.stats) ⚠ STRUCTURE MISMATCH
├─ Alert Section (hardcoded mock text)
├─ Heart Rate Chart (from charts.heartRateData) ✓
├─ Weight Chart (from charts.weightData) ⚠ MISSING
├─ Activity Chart (from charts.activityData) ✗ MISSING
└─ Health Plan Items (from summary.healthPlanItems) ✗ UNDEFINED
```

---

## 5. Service Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend Services                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ✓ profileService                                        │
│    └─→ getPatientProfile() → /users/profile              │
│                                                           │
│  ✓ aiAnalysisService                                     │
│    └─→ analyzeSymptoms() → /ai/analyze                   │
│                                                           │
│  ⚠ dashboardService                                      │
│    ├─→ getDashboardSummary() → Multiple endpoints        │
│    │   ⚠ Missing healthPlanItems                         │
│    └─→ getDashboardCharts() → Multiple vitals endpoints  │
│        ⚠ Missing weightData, activityData                │
│                                                           │
│  ⚠ vitalsService                                         │
│    ├─→ getVitals() → /vitals/list ✓                     │
│    ├─→ getLatestVital() → /vitals/latest/{type} ✓       │
│    └─→ (No activity/steps endpoints)                     │
│                                                           │
│  ⚠ healthHistoryService                                  │
│    └─→ getHealthHistory() → /vitals/list                │
│        └─→ ⚠ Needs transformation (struct mismatch)     │
│                                                           │
│  ✗ adminService (DOESN'T EXIST)                         │
│    └─→ Needed: getAdminStats() → /admin/stats           │
│                                                           │
│  ✗ notificationService (DOESN'T EXIST)                  │
│    └─→ Needed: getNotifications() → /notifications?     │
│                                                           │
│  ✓ appointmentsService                                   │
│    └─→ getAppointments() → /appointments/list ✓         │
│                                                           │
│  ✓ alertsService                                         │
│    └─→ getUnreadAlertCount() → /alerts ✓               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Mock Import Map

```
src/mocks/
│
├── admin.mock.js
│   │   [adminStats × 3]
│   │
│   └─→ IMPORT CHAIN:
│       └─→ AdminDashboardPage.jsx (line 1)
│           └─→ DIRECT: No service, used directly ✗
│
├── aiAnalysis.mock.js
│   │   [fakeAIAnalysisResponse, aiInsights × 3]
│   │
│   └─→ IMPORT CHAIN:
│       ├─→ features/symptom-form/mock/symptoms.js
│       │   ├─→ SymptomForm.jsx (via service only)
│       │   └─→ NOT DIRECTLY USED ✓
│       └─→ aiAnalysisService.js
│           └─→ USES: fakeAIAnalysisResponse structure reference
│               └─→ ACTUAL DATA: From /api/ai/analyze ✓
│
├── dashboard.mock.js
│   │   [dashboardStats, heartRateData, weightData, activityData, healthPlanItems]
│   │
│   └─→ IMPORT CHAIN:
│       └─→ DashboardPage.jsx (indirect via service)
│           ├─→ dashboardService.getDashboardSummary()
│           │   └─→ Calls: getVitals(), getAppointments(), getUnreadAlertCount()
│           │       └─→ ⚠ Does NOT return healthPlanItems ✗
│           └─→ dashboardService.getDashboardCharts()
│               └─→ Calls: getLatestVital('heart_rate', etc)
│                   └─→ ⚠ Does NOT return activityData, weightData ✗
│
├── healthHistory.mock.js
│   │   [healthHistoryRecords × 4]
│   │
│   └─→ IMPORT CHAIN:
│       └─→ healthHistoryService.getHealthHistory()
│           └─→ vitalsService.getVitals()
│               └─→ /api/vitals/list
│                   └─→ ⚠ Structure differs from mock ⚠
│
├── notifications.mock.js
│   │   [notifications × 3]
│   │
│   └─→ IMPORT CHAIN:
│       └─→ NOWHERE (NotificationsPage is placeholder)
│           └─→ ✗ NOT USED
│
├── profile.mock.js
│   │   [patientProfile]
│   │
│   └─→ IMPORT CHAIN:
│       └─→ profileService.getPatientProfile()
│           └─→ /api/users/profile
│               └─→ ✓ Structure match (minor diffs)
│
└── symptoms.mock.js
    │   [symptoms × 8]
    │
    └─→ IMPORT CHAIN:
        ├─→ features/symptom-form/mock/symptoms.js
        │   └─→ ✗ NOT USED
        ├─→ constants/mockSymptoms.js
        │   └─→ ✗ NOT USED
        └─→ formOptions.js (DIFFERENT SOURCE)
            └─→ ✓ ACTUALLY USED (French list, not mock)
```

---

## 7. Critical Issue Locations

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              CRITICAL BUGS - EXACT LOCATIONS              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔴 BUG-001: Undefined healthPlanItems
   ├─ File: src/pages/DashboardPage.jsx
   ├─ Line: 265
   ├─ Code: {summary.healthPlanItems.map((item, index) => (
   ├─ Issue: summary.healthPlanItems is undefined
   ├─ Root: dashboardService.getDashboardSummary() doesn't return it
   └─ Fix: Add to service response or remove from component

🔴 BUG-002: Direct Mock Import (No Service)
   ├─ File: src/pages/admin/AdminDashboardPage.jsx
   ├─ Line: 1
   ├─ Code: import { adminStats } from '../../mocks/admin.mock'
   ├─ Issue: No service abstraction layer
   ├─ Root: No adminService exists, no backend endpoint
   └─ Fix: Create adminService & backend endpoint

🔴 BUG-003: Data Structure Mismatch
   ├─ File: src/services/dashboardService.js (getDashboardSummary)
   ├─ Problem: Returns { success, data: { stats: {...} } }
   ├─ Expected: Component uses summary.stats directly
   ├─ Issue: Response wrapper vs direct access
   └─ Fix: Either unwrap in service or update component access

⚠️  BUG-004: Missing Activity Data Source
   ├─ File: src/pages/DashboardPage.jsx
   ├─ Line: 247
   ├─ Code: <BarChart data={charts.activityData} ... />
   ├─ Issue: charts.activityData has no backend source
   ├─ Root: No /api endpoint for steps/sleep
   └─ Fix: Create activity tracking or use mock

⚠️  BUG-005: Missing Weight Data
   ├─ File: src/pages/DashboardPage.jsx
   ├─ Line: 221
   ├─ Code: <LineChart data={charts.weightData} ... />
   ├─ Issue: Unclear if weight is fetched from vitals
   ├─ Root: No explicit /vitals/latest/weight endpoint
   └─ Fix: Verify vitals API or create weight endpoint

⚠️  BUG-006: Health History Structure Mismatch
   ├─ File: src/services/healthHistoryService.js
   ├─ Problem: Vitals API structure ≠ Display mock structure
   ├─ API: { type: 'heart_rate', value: 76, recorded_at }
   ├─ Mock: { title: 'Check-up', date: '2026-05-20', type: 'Routine' }
   └─ Fix: Transform vitals → display format
```

---

## 8. Service vs Mock Comparison

### Profile Service ✓ COMPLETE
```javascript
// Mock (src/mocks/profile.mock.js)
{
  name: 'Maya Ben Ali',
  email: 'maya@smarthealth.local',
  location: 'Tunis, Tunisia',
  profileStatus: 'Verified account',
  healthProfileStatus: 'Basic details complete'
}

// Service calls API
profileService.getPatientProfile()
  └─→ GET /users/profile
  └─→ Returns similar structure ✓

STATUS: ✓ Equivalent
```

### Dashboard Stats ⚠ MISMATCHED
```javascript
// Mock (src/mocks/dashboard.mock.js)
[
  { label: 'Wellness score', value: '84%', icon: 'heart' },
  { label: 'Symptoms logged', value: '6', icon: 'activity' },
  { label: 'Unread alerts', value: '3', icon: 'bell' },
  { label: 'Latest temperature', value: '37.1 C', icon: 'temperature' }
]

// Service calculates from API
dashboardService.getDashboardSummary()
  ├─→ getVitals() → count
  ├─→ getAppointments() → count
  ├─→ getUnreadAlertCount() → count
  └─→ calculateWellnessScore()
  └─→ Returns { totalVitalsRecorded, upcomingAppointments, pendingAlerts, wellnessScore }

ISSUE: ⚠ Array vs Object structure
      ⚠ Display objects vs raw counts
      ⚠ healthPlanItems missing

STATUS: ⚠ Misaligned
```

### Admin Stats ✗ NOT INTEGRATED
```javascript
// Mock (src/mocks/admin.mock.js)
[
  { label: 'Registered users', value: '2,418' },
  { label: 'AI analyses today', value: '684' },
  { label: 'Open support alerts', value: '12' }
]

// Service: DOESN'T EXIST
❌ No adminService
❌ No /admin/stats endpoint
❌ Direct import used instead

STATUS: ✗ Missing
```

---

## 9. Integration Timeline

```
PHASE 1: ✓ COMPLETE
├─ Profile Service        ✓ Done
└─ AI Analysis Service    ✓ Done
  
PHASE 2: ⚠ IN PROGRESS
├─ Dashboard Service      ⚠ Partial (missing healthPlanItems, activity)
├─ Health History Service ⚠ Partial (structure mismatch)
├─ Vitals Service         ✓ Done
├─ Appointments Service   ✓ Done
└─ Alerts Service         ✓ Done

PHASE 3: ✗ NOT STARTED
├─ Admin Service          ✗ Missing
├─ Notifications Service  ✗ Missing
└─ Activity Service       ✗ Missing

BLOCKERS:
├─ BUG-001: healthPlanItems undefined
├─ BUG-002: Admin stats no backend
├─ BUG-004: Activity data no API
└─ Data structure mismatches
```

---

## 10. Recommended Priority Actions

### 🔴 TODAY (Critical)
```
1. Fix undefined healthPlanItems reference
   └─→ Add to dashboardService response

2. Create adminService wrapper
   └─→ Isolate mock usage, enable backend switch

3. Fix dashboardService response structure
   └─→ Align stats format with component expectations
```

### 🟡 THIS WEEK (High)
```
4. Create activity data API endpoints
   └─→ Or properly mock for now

5. Map health history vitals → display format
   └─→ Transform in healthHistoryService

6. Consolidate symptom options sources
   └─→ Remove unused mock re-exports
```

### 🟢 NEXT WEEK (Medium)
```
7. Implement notifications service
   └─→ When feature is ready

8. Remove dead code (unused aiInsights, etc)
   └─→ Clean up mock files

9. Document all API response formats
   └─→ Prevention guide for future integration
```

---

## Legend & Notes

| Symbol | Meaning |
|--------|---------|
| ✓ | Complete integration, works correctly |
| ⚠ | Partial/misaligned, needs work |
| ✗ | Missing or not integrated |
| — | Not applicable |
| 🔴 | High priority (critical issue) |
| 🟡 | Medium priority (important) |
| 🟢 | Low priority (nice to have) |

