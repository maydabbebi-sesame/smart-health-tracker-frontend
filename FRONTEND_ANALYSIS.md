# Frontend React Application - Comprehensive Structure Analysis

## 1. PAGES OVERVIEW (`src/pages/`)

### Core Pages

| Page | Component | Purpose | Data Models Used |
|------|-----------|---------|------------------|
| **DashboardPage.jsx** | Main user dashboard | Displays wellness summary, heart rate trends, weight tracking, activity metrics, and health plan items. Uses React Query to fetch dashboard data. | `dashboardStats`, `heartRateData`, `weightData`, `activityData`, `healthPlanItems` |
| **LoginPage.jsx** | Authentication entry | Fake JWT login with email/role-based access control. Admin login via `admin@smarthealth.local`. | `{ email, role }` |
| **RegisterPage.jsx** | User registration | Creates new user account with fake JWT. | `{ email, name }` |
| **SymptomsPage.jsx** | Symptom logging form | Multi-step form for logging patient health data including personal info, vitals, medical history, treatments, symptoms, and lifestyle. Integrates with MediAssist AI analysis. | Complex Zod schema with 50+ fields (see below) |
| **ProfilePage.jsx** | Patient profile & history | Displays patient info, medical history, vaccinations, and health details. Tab-based navigation. | `patientProfile`, `healthDetails`, `medicalHistory`, `vaccinations` |
| **HistoryPage.jsx** | Medical history records | Centralized view of past medical events (visits, vitals, symptoms, medications). Categorized by type. | `healthHistoryRecords` |
| **AIAnalysisPage.jsx** | AI recommendations & chat | Multi-priority alert display with MediAssist conversational AI. Renders analyzed symptoms with priority levels (haute/moyenne/basse). | `fakeAIAnalysisResponse`, `aiInsights`, chatbot output |
| **NotificationsPage.jsx** | Doctor Agent placeholder | Coming soon - indicates future real-time notifications feature. | N/A - stub page |
| **SettingsPage.jsx** | User preferences | Notification settings, privacy controls, theme preferences. | Hardcoded UI options |
| **AdminDashboardPage.jsx** | Admin monitoring | Optional isolated area showing registered users, AI analyses, and support alerts. | `adminStats` |

---

## 2. MOCK DATA FILES (`src/mocks/`)

### dashboard.mock.js
```javascript
dashboardStats: [
  { label, value, icon: 'heart'|'activity'|'bell'|'temperature' }
]
heartRateData: [ { day, bpm } ]  // 7 days
weightData: [ { week, weight } ]  // 6 weeks
activityData: [ { day, steps, sleep } ]  // 7 days
healthPlanItems: [ string ]  // 3 items
```

### symptoms.mock.js
```javascript
symptoms: [string]  // 8 basic symptoms like 'Headache', 'Fever', etc.
```

### profile.mock.js
```javascript
patientProfile: {
  name: string,
  email: string,
  location: string,
  profileStatus: string,
  healthProfileStatus: string,
}
```

### notifications.mock.js
```javascript
notifications: [
  {
    id: string,
    title: string,
    text: string,
    status: 'New' | 'Today' | 'Insight'
  }
]
```

### aiAnalysis.mock.js
```javascript
fakeAIAnalysisResponse: {
  riskLevel: 'Moderate' | 'Low' | 'High' | 'Critical',
  summary: string,
  recommendations: [string],
  confidence: number (0-100)
}

aiInsights: [string]  // Pattern observations
```

### healthHistory.mock.js
```javascript
healthHistoryRecords: [
  {
    title: string,
    date: string,
    type: 'Routine' | 'Vitals' | 'Symptoms' | 'Medication'
  }
]
```

### admin.mock.js
```javascript
adminStats: [
  { label: string, value: string }  // 3 metrics
]
```

---

## 3. SERVICES (`src/services/`)

### apiClient.js
- **Type**: Infrastructure
- **Purpose**: Axios HTTP client with JWT auth interceptor
- **Current Behavior**: Configures baseURL, adds Bearer token from `getToken()`
- **Mock vs Real**: Real API ready (can swap endpoint)

