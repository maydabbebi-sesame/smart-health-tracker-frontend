# Component Integration Guide

This guide shows how to update frontend pages to use the new real API services.

## Pattern: Service Integration

All services now return a consistent response format:
```javascript
{
  success: boolean,
  data?: T,
  error?: string
}
```

## Page Integration Examples

### 1. LoginPage.jsx

**Before (Mock):**
```javascript
// Using fake JWT
import { loginWithFakeJwt } from '../features/auth/auth'

const handleLogin = async () => {
  const token = loginWithFakeJwt({ email, password })
  navigate('/dashboard')
}
```

**After (Real API):**
```javascript
import { login } from '../services/authService'

const handleLogin = async () => {
  setLoading(true)
  const result = await login(email, password)
  
  if (result.success) {
    // Token already stored by service
    navigate('/dashboard')
  } else {
    setError(result.error)
  }
  setLoading(false)
}
```

---

### 2. RegisterPage.jsx

**Before (Mock):**
```javascript
// Just create fake JWT
const handleRegister = async () => {
  loginWithFakeJwt({ name, email, role: 'user' })
  navigate('/dashboard')
}
```

**After (Real API):**
```javascript
import { register, verifyEmail } from '../services/authService'

const handleRegister = async () => {
  // Step 1: Register
  const registerResult = await register(name, email, password)
  if (!registerResult.success) {
    setError(registerResult.error)
    return
  }

  // Step 2: Wait for email verification
  setWaitingForVerification(true)
  // User receives code via email
}

const handleVerifyEmail = async () => {
  const verifyResult = await verifyEmail(email, verificationCode)
  if (verifyResult.success) {
    navigate('/login')
  } else {
    setError(verifyResult.error)
  }
}
```

---

### 3. DashboardPage.jsx

**Before (Mock):**
```javascript
import { getDashboardSummary, getDashboardCharts } from '../services/dashboardService'

useEffect(() => {
  getDashboardSummary().then(data => {
    setStats(data.stats)
  })
  getDashboardCharts().then(data => {
    setCharts(data)
  })
}, [])
```

**After (Real API - Same usage pattern!):**
```javascript
// Code is EXACTLY the same - now uses real API
import { getDashboardSummary, getDashboardCharts } from '../services/dashboardService'

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    
    const [summaryRes, chartsRes] = await Promise.all([
      getDashboardSummary(),
      getDashboardCharts(),
    ])

    if (summaryRes.success) {
      setStats(summaryRes.data.stats)
    } else {
      setError(summaryRes.error)
    }

    if (chartsRes.success) {
      setCharts(chartsRes.data)
    }

    setLoading(false)
  }

  fetchData()
}, [])
```

---

### 4. ProfilePage.jsx

**Before (Mock):**
```javascript
import { getPatientProfile } from '../services/profileService'

useEffect(() => {
  getPatientProfile().then(profile => {
    setProfile(profile)
  })
}, [])
```

**After (Real API):**
```javascript
import { getPatientProfile, updateUserProfile } from '../services/profileService'

// Fetch profile
useEffect(() => {
  const fetchProfile = async () => {
    const result = await getPatientProfile()
    if (result.success) {
      setProfile(result.data)
    } else {
      setError(result.error)
    }
  }
  fetchProfile()
}, [])

// Update profile
const handleSaveProfile = async () => {
  const result = await updateUserProfile({
    name: formData.name,
    email: formData.email,
    bio: formData.bio,
    phone: formData.phone,
  })

  if (result.success) {
    showSuccess('Profile updated successfully')
    setProfile(result.data)
  } else {
    setError(result.error)
  }
}
```

---

### 5. SymptomsPage.jsx

**Before (Mock):**
```javascript
import { analyzeSymptoms } from '../services/symptomService'

const handleSubmit = async (formData) => {
  const result = await analyzeSymptoms(formData)
  setAnalysis(result.analysis)
}
```

**After (Real API):**
```javascript
import { submitSymptomAnalysis } from '../services/symptomService'

const handleSubmit = async (formData) => {
  setLoading(true)
  
  const result = await submitSymptomAnalysis({
    mainSymptoms: formData.symptoms,
    symptomDuration: formData.duration,
    symptomSeverity: formData.severity,
    chronicDiseases: formData.diseases,
    // ... other fields
  })

  if (result.success) {
    showSuccess('Analysis submitted')
    setAnalysis(result.data.analysis)
    setFormId(result.data.formId)
  } else {
    setError(result.error)
  }
  
  setLoading(false)
}
```

---

### 6. HistoryPage.jsx

**Before (Mock):**
```javascript
import { getHealthHistory } from '../services/healthHistoryService'

useEffect(() => {
  getHealthHistory().then(records => {
    setRecords(records)
  })
}, [])
```

**After (Real API):**
```javascript
import { getHealthHistory } from '../services/healthHistoryService'

useEffect(() => {
  const fetchHistory = async () => {
    const result = await getHealthHistory(page, pageSize)
    
    if (result.success) {
      setRecords(result.data.data)
      setPagination(result.data.pagination)
    } else {
      setError(result.error)
    }
  }
  
  fetchHistory()
}, [page, pageSize])
```

---

### 7. AppointmentsPage.jsx (NEW)

