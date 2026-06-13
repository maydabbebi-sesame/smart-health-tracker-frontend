# Mock Data Coverage Matrix - Quick Reference

## Legend
- ✓ Complete: Real API fully replaces mock
- ⚠ Partial: Service exists but incomplete/misaligned
- ✗ Missing: No real API, still using mock
- — Not Applicable

---

## Master Coverage Matrix

| # | Mock File | Data Export | Components Using | Service | API Endpoint | Status | Issue |
|----|-----------|-------------|------------------|---------|--------------|--------|-------|
| 1 | admin.mock.js | adminStats (3 items) | AdminDashboardPage.jsx | ✗ None | ✗ None | **✗ MISSING** | Direct mock import, no backend |
| 2 | dashboard.mock.js | dashboardStats | DashboardPage.jsx:119 | ⚠ dashboardService | ⚠ Partial | **⚠ PARTIAL** | Structure mismatch |
| 3 | dashboard.mock.js | heartRateData (7 days) | DashboardPage.jsx:191 | ✓ vitalsService | ✓ /vitals/latest/heart_rate | **✓ COMPLETE** | Data aligned |
| 4 | dashboard.mock.js | weightData (6 weeks) | DashboardPage.jsx:221 | ⚠ vitalsService? | ❓ /vitals/latest/weight? | **⚠ UNCLEAR** | No weight vital type |
| 5 | dashboard.mock.js | activityData (7 days) | DashboardPage.jsx:247 | ✗ None | ✗ None | **✗ MISSING** | No steps/sleep API |
| 6 | dashboard.mock.js | healthPlanItems (3 items) | DashboardPage.jsx:265 | ✗ Not returned | ✗ None | **✗ MISSING** | BUG: Undefined reference |
| 7 | aiAnalysis.mock.js | fakeAIAnalysisResponse | SymptomForm (via symptomService) | ✓ aiAnalysisService | ✓ /ai/analyze | **✓ COMPLETE** | Structure matches |
| 8 | aiAnalysis.mock.js | aiInsights (3 strings) | None | — | — | **— UNUSED** | Dead code |
| 9 | profile.mock.js | patientProfile | ProfilePage.jsx:19,60 | ✓ profileService | ✓ /users/profile | **✓ COMPLETE** | Minor field diffs |
| 10 | notifications.mock.js | notifications (3 items) | None | ✗ No service | ❓ /alerts? | **✗ UNUSED** | Placeholder page |
| 11 | symptoms.mock.js | symptoms (8 items) | Re-exports exist | ✗ Not used | ? Hardcoded | **⚠ PARTIAL** | formOptions used instead |
| 12 | healthHistory.mock.js | healthHistoryRecords (4 items) | HistoryPage.jsx (via service) | ✓ healthHistoryService | ✓ /vitals/list | **⚠ PARTIAL** | Struct mismatch |

---

## Status Summary

### ✓ COMPLETE (2 mocks)
- **fakeAIAnalysisResponse** - Full API coverage, aligned structure
- **patientProfile** - Full API coverage, minor field differences

### ⚠ PARTIAL (4 mocks)
- **dashboardStats** - Service exists but structure misaligned
- **heartRateData** - API exists, uncertain data format
- **symptoms.mock** - Conflict: formOptions used instead of mock
- **healthHistoryRecords** - API exists, structure mismatch with display needs

### ✗ MISSING (3 mocks)
- **adminStats** - No backend endpoint, direct mock import
- **activityData** - No API for steps/sleep data
- **healthPlanItems** - Not provided by service (BUG)

### — UNUSED (2 mocks)
- **notifications** - Implementation incomplete
- **aiInsights** - Exported but never imported

---

## Data Structure Mappings

### Dashboard Stats
```
MOCK (array of display objects):
[{ label, value, icon }, ...]

API (aggregated counters):
{ totalVitalsRecorded, upcomingAppointments, pendingAlerts, wellnessScore }

MISMATCH: Array vs Object
FIX: Transform in service or update component
```

