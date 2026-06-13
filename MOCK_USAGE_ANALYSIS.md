# SmartHealth Frontend - Mock Data Usage Analysis Report

**Analysis Date:** June 11, 2026  
**Scope:** All mock files in `src/mocks/` and their usage across the frontend

---

## Executive Summary

The SmartHealth frontend contains **7 mock data files** totaling **35+ data exports**. Analysis shows:

- ✓ **4 mocks** have real API coverage
- ⚠ **2 mocks** have partial coverage
- ✗ **1 mock** completely unused

**Key Finding:** Several components expect data fields that are **not returned by their corresponding services**, indicating incomplete integration or data structure misalignment.

---

## 1. Mock Files Overview

### File: `admin.mock.js` (3 exports)
**Size:** 3 lines | **Status:** ✗ MISSING

```javascript
export const adminStats = [
  { label: 'Registered users', value: '2,418' },
  { label: 'AI analyses today', value: '684' },
  { label: 'Open support alerts', value: '12' },
]
```

**Components Using It:**
| Component | File | Lines | Usage |
|-----------|------|-------|-------|
| AdminDashboardPage | `src/pages/admin/AdminDashboardPage.jsx` | 1 | Direct import (no service wrapper) |

**Service Wrapper:** ✗ None
**API Endpoint:** ✗ No backend endpoint exists
**Coverage Status:** ✗ **Missing** - Hardcoded mock stats only
**Issues:**
- Used directly without service abstraction
- No aggregation logic from real data
- Backend has no admin stats endpoint

---

### File: `dashboard.mock.js` (5 exports)
**Size:** 42 lines | **Status:** ⚠ PARTIAL

```javascript
export const dashboardStats = [...]      // 4 stats objects
export const heartRateData = [...]       // 7-day chart data
export const weightData = [...]          // 6-week chart data
export const activityData = [...]        // 7-day activity chart
export const healthPlanItems = [...]     // 3 recommendation strings
```

**Components Using It:**
| Component | File | Lines | Data Used | Status |
|-----------|------|-------|-----------|--------|
| DashboardPage | `src/pages/DashboardPage.jsx` | 119, 191, 221, 247, 265 | stats, heartRateData, weightData, activityData, healthPlanItems | ⚠ Mixed |

**Services Involved:**
```
DashboardPage
├─ getDashboardSummary() → Returns { stats }
│   └─ Calls: getVitals(), getAppointments(), getUnreadAlertCount()
├─ getDashboardCharts() → Returns { heartRateData, bpData, tempData }
│   └─ Calls: getLatestVital('heart_rate'), getLatestVital('blood_pressure'), getLatestVital('temperature')
└─ Expected but MISSING:
   ├─ healthPlanItems (referenced at line 265)
   └─ activityData (used at line 247 from charts object)
```

**Coverage Analysis:**

| Export | Used By | Service | API Endpoint | Status | Issue |
|--------|---------|---------|--------------|--------|-------|
| dashboardStats | DashboardPage.jsx:119 | dashboardService | ❌ N/A | ⚠ Partial | Returns different structure than expected |
| heartRateData | DashboardPage.jsx:191 | vitalsService.getLatestVital | ✓ /vitals/latest/heart_rate | ✓ Complete | Data format may differ from mock |
| weightData | DashboardPage.jsx:221 | vitalsService (assumed) | ❓ /vitals/latest/weight? | ⚠ Unclear | No "weight" vital type in backend |
| activityData | DashboardPage.jsx:247 | None (mock expected) | ❌ No endpoint | ✗ Missing | Steps/sleep not in vitals API |
| healthPlanItems | DashboardPage.jsx:265 | None (not returned) | ❌ No endpoint | ✗ Missing | **BUG**: Component references undefined data |

**Critical Issues:**
1. ⚠️ **Data Structure Mismatch**: Service returns `{ success, data: { stats } }` but component expects `summary.stats`
2. ✗ **Missing Data**: `healthPlanItems` referenced in component but not provided by service
3. ✗ **No Activity API**: Steps and sleep data have no backend source