### dashboardService.js
- **Type**: Mock API
- **Functions**:
  - `getDashboardSummary()` → `{ stats, healthPlanItems }`
  - `getDashboardCharts()` → `{ heartRateData, weightData, activityData }`
- **Delay**: 250ms simulated API call
- **Current State**: **100% Mock** - returns hardcoded dashboard.mock data

### profileService.js
- **Type**: Mock API
- **Function**: `getPatientProfile()` → `patientProfile` object
- **Delay**: 250ms simulated API call
- **Current State**: **100% Mock** - returns hardcoded profile data

### healthHistoryService.js
- **Type**: Mock API
- **Function**: `getHealthHistory()` → `healthHistoryRecords` array
- **Delay**: 250ms simulated API call
- **Current State**: **100% Mock**

### notificationService.js
- **Type**: Mock API
- **Function**: `getNotifications()` → `notifications` array
- **Delay**: 250ms simulated API call
- **Current State**: **100% Mock**

### symptomService.js
- **Type**: Mock API with error simulation
- **Functions**:
  - `getSymptomOptions()` → `symptoms` array
  - `analyzeSymptoms(payload)` → `{ id, analysis }`
- **Error Handling**: If description includes "error", rejects
- **Delay**: 1400ms (simulates LLM processing)
- **Current State**: **100% Mock** - uses fakeAIAnalysisResponse

### aiAnalysisService.js
- **Type**: Mock API
- **Function**: `getLatestAIAnalysis()` → `{ analysis, insights }`
- **Delay**: 250ms simulated API call
- **Current State**: **100% Mock**

### mediAssistService.js
- **Type**: Real API (to Python backend)
- **Endpoint**: `/mediassist/api/mediassist/chat`
- **Timeout**: 520 seconds (for LLM "thinking" model)
- **Input**: `{ patientData, history, userText, signal }`
- **Output**: `{ userContent, assistantContent, parsed }`
- **Current State**: **Real integration** with Python backend (mediassist_service/app.py)

### mockApi.js
- **Purpose**: Helper utilities for simulating async API calls
- **Functions**:
  - `resolveMock(data, delay = 250)` → Promise
  - `rejectMock(message, delay = 250)` → Promise

---

## 4. DATA MODELS & INTERFACES (Implicit via Zod Schema)

### User Authentication Model
```javascript
{
  email: string,
  role: 'patient' | 'admin',
  name?: string
}
```

### Patient Data Model (from SymptomForm.jsx Zod Schema)
```javascript
{
  // Personal Info
  age: number,
  biologicalSex: string,
  weight: number,
  height: number,
  pregnancyStatus?: string,

  // Device Measures (optional)
  bloodPressureSys?: number,
  bloodPressureDia?: number,
  heartRate?: number,
  spo2?: number,
  temperature?: number,
  glycemia?: number,
  weightVariation?: string,
  weightVariationKg?: number,

  // Medical History
  chronicDiseases: string[],
  hasDrugAllergies: string,
  drugAllergies?: { value: string }[],
  familyHistory?: string[],
  tobacco: string,
  tobaccoQuantity?: string,
  alcohol: string,
  alcoholQuantity?: string,

  // Treatments
  hasCurrentMedications: string,
  currentMedications?: { value: string }[],
  hasSupplements?: string,
  supplements?: string,
  treatmentAdherence?: string,

  // Current Symptoms
  symptoms: string[],
  otherSymptoms?: string,
  painIntensity?: number (0-10),
  symptomDuration?: string,
  painLocation?: string[],
  triggers?: string[],
  generalState?: string,

  // Lifestyle
  physicalActivity?: string,
  diet?: string[],
  sleepQuality?: string,
  stressLevel?: number (1-5),
  description?: string (max 600 chars),
  
  // Consent
  consent: boolean
}
```

### Dashboard Stats Model
```javascript
{
  label: string,
  value: string,
  icon: 'activity' | 'bell' | 'heart' | 'temperature'
}
```

