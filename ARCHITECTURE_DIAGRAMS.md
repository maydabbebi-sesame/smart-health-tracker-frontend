# Frontend Architecture Diagram

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAGES (src/pages/)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DashboardPage ──→ Charts (Recharts)                                       │
│  LoginPage ──→ Role-based auth                                            │
│  SymptomsPage ──→ Multi-step Form (Zod)                                   │
│  ProfilePage ──→ Tab navigation                                            │
│  HistoryPage ──→ Medical records                                           │
│  AIAnalysisPage ──→ Alerts + MediAssist Chat                              │
│  SettingsPage ──→ User preferences                                         │
│  AdminDashboardPage ──→ Metrics                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVICES & STATE (Layer)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Dashboard  │  │   Profile    │  │   History    │  │ Notifications  │ │
│  │  Service     │  │  Service     │  │  Service     │  │  Service       │ │
│  │   (100%      │  │  (100%       │  │  (100%       │  │  (100%         │ │
│  │    Mock)     │  │   Mock)      │  │   Mock)      │  │   Mock)        │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘ │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  Symptom     │  │     AI       │  │  MediAssist Service (REAL API)   │ │
│  │  Service     │  │  Analysis    │  │                                  │ │
│  │  (Mock with  │  │  Service     │  │  sendMediAssistMessage() ───┐   │ │
│  │  error sim)  │  │  (Mock)      │  │                        520s   │   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘   │ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │          Mock Data Files (src/mocks/)                              │  │
│  │  ├─ dashboard.mock.js      (stats, charts data)                    │  │
│  │  ├─ profile.mock.js        (patient info)                          │  │
│  │  ├─ symptoms.mock.js       (symptom list)                          │  │
│  │  ├─ aiAnalysis.mock.js     (fake analysis response)                │  │
│  │  ├─ healthHistory.mock.js  (medical records)                       │  │
│  │  ├─ notifications.mock.js  (notification list)                     │  │
│  │  └─ admin.mock.js          (admin stats)                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │          State Management (Zustand)                                │  │
│  │  ├─ useMedAssistStore                                              │  │
│  │  │  ├─ recommendations[]                                           │  │
│  │  │  ├─ alerts[]                                                    │  │
│  │  │  ├─ chatMessages[]                                              │  │
│  │  │  └─ patientData (last form submission)                          │  │
│  │  └─ useThemeStore                                                  │  │
│  │     └─ theme (light/dark mode)                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │   API CLIENT (axios)          │
                    │   - JWT interceptor           │
                    │   - Base URL config           │
                    └───────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │   Backend Services            │
                    │                               │
                    │   ├─ REST API (future)        │
                    │   └─ MediAssist LLM Service   │
                    │      /mediassist/api/chat     │
                    └───────────────────────────────┘
```

## SymptomForm Data Pipeline

```
SymptomForm.jsx (Multi-step form)
│
├─ Step 1: Personal Info
│  └─ age, biologicalSex, weight, height, pregnancyStatus
│
├─ Step 2: Device Measures (Optional)
│  └─ BP, HR, SpO2, Temperature, Glycemia, Weight variation
│
├─ Step 3: Medical History
│  └─ Chronic diseases, Drug allergies, Family history, 
│     Tobacco/Alcohol consumption
│
├─ Step 4: Treatments
│  └─ Current medications, Supplements, Adherence
│
├─ Step 5: Current Symptoms
│  └─ Symptom list (from formOptions), Pain intensity,
│     Duration, Location, Triggers, General state
│
├─ Step 6: Lifestyle & Consent
│  └─ Physical activity, Diet, Sleep quality, Stress level,
│     Free-text description, Consent checkbox
│
└─ On Submit (Zod Validation)
   │
   ├─ analyzeSymptoms(formData)
   │  └─ Mock API delay 1400ms
   │
   └─ Result: { id, analysis: fakeAIAnalysisResponse }
      │
      ├─ If SUCCESS → useMedAssistStore.applyAnalysis()
      │              → Navigate to AIAnalysisPage
      │              → MediAssistChat initializes
      │              → Chat can send to /mediassist/api/chat (real)
      │
      └─ If ERROR (contains "error") → Toast notification
