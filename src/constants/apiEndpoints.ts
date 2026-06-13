/**
 * API Endpoints Configuration
 * Centralized definitions for all backend API endpoints
 */

// Base URL will be set from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ==================== Authentication Endpoints ====================
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGIN_GOOGLE: '/api/auth/login/google',
  LOGIN_FACEBOOK: '/api/auth/login/facebook',
  LOGIN_APPLE: '/api/auth/login/apple',
  REGISTER: '/api/auth/register',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/request-verification',
  REQUEST_MFA: '/api/auth/request-mfa',
  ENABLE_MFA: '/api/auth/enable-mfa',
  VERIFY_MFA: '/api/auth/verify-mfa',
  DISABLE_MFA: '/api/auth/disable-mfa',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  SOCIAL_LOGIN: '/api/auth/social-login',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
};

// ==================== User/Profile Endpoints ====================
export const USER_ENDPOINTS = {
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  DELETE_ACCOUNT: '/api/users/profile',
  GET_USER_BY_ID: (id: string) => `/api/users/${id}`,
  CHANGE_PASSWORD: '/api/users/change-password',
  UPLOAD_PROFILE_PICTURE: '/api/users/profile-picture',
};

// ==================== Vital Signs Endpoints ====================
export const VITAL_ENDPOINTS = {
  RECORD_VITAL: '/api/vitals',
  GET_VITALS: '/api/vitals',
  GET_VITAL_BY_ID: (id: string) => `/api/vitals/${id}`,
  UPDATE_VITAL: (id: string) => `/api/vitals/${id}`,
  DELETE_VITAL: (id: string) => `/api/vitals/${id}`,
  GET_VITAL_EVOLUTION: '/api/vitals/evolution',
  EXPORT_VITALS: '/api/vitals/export',
  GET_LATEST_VITAL: (type: string) => `/api/vitals/latest/${type}`,
};

// ==================== Appointments Endpoints ====================
export const APPOINTMENT_ENDPOINTS = {
  CREATE_APPOINTMENT: '/api/appointments',
  GET_APPOINTMENTS: '/api/appointments',
  GET_APPOINTMENT_BY_ID: (id: string) => `/api/appointments/${id}`,
  UPDATE_APPOINTMENT: (id: string) => `/api/appointments/${id}`,
  CANCEL_APPOINTMENT: (id: string) => `/api/appointments/${id}/cancel`,
  DELETE_APPOINTMENT: (id: string) => `/api/appointments/${id}`,
  GET_AVAILABLE_SLOTS: '/api/appointments/available-slots',
  CONFIRM_APPOINTMENT: (id: string) => `/api/appointments/${id}/confirm`,
  SEND_REMINDER: (id: string) => `/api/appointments/${id}/reminder`,
  SEND_REMINDERS: '/api/appointments/send-reminders',
};

// ==================== Alerts Endpoints ====================
export const ALERT_ENDPOINTS = {
  GET_ALERTS: '/api/alerts',
  GET_ALERT_BY_ID: (id: string) => `/api/alerts/${id}`,
  MARK_AS_READ: (id: string) => `/api/alerts/${id}/read`,
  MARK_AS_UNREAD: (id: string) => `/api/alerts/${id}/unread`,
  ACKNOWLEDGE_ALERT: (id: string) => `/api/alerts/${id}/acknowledge`,
  UPDATE_ALERT: (id: string) => `/api/alerts/${id}`,
  DELETE_ALERT: (id: string) => `/api/alerts/${id}`,
  DELETE_ALL_ALERTS: '/api/alerts/delete-all',
  GET_UNREAD_COUNT: '/api/alerts/unread-count',
};

// ==================== Doctors Endpoints ====================
export const DOCTOR_ENDPOINTS = {
  GET_DOCTORS: '/api/doctors',
  GET_DOCTOR_BY_ID: (id: string) => `/api/doctors/${id}`,
  GET_DOCTOR_AVAILABILITY: (id: string) => `/api/doctors/${id}/availability`,
  SEARCH_DOCTORS: '/api/doctors/search',
  GET_DOCTOR_APPOINTMENTS: (id: string) => `/api/doctors/${id}/appointments`,
  RATE_DOCTOR: (id: string) => `/api/doctors/${id}/rate`,
  CONFIRM_DOCTOR: (id: string) => `/api/doctors/${id}/confirm`,
  CREATE_DOCTOR: '/api/doctors',
};

// ==================== Forms/Questionnaires Endpoints ====================
export const FORM_ENDPOINTS = {
  SUBMIT_FORM: '/api/forms/submit',
  GET_FORMS: '/api/forms/list',
  GET_FORM_BY_ID: (id: string) => `/api/forms/${id}`,
  GET_FORM_HISTORY: '/api/forms/history',
  EXPORT_FORMS: '/api/forms/export',
};

// ==================== AI/MediAssist Endpoints ====================
export const AI_ENDPOINTS = {
  ANALYZE_SYMPTOMS: '/mediassist/api/mediassist/analyze',
  CHAT: '/mediassist/api/mediassist/chat',
  GET_RECOMMENDATIONS: '/mediassist/api/mediassist/recommendations',
};

// ==================== Admin Endpoints ====================
export const ADMIN_ENDPOINTS = {
  GET_USERS: '/api/admin/users',
  GET_USER: (id: string) => `/api/admin/users/${id}`,
  DELETE_USER: (id: string) => `/api/admin/users/${id}`,
  GET_STATISTICS: '/api/admin/statistics',
  GET_ACTIVITY_LOG: '/api/admin/activity-log',
};

// ==================== Helper Functions ====================

/**
 * Build full API URL from endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Get all endpoints organized by feature
 */
export const getAllEndpoints = () => ({
  auth: AUTH_ENDPOINTS,
  users: USER_ENDPOINTS,
  vitals: VITAL_ENDPOINTS,
  appointments: APPOINTMENT_ENDPOINTS,
  alerts: ALERT_ENDPOINTS,
  doctors: DOCTOR_ENDPOINTS,
  forms: FORM_ENDPOINTS,
  ai: AI_ENDPOINTS,
  admin: ADMIN_ENDPOINTS,
});

/**
 * Common query parameters for API calls
 */
export const API_QUERY_PARAMS = {
  PAGE: 'page',
  PAGE_SIZE: 'pageSize',
  SORT_BY: 'sortBy',
  SORT_ORDER: 'sortOrder',
  FILTER: 'filter',
  DATE_FROM: 'dateFrom',
  DATE_TO: 'dateTo',
  SEARCH: 'search',
};

/**
 * Common HTTP headers
 */
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  BEARER: 'Bearer',
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};