**Implementation example:**
```javascript
import {
  getAppointments,
  createAppointment,
  cancelAppointment,
} from '../services/appointmentsService'
import { getDoctors } from '../services/doctorsService'

// Fetch appointments
useEffect(() => {
  const fetchAppointments = async () => {
    const result = await getAppointments(page, pageSize)
    
    if (result.success) {
      setAppointments(result.data.data)
    }
  }
  
  fetchAppointments()
}, [page])

// Create appointment
const handleCreateAppointment = async (appointmentData) => {
  const result = await createAppointment({
    doctorId: appointmentData.doctorId,
    date: appointmentData.date,
    time: appointmentData.time,
    reason: appointmentData.reason,
    reminderEnabled: true,
  })

  if (result.success) {
    showSuccess('Appointment scheduled')
    setAppointments([...appointments, result.data])
  } else {
    setError(result.error)
  }
}

// Cancel appointment
const handleCancelAppointment = async (appointmentId) => {
  const result = await cancelAppointment(appointmentId, 'Schedule conflict')
  
  if (result.success) {
    setAppointments(appointments.filter(a => a.id !== appointmentId))
  }
}
```

---

### 8. HealthVitalsPage.jsx (NEW)

**Implementation example:**
```javascript
import {
  recordVital,
  getVitals,
  getVitalEvolution,
} from '../services/vitalsService'

// Record new vital
const handleRecordVital = async (vitalData) => {
  const result = await recordVital({
    type: vitalData.type, // 'heart_rate', 'blood_pressure', etc.
    value: vitalData.value,
    notes: vitalData.notes,
  })

  if (result.success) {
    showSuccess(`${vitalData.type} recorded`)
    // Refresh vitals list
    await fetchVitals()
  }
}

// Fetch vitals history
const fetchVitals = async () => {
  const result = await getVitals(page, pageSize)
  
  if (result.success) {
    setVitals(result.data.data)
  }
}

// Get vital trends for charts
const fetchVitalTrend = async (vitalType) => {
  const result = await getVitalEvolution(vitalType, 'week')
  
  if (result.success) {
    renderChart(result.data)
  }
}
```

---

### 9. NotificationsPage.jsx

**Before (Mock):**
```javascript
import { getNotifications } from '../services/notificationService'

useEffect(() => {
  getNotifications().then(data => {
    setNotifications(data)
  })
}, [])
```

**After (Real API):**
```javascript
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
} from '../services/notificationService'
import {
  markAlertAsRead,
  acknowledgeAlert,
} from '../services/alertsService'

// Fetch notifications
useEffect(() => {
  const fetchNotifications = async () => {
    const result = await getNotifications(page, pageSize)
    
    if (result.success) {
      setNotifications(result.data.data)
    }
  }
  
  fetchNotifications()
}, [page])

// Mark as read
const handleMarkAsRead = async (notificationId) => {
  const result = await markAlertAsRead(notificationId)
  
  if (result.success) {
    setNotifications(
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }
}

// Acknowledge critical alert
const handleAcknowledgeAlert = async (alertId) => {
  const result = await acknowledgeAlert(alertId)
  
  if (result.success) {
    showSuccess('Alert acknowledged')
  }
}
```

---

## Error Handling Pattern

Create a reusable error handler:

```javascript
// utils/errorHandler.js
export function handleApiError(error, setError) {
  if (typeof error === 'string') {
    setError(error)
  } else if (error?.error) {
    setError(error.error)
  } else {
    setError('An unexpected error occurred')
  }
}

// In component
const result = await apiCall()
if (!result.success) {
  handleApiError(result, setError)
}
```

---

## Loading States Pattern

```javascript
// Use loading state for async operations
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const fetchData = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const result = await apiService.getData()
    
    if (result.success) {
      setData(result.data)
    } else {
      setError(result.error)
    }
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

## Form Submission Pattern

```javascript
const handleSubmit = async (formData) => {
  // Validate
  if (!isValid(formData)) {
    setValidationErrors(validate(formData))
    return
  }

  // Submit
  setLoading(true)
  setError(null)

  const result = await submitForm(formData)

  if (result.success) {
    // Success feedback
    showSuccess('Form submitted successfully')
    
    // Redirect or reset
    navigate('/success')
  } else {
    // Error feedback
    setError(result.error)
  }

  setLoading(false)
}
```

---

## Testing Checklist for Each Page

- [ ] Verify loading state shows during API call
- [ ] Verify data displays after successful API response
- [ ] Verify error message displays on API failure
- [ ] Verify pagination works correctly
- [ ] Verify form submission sends correct data
- [ ] Verify navigation after successful action
- [ ] Verify empty states when no data
- [ ] Test with network error simulation

---

## Migration Order (Recommended)

1. **AuthPages** - LoginPage, RegisterPage (foundation)
2. **DashboardPage** - Most critical, already similar structure
3. **ProfilePage** - Simple get/update operations
4. **HistoryPage** - List operations
5. **SymptomsPage** - Form + AI analysis
6. **NotificationsPage** - List operations
7. **Appointments** - Requires doctor selection
8. **Health Vitals** - Record + chart operations
9. **Admin Pages** - Last priority

---

## Quick Reference

| Page | Services | Methods |
|------|----------|---------|
| LoginPage | authService | login(), verifyEmail(), verifyMFA() |
| RegisterPage | authService | register(), resendVerificationCode() |
| DashboardPage | dashboardService | getDashboardSummary(), getDashboardCharts() |
| ProfilePage | profileService | getPatientProfile(), updateUserProfile() |
| SymptomsPage | symptomService, formsService | submitSymptomAnalysis() |
| HistoryPage | healthHistoryService | getHealthHistory() |
| Appointments | appointmentsService, doctorsService | getAppointments(), createAppointment(), getDoctors() |
| Vitals | vitalsService | recordVital(), getVitals(), getVitalEvolution() |
| Notifications | notificationService, alertsService | getNotifications(), markAlertAsRead() |

---

## Backend Validation

Before updating pages, ensure backend is running and:
- [ ] All endpoints return proper response format
- [ ] JWT token validation works
- [ ] Pagination is implemented
- [ ] Error responses have `error` field
- [ ] Timestamps are ISO8601 format

Make API calls with Postman first to verify responses match the TypeScript models.