### Health History
```
MOCK (user-friendly records):
{ title, date, type: 'Routine'|'Vitals'|'Symptoms'|'Medication' }

API (vitals data):
{ id, type: 'heart_rate'|'blood_pressure'|..., value, recorded_at }

MISMATCH: Display category vs vital type
FIX: Transformation layer needed
```

### AI Analysis ✓ ALIGNED
```
MOCK:
{ riskLevel, summary, recommendations: [], confidence }

API:
{ riskLevel, summary, recommendations: [], confidence }

STATUS: Perfect match ✓
```

### Profile
```
MOCK:
{ name, email, location, profileStatus, healthProfileStatus }

API:
{ id, name, email, phone, ... } (no location field)

MISMATCH: Minor - location not in backend
FIX: Remove or get from separate endpoint
```

---

## Component Usage Breakdown

### DashboardPage.jsx
| Line | Data Used | Source | Service | Status |
|------|-----------|--------|---------|--------|
| 119 | summary.stats | Mock/API | dashboardService | ⚠ Structure issue |
| 191 | charts.heartRateData | API | vitalsService | ✓ Complete |
| 221 | charts.weightData | API | vitalsService | ⚠ Unclear |
| 247 | charts.activityData | Mock? | None | ✗ Missing |
| 265 | summary.healthPlanItems | — | None returned | ✗ BUG |

### AdminDashboardPage.jsx
| Line | Data Used | Source | Service | Status |
|------|-----------|--------|---------|--------|
| 1-5 | adminStats | Mock | None | ✗ Direct import |

### ProfilePage.jsx
| Line | Data Used | Source | Service | Status |
|------|-----------|--------|---------|--------|
| 19,60 | patientProfile | API | profileService | ✓ Complete |

### HistoryPage.jsx
| Line | Data Used | Source | Service | Status |
|------|-----------|--------|---------|--------|
| ~25 | healthHistoryRecords | API (vitals) | healthHistoryService | ⚠ Struct mismatch |

### SymptomForm Components
| Component | Data Used | Source | Service | Status |
|-----------|-----------|--------|---------|--------|
| StepSymptoms.jsx | symptomOptions | formOptions.js | — | ✓ Working |
| All steps | formOptions | formOptions.js | — | ✓ Working |

---

## Service-to-API Mapping

```
adminDashboardPage
└─ DIRECT IMPORT (admin.mock.js)
   └─ NO SERVICE
   └─ NO API

DashboardPage
├─ getDashboardSummary()
│  ├─ getVitals() → /vitals/list
│  ├─ getAppointments() → /appointments/list
│  └─ getUnreadAlertCount() → /alerts
├─ getDashboardCharts()
│  ├─ getLatestVital('heart_rate') → /vitals/latest/heart_rate
│  ├─ getLatestVital('blood_pressure') → /vitals/latest/blood_pressure
│  └─ getLatestVital('temperature') → /vitals/latest/temperature
└─ MISSING:
   ├─ Activity data source
   └─ Health plan items source

ProfilePage
└─ getPatientProfile() → /users/profile

HistoryPage
└─ getHealthHistory() → vitalsService.getVitals() → /vitals/list

SymptomForm
└─ symptomService.analyzeSymptoms() → /ai/analyze
```

---

## Critical Bugs Found

| Bug ID | Location | Severity | Description | Fix |
|--------|----------|----------|-------------|-----|
| BUG-001 | DashboardPage:265 | 🔴 HIGH | References `summary.healthPlanItems` which is undefined | Add field to service or remove from component |
| BUG-002 | AdminDashboardPage | 🔴 HIGH | Direct mock import instead of service abstraction | Create adminService wrapper |
| BUG-003 | DashboardPage | 🔴 HIGH | Data structure mismatch (dashboardStats) | Align API response with expected format |
| BUG-004 | DashboardPage | 🟡 MEDIUM | Activity data has no backend source | Create activity API or mock properly |
| BUG-005 | HealthHistory | 🟡 MEDIUM | Mock structure doesn't match vitals response | Create transformation layer |

---

## Quick Fixes