### Chart Data Models
```javascript
HeartRateData: { day: string, bpm: number }
WeightData: { week: string, weight: number }
ActivityData: { day: string, steps: number, sleep: number }
```

### Profile Model
```javascript
{
  name: string,
  email: string,
  location: string,
  profileStatus: string,
  healthProfileStatus: string
}
```

### AI Analysis Model
```javascript
{
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical',
  summary: string,
  recommendations: string[],
  confidence: number,
  urgence: 'normale' | 'moderee' | 'elevee' | 'critique',
  alertes?: Alert[],
  resume_situation: string,
  analyse: string,
  orientation?: {
    niveau: 'automedication' | 'medecin_generaliste' | 'specialiste' | 'urgences',
    specialite?: string,
    raison: string,
    delai: string
  },
  recommandations?: Recommendation[]
}
```

### Recommendation Model (from MediAssist)
```javascript
{
  id: string,
  titre: string,
  description: string,
  priorite: 'haute' | 'moyenne' | 'basse',
  categorie?: string,
  actions?: string[]
}
```

### Alert Model (from MediAssist)
```javascript
{
  titre: string,
  detail?: string,
  action?: string,
  urgence: 'normale' | 'moderee' | 'elevee' | 'critique'
}
```

---

## 5. FORM OPTIONS & ENUMS (`features/symptom-form/formOptions.js`)

### chronicDiseaseOptions
```
'Aucune pathologie connue', 'Diabete T1/T2', 'HTA', 'Asthme', 'BPCO', 
'IRC', 'Cancer', 'Cholesterol'
```

### familyHistoryOptions
```
'Cancer', 'Cardio', 'Diabete', 'AVC', 'Alzheimer'
```

### symptomOptions
```
'Fatigue', 'Douleur', 'Dyspnee', 'Vertiges', 'Nausees', 'Fievre', 
'Cephalees', 'Toux', 'Douleur thoracique', 'Essoufflement', 
'Maux de gorge', 'Douleurs abdominales'
```

### triggerOptions
```
'Effort physique', 'Repas', 'Stress', 'Froid', 'Spontane'
```

### painLocationOptions
```
'Tete', 'Cou', 'Gorge', 'Thorax', 'Dos', 'Abdomen', 'Bassin', 
'Bras', 'Main', 'Jambe', 'Genou', 'Pied'
```

### dietOptions
```
'Omnivore', 'Vegetarien', 'Vegan', 'Sans gluten', 'Diabetique'
```

### durationOptions
```
'<24h', 'Jours', 'Semaines', 'Mois+'
```

### generalStateOptions
```
'Excellent', 'Bon', 'Moyen', 'Mauvais', 'Tres mauvais'
```

### activityOptions
```
'Sedentaire', 'Legere', 'Moderee', 'Intense'
```

### sleepOptions
```
'Tres bon', 'Bon', 'Mauvais', 'Insomnie'
```

### adherenceOptions
```
'Toujours', 'Parfois', 'Rarement'
```

---

## 6. STATE MANAGEMENT

### medAssistStore.js (Zustand)
Persistent store (survives page reloads) containing:
- **recommendations**: Array of Recommendation objects from LLM
- **alerts**: Array of Alert objects from LLM
- **patientData**: Last symptom form payload
- **chatMessages**: User/assistant message pairs
- **chatHistory**: Structured turn history for LLM context
- **chatSessionKey**: Fingerprint to identify conversation scope

Methods:
- `setPatientData(data)` - Store current patient data
- `resetSession()` - Clear all analysis/chat state
- `startChatSession(key)` - Begin new conversation
- `setChatMessages(updater)` - Update message array
- `appendChatHistory(entries)` - Add to turn history
- `applyAnalysis(parsed)` - Convert LLM response → recommendations/alerts

### themeStore.js (Zustand)
Persistent store for theme preferences (light/dark mode)

---

## 7. DATA FLOW & RELATIONSHIPS

### Dashboard Flow
```
DashboardPage.jsx
  ↓ useQuery(['dashboard-summary'], getDashboardSummary)
  ↓ dashboardService.js → resolveMock(dashboard.mock data)
  ↓ Renders: Stats Cards, Charts (Recharts), Health Plan Items
```