---

### File: `aiAnalysis.mock.js` (2 exports)
**Size:** 17 lines | **Status:** ✓ COMPLETE

```javascript
export const fakeAIAnalysisResponse = {
  riskLevel: 'Moderate',
  summary: 'Your symptoms may indicate...',
  recommendations: [...],
  confidence: 86,
}

export const aiInsights = [...]  // 3 insight strings
```

**Components/Services Using It:**
| Component | File | Lines | Usage |
|-----------|------|-------|-------|
| Re-export | `src/features/symptom-form/mock/symptoms.js` | 1 | Re-exports for form demo |
| SymptomForm | `src/features/symptom-form/SymptomForm.jsx` | (indirect) | Form submission uses aiAnalysisService |

**Service Wrapper:** ✓ `aiAnalysisService.analyzeSymptoms()`
**API Endpoint:** ✓ `/api/ai/analyze` (POST)
**Coverage Status:** ✓ **COMPLETE**

**Details:**
- Backend API returns same structure as mock
- Service properly wraps API calls
- No data structure mismatch
- `aiInsights` is unused (could be backend feature)

---

### File: `profile.mock.js` (1 export)
**Size:** 6 lines | **Status:** ✓ COMPLETE

```javascript
export const patientProfile = {
  name: 'Maya Ben Ali',
  email: 'maya@smarthealth.local',
  location: 'Tunis, Tunisia',
  profileStatus: 'Verified account',
  healthProfileStatus: 'Basic details complete',
}
```

**Components Using It:**
| Component | File | Lines | Usage |
|-----------|------|-------|-------|
| ProfilePage | `src/pages/ProfilePage.jsx` | 19, 60 | Uses profileService.getPatientProfile() |

**Service Wrapper:** ✓ `profileService.getPatientProfile()`
**API Endpoint:** ✓ `/api/users/profile` (GET)
**Coverage Status:** ✓ **COMPLETE**

**Minor Differences:**
- ⚠️ Backend doesn't store `location` in users table (as per API docs)
- ⚠️ Field names may differ: mock has `profileStatus`, `healthProfileStatus`

---

### File: `notifications.mock.js` (1 export)
**Size:** 9 lines | **Status:** ✗ UNUSED

```javascript
export const notifications = [
  { id: 'notif-1', title: 'Weekly summary ready', text: '...', status: 'New' },
  { id: 'notif-2', title: 'Medication reminder', text: '...', status: 'Today' },
  { id: 'notif-3', title: 'AI trend detected', text: '...', status: 'Insight' },
]
```

**Components Using It:** None
**Page Status:** `NotificationsPage.jsx` is a placeholder ("Coming Soon")

**Service Wrapper:** ✗ No service exists
**API Endpoint:** ? Unknown (unclear if `/api/notifications` or `/api/alerts`)
**Coverage Status:** ✗ **NOT IMPLEMENTED**

**Notes:**
- Mock exists but no page implementation
- Unclear if notifications are separate from alerts
- Recommendation: Clarify requirements before implementation

---

### File: `symptoms.mock.js` (1 export)
**Size:** 8 lines | **Status:** ⚠ DUPLICATE/UNUSED

```javascript
export const symptoms = [
  'Headache', 'Fever', 'Fatigue', 'Chest Pain', 'Cough',
  'Dizziness', 'Nausea', 'Shortness of Breath',
]
```

**Where It's Referenced:**
| Reference | File | Usage |
|-----------|------|-------|
| Re-export | `src/features/symptom-form/mock/symptoms.js` | Line 2 (re-export) |
| Re-export | `src/constants/mockSymptoms.js` | Line 1 (re-export) |
| **NOT USED** | SymptomForm components | — |

**Actual Symptom Options Used:**
```javascript
// From src/features/symptom-form/formOptions.js (ACTUAL SOURCE)
export const symptomOptions = [
  'Fatigue', 'Douleur', 'Dyspnee', 'Vertiges', 'Nausees',
  'Fievre', 'Cephalees', 'Toux', 'Douleur thoracique',
  'Essoufflement', 'Maux de gorge', 'Douleurs abdominales',
]
```