### Fix 1: Add healthPlanItems to DashboardService
```javascript
// Option A: Add backend endpoint
export async function getDashboardSummary() {
  // ... existing code ...
  
  const [vitalsRes, appointmentsRes, alertsRes, planRes] = await Promise.all([
    getVitals(),
    getAppointments(),
    getUnreadAlertCount(),
    getHealthPlan(),  // ← ADD THIS
  ])
  
  return {
    success: true,
    data: {
      stats: {...},
      healthPlanItems: planRes.data || []
    }
  }
}

// Option B: Mock it for now
export async function getDashboardSummary() {
  // ... existing code ...
  
  const healthPlanItems = [
    'Log evening symptoms',
    'Review medication reminder',
    'Check elevated temperature trend',
  ]
  
  return {
    success: true,
    data: {
      stats: {...},
      healthPlanItems
    }
  }
}
```

### Fix 2: Create Admin Service
```javascript
// src/services/adminService.js
import { apiClient } from './apiClient'

export async function getAdminStats() {
  try {
    const response = await apiClient.get('/admin/stats')
    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: 'Failed to fetch admin stats' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Then update AdminDashboardPage.jsx to use service
import { useQuery } from '@tanstack/react-query'
import { getAdminStats } from '../services/adminService'

function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })
  
  return (
    // ... render data.data instead of adminStats
  )
}
```

### Fix 3: Fix Data Structure Response
```javascript
// dashboardService.js - Update response structure
export async function getDashboardSummary() {
  try {
    // ... existing fetches ...
    
    const stats = [
      { label: 'Total vitals', value: vitalsRes.data?.pagination?.total || 0, icon: 'activity' },
      { label: 'Appointments', value: appointmentsRes.data?.pagination?.total || 0, icon: 'calendar' },
      { label: 'Pending alerts', value: alertsRes.data?.count || 0, icon: 'bell' },
      { label: 'Wellness score', value: `${wellnessScore}%`, icon: 'heart' },
    ]
    
    return {
      success: true,
      data: stats  // ← Return array directly, not { stats: ... }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// DashboardPage.jsx - Update usage
const { data: summary } = useQuery({
  queryKey: ['dashboard-summary'],
  queryFn: getDashboardSummary,
})

// Now use summary directly (it's an array)
{summary.map(stat => ...)}
```

---

## Files to Update

### High Priority
- [ ] `src/pages/DashboardPage.jsx` - Fix data structure usage
- [ ] `src/services/dashboardService.js` - Add missing fields & fix structure
- [ ] `src/pages/admin/AdminDashboardPage.jsx` - Use service instead of mock
- [ ] `src/services/adminService.js` - Create (doesn't exist)

### Medium Priority
- [ ] `src/services/healthHistoryService.js` - Add transformation logic
- [ ] `src/constants/mockSymptoms.js` - Remove unused re-export
- [ ] `src/features/symptom-form/mock/symptoms.js` - Clean up unused imports

### Low Priority
- [ ] `src/services/notificationService.js` - Create when feature is ready
- [ ] `src/mocks/aiAnalysis.mock.js` - Remove aiInsights export

---

## Testing Recommendations

### Unit Tests
```javascript
// Test data structure transformations
test('dashboardService returns correct stat structure', async () => {
  const result = await getDashboardSummary()
  expect(result.data).toHaveProperty('healthPlanItems')
  expect(Array.isArray(result.data.stats)).toBe(true)
})

// Test health history mapping
test('healthHistoryService maps vitals correctly', async () => {
  const result = await getHealthHistory()
  result.data.forEach(record => {
    expect(record).toHaveProperty('title')
    expect(record).toHaveProperty('date')
    expect(record).toHaveProperty('type')
  })
})
```

### Integration Tests
```javascript
// Test DashboardPage renders with real data
test('DashboardPage renders all sections with real data', async () => {
  const { getByText } = render(<DashboardPage />)
  await waitFor(() => {
    expect(getByText(/Wellness score/)).toBeInTheDocument()
    expect(getByText(/Prochains rendez-vous/)).toBeInTheDocument()
  })
})
```

---

## Documentation Updates Needed

- [ ] API Response Format Guide (for each endpoint)
- [ ] Mock vs API Data Structure Mapping
- [ ] Service Layer Architecture
- [ ] Component Data Flow Diagram
- [ ] Migration Checklist for Remaining Mocks

---