### Symptom Analysis Flow
```
SymptomsPage.jsx / Symptoms.jsx
  ↓ SymptomForm.jsx (Zod-validated multi-step form)
  ↓ Step validation using formOptions.js (dropdowns/enums)
  ↓ On submit: analyzeSymptoms(formData)
  ↓ symptomService.js → resolveMock(fakeAIAnalysisResponse, 1400ms)
  ↓ parsed response → useMedAssistStore.applyAnalysis()
  ↓ Stores recommendations/alerts → navigates to AIAnalysisPage
  ↓ AIAnalysisPage renders AnalysisCard + MediAssistChat
  ↓ Chat messages → sendMediAssistMessage() → Python backend
  ↓ Backend processes with LLM → returns new recommendations/alerts
```

### Profile Flow
```
ProfilePage.jsx
  ↓ useQuery(['patient-profile'], getPatientProfile)
  ↓ profileService.js → resolveMock(profile.mock data)
  ↓ Renders: Patient Info, Medical History Tabs, Vaccinations
  ↓ hardcoded healthDetails, medicalHistory, vaccinations arrays
```

### History Flow
```
HistoryPage.jsx
  ↓ useQuery(['health-history'], getHealthHistory)
  ↓ healthHistoryService.js → resolveMock(healthHistoryRecords)
  ↓ Categorized display (General, Allergies, Treatments, Surgery, Family)
```

### Notification Flow
```
NotificationsPage.jsx / Alerts (in AIAnalysisPage)
  ↓ getNotifications() → notificationService.js
  ↓ Mock data or live MediAssist alerts from useMedAssistStore.alerts
  ↓ Priority-based styling (haute/moyenne/basse)
```

---

## 8. INTEGRATION POINTS

### With Backend (Real API)
1. **MediAssist Chat** (`mediAssistService.js`)
   - Endpoint: `/mediassist/api/mediassist/chat`
   - Input: Patient data + chat history + new question
   - Output: Parsed JSON with recommendations, alerts, urgence, orientation
   - Auth: Bearer JWT token (via apiClient interceptor)

2. **Future Real APIs**
   - Dashboard data
   - Profile CRUD
   - Health history records
   - Notifications (WebSocket ready)

### With Python Services
- **mediassist_service/app.py**: LLM client for AI analysis
  - Receives symptom payloads
  - Builds system/user prompts
  - Calls LLM (returns structured JSON)
  - Returns parsed analysis

---

## 9. CURRENT STATE SUMMARY

| Layer | Status | Details |
|-------|--------|---------|
| **Pages** | ✅ Complete | 8 main pages, all functional |
| **Mock Data** | ✅ Complete | 6 mock files with realistic data |
| **Services (Mock)** | ✅ Complete | Dashboard, Profile, History, Notifications use mock |
| **Services (Real)** | ⚠️ Partial | MediAssist chat integrated; others still mock |
| **Data Models** | ✅ Implicit | Zod schema + mocks define structure |
| **State Mgmt** | ✅ Complete | Zustand stores for chat & theme |
| **Auth** | ✅ Fake JWT | Dev/demo mode with role-based access |
| **Validation** | ✅ Zod | Robust form validation |
| **Types** | ❌ None | JavaScript only (no TypeScript) |

---

## 10. RECOMMENDATIONS FOR NEXT STEPS

1. **Convert Mock Services to Real APIs**
   - Replace `resolveMock()` calls with actual `apiClient` calls
   - Update service endpoints to match backend routes
   - Implement proper error handling

2. **Add TypeScript**
   - Define interfaces for all data models
   - Tighten type safety across services

3. **Persist User Data**
   - Add localStorage or session storage for forms
   - Remember user preferences (theme, language)

4. **Real-time Notifications**
   - Implement WebSocket connection for alerts
   - Add toast notifications for urgent alerts

5. **Testing**
   - Add React Testing Library tests for pages
   - Mock services for unit tests
   - Integration tests for data flows