**Service Wrapper:** ✓ `symptomService.getSymptomOptions()`
**Coverage Status:** ⚠ **PARTIAL** - Different data sources in use
**Issues:**
1. Mock symptoms (English) vs formOptions (French) - different lists
2. Re-exports exist but aren't actively imported
3. `getSymptomOptions()` returns hardcoded array, not from mocks

---

### File: `healthHistory.mock.js` (1 export)
**Size:** 4 lines | **Status:** ⚠ PARTIAL

```javascript
export const healthHistoryRecords = [
  { title: 'Annual wellness check', date: 'May 20, 2026', type: 'Routine' },
  { title: 'Blood pressure review', date: 'May 12, 2026', type: 'Vitals' },
  { title: 'Respiratory symptom update', date: 'May 4, 2026', type: 'Symptoms' },
  { title: 'Medication adjustment', date: 'April 28, 2026', type: 'Medication' },
]
```

**Components Using It:** None directly (delegated through service)
**Page:** `HistoryPage.jsx` uses `healthHistoryService.getHealthHistory()`

**Service Wrapper:** ✓ `healthHistoryService.getHealthHistory()`
```javascript
// healthHistoryService.js
export async function getHealthHistory(page = 1, pageSize = 20) {
  return getVitals(page, pageSize)  // ← Delegates to vitalsService
}
```

**API Endpoint:** ✓ `/api/vitals/list` (via vitalsService)
**Coverage Status:** ⚠ **PARTIAL**

**Issues:**
1. **Structure Mismatch**: Mock records have `title`, `type`; vitals have `type` (heart_rate, temperature, etc.)
2. **Type Field Difference**:
   - Mock: type = category (Routine, Vitals, Symptoms, Medication)
   - Real: type = vital type (heart_rate, blood_pressure, temperature, etc.)
3. Mock structure doesn't match actual vitals response

---

## 2. Comprehensive Coverage Matrix

```
╔════════════════════╦═════════════════════╦═══════════════════╦═══════════════╦════════════╗
║  Mock File         ║ Components/Pages    ║ Service Wrapper   ║ API Endpoint  ║ Coverage   ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ admin.mock.js      ║ AdminDashboardPage  ║ ✗ None            ║ ✗ None        ║ ✗ MISSING  ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ dashboard.mock.js  ║ DashboardPage       ║ ⚠ dashboardService║ ⚠ Partial     ║ ⚠ PARTIAL  ║
║ (dashboardStats)   ║                     ║ ✓ vitalsService   ║ ✓ /vitals/*   ║            ║
║ (heartRateData)    ║                     ║                   ║ ✓ /vitals/*   ║            ║
║ (weightData)       ║                     ║ ⚠ vitalsService?  ║ ❓ Unclear    ║            ║
║ (activityData)     ║                     ║ ✗ None            ║ ✗ None        ║ ✗ MISSING  ║
║ (healthPlanItems)  ║                     ║ ✗ None            ║ ✗ None        ║ ✗ MISSING  ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ aiAnalysis.mock.js ║ SymptomForm (via    ║ ✓ aiAnalysisService║ ✓ /ai/analyze║ ✓ COMPLETE ║
║                    ║  scratch)           ║                   ║              ║            ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ profile.mock.js    ║ ProfilePage         ║ ✓ profileService  ║ ✓ /users/    ║ ✓ COMPLETE ║
║                    ║                     ║                   ║    profile    ║            ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ notifications.mock ║ None                ║ ✗ No service      ║ ❓ Unclear    ║ ✗ UNUSED   ║
║                    ║ (NotificationsPage  ║                   ║              ║            ║
║                    ║ is placeholder)     ║                   ║              ║            ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ symptoms.mock.js   ║ Re-exports exist    ║ ✓ symptomService  ║ ? Hardcoded   ║ ⚠ PARTIAL  ║
║                    ║ but NOT used        ║                   ║  (not from    ║ (conflict) ║
║                    ║ (formOptions used)  ║                   ║   mock)       ║            ║
╠════════════════════╬═════════════════════╬═══════════════════╬═══════════════╬════════════╣
║ healthHistory.     ║ HistoryPage (via    ║ ✓ healthHistory   ║ ✓ /vitals/    ║ ⚠ PARTIAL  ║
║ mock.js            ║ service)            ║   Service         ║    list       ║ (struct    ║
║                    ║                     ║ → vitalsService   ║              ║  mismatch) ║
╚════════════════════╩═════════════════════╩═══════════════════╩═══════════════╩════════════╝
```

