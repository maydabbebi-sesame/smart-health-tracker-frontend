/**
 * SmartHealth Frontend Data Models (Source of Truth)
 * These TypeScript interfaces define the frontend data contracts
 * and align with backend API responses.
 */

// ==================== Authentication ====================

export type UserRole = 'user' | 'doctor' | 'admin';

export interface User {
  uid: string; // Base64 encoded user ID
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  mfaEnabled: boolean;
  profilePicture?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string; // ISO8601
  address?: string;
  city?: string;
  country?: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole; // defaults to 'user'
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface MFAVerificationRequest {
  uid: string;
  code: string;
}

// ==================== Vitals ====================

export type VitalType =
  | 'heart_rate'
  | 'blood_pressure'
  | 'temperature'
  | 'oxygen'
  | 'respiratory_rate';

export interface Vital {
  id: string;
  userId: string;
  timestamp: string; // ISO8601
  type: VitalType;
  value: number;
  unit: string;
  notes?: string;
  alertGenerated: boolean;
}

export interface VitalInput {
  type: VitalType;
  value: number;
  notes?: string;
}

// For blood pressure: special structure
export interface BloodPressureVital extends Vital {
  systolic: number;
  diastolic: number;
}

export interface VitalEvolutionChart {
  type: VitalType;
  timeRange: 'week' | 'month' | 'year';
  data: Array<{
    timestamp: string;
    value: number;
    status: 'normal' | 'warning' | 'critical';
  }>;
}

// ==================== Appointments ====================

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string; // ISO8601 (date part)
  time: string; // HH:MM format
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  reminderEnabled: boolean;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface AppointmentRequest {
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  notes?: string;
  reminderEnabled?: boolean;
}

// ==================== Alerts ====================

export type AlertType = 'vital' | 'form' | 'appointment';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  sourceId: string; // vital/form/appointment ID
  read: boolean;
  acknowledged: boolean;
  createdAt: string; // ISO8601
}

// ==================== Doctors ====================

export interface DoctorAvailability {
  [day: string]: Array<{
    start: string; // HH:MM
    end: string; // HH:MM
  }>;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bio?: string;
  phone?: string;
  location?: string;
  availability?: DoctorAvailability;
  rating?: number;
  verified: boolean;
}

// ==================== Forms/Questionnaires ====================

export interface SymptomFormData {
  // Main symptoms
  mainSymptoms: string[]; // e.g., ['fever', 'cough']
  symptomDuration: string; // e.g., '1 week', '3 days'

  // Associated symptoms
  associatedSymptoms: string[]; // e.g., ['sore_throat', 'fatigue']

  // Medical history
  chronicDiseases: string[]; // e.g., ['asthma', 'diabetes']
  currentMedications: string[]; // free text

  // Lifestyle
  dietType: string; // e.g., 'balanced', 'vegetarian'
  exerciseFrequency: string; // e.g., 'sedentary', 'moderate'
  sleepHours: number;
  stressLevel: string; // e.g., 'low', 'high'

  // Recent activities
  recentTravels: string; // free text
  recentExposures: string; // free text
  vaccination: string; // e.g., 'yes', 'no'

  // Severity & impact
  symptomSeverity: string; // e.g., 'mild', 'severe'
  impactOnDailyLife: string; // e.g., 'none', 'significant'

  // Contact & follow-up
  preferredContactMethod?: string; // e.g., 'email', 'phone'
  followUpPreference?: string; // e.g., 'immediate', 'within_week'

  // Additional notes
  additionalNotes?: string;
}

export interface SubmittedForm {
  id: string;
  userId: string;
  formType: string;
  answers: SymptomFormData;
  submittedAt: string; // ISO8601
  alertGenerated: boolean;
  alertId?: string;
}

export interface FormSubmissionRequest {
  formType: string;
  answers: SymptomFormData;
}

// ==================== Dashboard ====================

export interface DashboardStats {
  totalVitalsRecorded: number;
  recentVital?: Vital;
  upcomingAppointments: number;
  pendingAlerts: number;
  wellnessScore: number; // 0-100, calculated client-side
  lastCheckup?: string; // ISO8601
  allergies?: string[];
}

export interface HealthMetrics {
  vitalsThisWeek: Vital[];
  appointmentsThisMonth: Appointment[];
  alertsThisMonth: Alert[];
  averageHeartRate?: number;
  averageBloodPressure?: string;
}

// ==================== API Response Wrappers ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

// ==================== AI/MediAssist ====================

export interface AIAnalysisRequest {
  symptoms: string[];
  duration: string;
  severity: string;
  otherData?: SymptomFormData;
}

export interface AIAnalysisResponse {
  potentialConditions: Array<{
    condition: string;
    probability: number;
    severity: string;
  }>;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  shouldConsultDoctor: boolean;
  disclaimer: string;
}

export interface MediAssistMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface MediAssistResponse {
  message: string;
  recommendations?: string[];
  alerts?: string[];
  nextSteps?: string[];
}

// ==================== Local Storage Models ====================

export interface AuthToken {
  token: string;
  expiresAt: number;
  user: User;
}

export interface CachedDashboard {
  stats: DashboardStats;
  metrics: HealthMetrics;
  cachedAt: number;
}

// ==================== Form Options (Frontend Enums) ====================

export const SYMPTOM_OPTIONS = [
  'fever',
  'cough',
  'fatigue',
  'headache',
  'body_aches',
  'sore_throat',
  'shortness_of_breath',
  'nausea',
  'vomiting',
  'diarrhea',
  'chest_pain',
  'dizziness',
];

export const CHRONIC_DISEASE_OPTIONS = [
  'diabetes',
  'hypertension',
  'asthma',
  'heart_disease',
  'thyroid',
  'arthritis',
  'depression',
  'anxiety',
];

export const DIET_OPTIONS = [
  'balanced',
  'vegetarian',
  'vegan',
  'keto',
  'high_protein',
  'low_carb',
];

export const EXERCISE_OPTIONS = [
  'sedentary',
  'light',
  'moderate',
  'intensive',
];

export const STRESS_LEVEL_OPTIONS = [
  'low',
  'moderate',
  'high',
  'very_high',
];

export const SYMPTOM_SEVERITY_OPTIONS = [
  'mild',
  'moderate',
  'severe',
];

export const IMPACT_ON_DAILY_LIFE_OPTIONS = [
  'none',
  'minimal',
  'moderate',
  'significant',
];

export const CONTACT_METHOD_OPTIONS = [
  'email',
  'phone',
  'in_person',
];

export const FOLLOW_UP_PREFERENCE_OPTIONS = [
  'immediate',
  'within_24h',
  'within_week',
  'not_needed',
];