```

## Pages Quick Reference

```
┌─ AUTH LAYER
│  ├─ LoginPage     (Fake JWT with role detection)
│  └─ RegisterPage  (Demo account creation)
│
├─ PATIENT LAYER
│  ├─ DashboardPage     (Summary + Charts)
│  ├─ SymptomsPage      (Form + Analysis)
│  ├─ ProfilePage       (Patient info + History + Vaccinations)
│  ├─ HistoryPage       (Medical records)
│  ├─ AIAnalysisPage    (Alerts + MediAssist Chat)
│  ├─ NotificationsPage (Placeholder for Doctor Agent)
│  └─ SettingsPage      (Preferences)
│
└─ ADMIN LAYER
   └─ AdminDashboardPage (Metrics overview)
```

## Data Model Relationships

```
┌─────────────────────────┐
│   User/Auth Model       │
├─────────────────────────┤
│ email                   │
│ role: admin|patient     │
│ name                    │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│   Patient Profile       │ (profileService)
├─────────────────────────┤
│ name, email, location   │
│ profileStatus           │
│ healthProfileStatus     │
└────────────┬────────────┘
             │
             ├─→ ┌──────────────────────┐
             │   │ Health Details       │
             │   ├──────────────────────┤
             │   │ age, weight, height  │
             │   │ bloodType            │
             │   └──────────────────────┘
             │
             ├─→ ┌──────────────────────┐
             │   │ Medical History      │
             │   ├──────────────────────┤
             │   │ title, date, status  │
             │   └──────────────────────┘
             │
             └─→ ┌──────────────────────┐
                 │ Vaccinations         │
                 ├──────────────────────┤
                 │ name, date, status   │
                 └──────────────────────┘

┌─────────────────────────────────────┐
│   Symptom Submission (Form Data)    │ (from SymptomForm)
├─────────────────────────────────────┤
│ Personal + Device Measures + History│
│ + Treatments + Symptoms + Lifestyle │
│ (50+ fields, Zod validated)         │
└────────────┬────────────────────────┘
             │
             ↓ (analyzeSymptoms)
┌─────────────────────────────────────┐
│   AI Analysis Response              │ (from fakeAIAnalysisResponse)
├─────────────────────────────────────┤
│ riskLevel, summary, recommendations │
│ confidence                          │
└────────────┬────────────────────────┘
             │
             ├─→ STORED: useMedAssistStore
             │   ├─ recommendations[]
             │   ├─ alerts[]
             │   └─ patientData
             │
             └─→ RENDERED: AIAnalysisPage
                 ├─ AnalysisCard (priority badges)
                 ├─ Recommendations list
                 └─ MediAssistChat (conversations)
```

## Mock vs Real APIs Summary

| Service | Type | Status | Endpoint |
|---------|------|--------|----------|
| Dashboard | Mock | ✅ | resolveMock(dashboard data, 250ms) |
| Profile | Mock | ✅ | resolveMock(profile data, 250ms) |
| History | Mock | ✅ | resolveMock(history data, 250ms) |
| Notifications | Mock | ✅ | resolveMock(notifications, 250ms) |
| Symptoms | Mock | ✅ | resolveMock(fakeAI response, 1400ms) |
| AI Analysis | Mock | ✅ | resolveMock(analysis, 250ms) |
| MediAssist Chat | Real | ✅ | POST /mediassist/api/mediassist/chat |
| Admin Stats | Mock | ✅ | hardcoded in component |

## Key Technology Stack

- **React 18** + **React Router** (navigation)
- **TanStack Query** (useQuery for data fetching)
- **Zustand** (state management)
- **React Hook Form** + **Zod** (form validation)
- **Recharts** (dashboard charts)
- **Lucide React** (icons)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **Axios** (HTTP client)
- **Vite** (build tool)