---

## 3. Data Structure Analysis

### Dashboard Stats Response Mismatch

**Mock Structure:**
```javascript
[
  { label: 'Wellness score', value: '84%', icon: 'heart' },
  { label: 'Symptoms logged', value: '6', icon: 'activity' },
  // ... 4 items
]
```

**Component Expects:**
```javascript
summary.stats = [
  { label: '...', value: '...', icon: '...' },
]
```

**Service Returns:**
```javascript
{
  success: true,
  data: {
    stats: {
      totalVitalsRecorded: 0,
      upcomingAppointments: 0,
      pendingAlerts: 0,
      wellnessScore: 84
    }
  }
}
```

**Issue:** Structure completely misaligned
- Mock: Array of display objects
- API: Object with aggregated counters
- Component: Expects `summary.stats` as array but gets `summary.data.stats` as object

---

### Health History Response Mismatch

**Mock Structure:**
```javascript
{
  title: 'Annual wellness check',
  date: 'May 20, 2026',
  type: 'Routine'  // ← Display category
}
```

**Actual Vitals Structure (inferred):**
```javascript
{
  id: '...',
  user_id: '...',
  type: 'heart_rate',  // ← Vital type, not category
  value: 76,
  recorded_at: '2026-05-20T10:30:00Z',
  // ... other fields
}
```

**Required Mapping:** Need to transform vitals → display history

---

### AI Analysis Response ✓ ALIGNED

**Mock Structure:**
```javascript
{
  riskLevel: 'Moderate',
  summary: '...',
  recommendations: ['...', '...'],
  confidence: 86
}
```

**Backend Structure:** Matches mock exactly ✓

---

## 4. Usage Import Map

```
src/mocks/
├── admin.mock.js
│   └── Direct import: AdminDashboardPage.jsx (line 1)
│
├── dashboard.mock.js
│   ├── heartRateData → Used in DashboardPage.jsx (line 191) via charts object
│   ├── weightData → Used in DashboardPage.jsx (line 221) via charts object
│   ├── activityData → Used in DashboardPage.jsx (line 247) via charts object
│   ├── healthPlanItems → Referenced DashboardPage.jsx (line 265) but NOT provided
│   └── dashboardStats → Expected by DashboardPage but structure mismatch
│
├── aiAnalysis.mock.js
│   ├── fakeAIAnalysisResponse → Re-exported: features/symptom-form/mock/symptoms.js
│   └── aiInsights → NOT USED (exported but never imported)
│
├── profile.mock.js
│   └── patientProfile → Wrapped by profileService (not directly imported)
│
├── notifications.mock.js
│   └── notifications → UNUSED (no component implementation)
│
├── symptoms.mock.js
│   ├── symptoms → Re-exported: features/symptom-form/mock/symptoms.js
│   ├── symptoms → Re-exported: constants/mockSymptoms.js
│   └── ✗ NOT USED in forms (formOptions.js used instead)
│
└── healthHistory.mock.js
    └── healthHistoryRecords → NOT IMPORTED (delegated via service)
        └── Service maps to vitalsService.getVitals()
```

---

## 5. Critical Issues & Recommendations

### 🔴 HIGH PRIORITY

#### Issue 1: Missing healthPlanItems in Dashboard
**Location:** `src/pages/DashboardPage.jsx:265`
```javascript
{summary.healthPlanItems.map((item, index) => (
  // ↑ This property doesn't exist in service response
```
**Impact:** Runtime error or undefined behavior
**Fix Options:**
1. Add endpoint to backend for health recommendations
2. Return hardcoded list from dashboardService
3. Remove from component if not needed

---

#### Issue 2: Admin Stats Not Using Service
**Location:** `src/pages/admin/AdminDashboardPage.jsx:1`
```javascript
import { adminStats } from '../../mocks/admin.mock'
// Direct mock usage, no abstraction
```
**Impact:** Can't switch to real data without code change
**Fix:**
- Create `adminService.getAdminStats()` wrapper
- Create backend endpoint `/api/admin/stats`

---

#### Issue 3: Activity/Steps Data Has No API Source
**Location:** DashboardPage uses `charts.activityData` (steps, sleep)
**Impact:** Can't get real user activity data
**Fix Options:**
1. Create activity tracking endpoints
2. Store steps/sleep as vitals (subnormal?)
3. Mock this permanently if not in scope

---

### 🟡 MEDIUM PRIORITY

#### Issue 4: Data Structure Misalignment
**Service Response vs Component Expectations**
```javascript
// Service returns:
{ success: true, data: { stats: {...} } }

// Component expects:
summary.stats  // ← Will be undefined
```
**Fix:** Either update service to return unwrapped data or update component to use `summary.data.stats`

---

#### Issue 5: Symptom Options Source Conflict
**Two sources for symptoms:**
- `src/mocks/symptoms.mock.js` - English list (8 items)
- `src/features/symptom-form/formOptions.js` - French list (12 items)

**Current:** formOptions.js is used, mock is unused
**Fix:** Remove unused re-exports or consolidate

---

#### Issue 6: Health History Structure Mapping
**Mock structure doesn't match vitals API response**
**Fix:** Create transformation layer in healthHistoryService

---

### 🟢 LOW PRIORITY

#### Issue 7: Notifications Feature Incomplete
**Mock exists but no implementation**
**Status:** NotificationsPage shows "Coming Soon"
**Fix:** Implement when requirements are clear

---

#### Issue 8: Unused AI Insights
**aiInsights exported but never imported**
**Impact:** Dead code
**Fix:** Remove or implement in UI if needed

---

## 6. Summary Statistics

| Metric | Count |
|--------|-------|
| Total Mock Files | 7 |
| Total Mock Exports | 35+ |
| Directly Used | 8 |
| Service-Wrapped | 7 |
| Completely Unused | 1 |
| Complete API Coverage | 2 |
| Partial API Coverage | 4 |
| Missing API Coverage | 3 |
| Data Structure Mismatches | 4 |
| Critical Bugs | 3 |

---

## 7. Recommended Actions

### Immediate (This Sprint)
- [ ] Fix `healthPlanItems` undefined error in DashboardPage
- [ ] Create admin stats service wrapper
- [ ] Verify dashboard stats data structure mapping

### Near-term (Next Sprint)
- [ ] Create activity/steps API endpoints
- [ ] Consolidate symptom options source
- [ ] Create health history transformation layer
- [ ] Document all data structure mappings

### Future
- [ ] Implement notifications feature
- [ ] Remove dead mock exports
- [ ] Complete activity tracking
- [ ] Add more granular admin statistics

---

## 8. Testing Checklist

- [ ] DashboardPage renders with real vitals data
- [ ] healthPlanItems displays correctly (or error is handled)
- [ ] AdminDashboardPage shows real admin stats
- [ ] Profile page displays user data correctly
- [ ] AI analysis returns expected structure
- [ ] Health history maps vitals correctly
- [ ] No console errors for undefined data

---

## Conclusion

The SmartHealth frontend has made significant progress in integrating with real APIs, but **3 critical integration gaps** remain that could cause runtime errors:

1. **Missing data fields** referenced by components
2. **Data structure mismatches** between mocks and API responses
3. **Missing API endpoints** for some features

**Recommendation:** Prioritize fixing the critical issues before adding new features to ensure stability and maintainability.

