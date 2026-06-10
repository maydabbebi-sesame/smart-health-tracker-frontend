/**
 * API Endpoints Configuration
 * Centralized definitions for all backend API endpoints
 */

// Base URL will be set from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ==================== Authentication Endpoints ====================
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification-code',
  REQUEST_MFA: '/auth/request-mfa',
  VERIFY_MFA: '/auth/verify-mfa',
  DISABLE_MFA: '/auth/disable-mfa',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  SOCIAL_LOGIN: '/auth/social-login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
};

// ==================== User/Profile Endpoints ====================
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  DELETE_ACCOUNT: '/users/profile',
  GET_USER_BY_ID: (id: string) => `/users/${id}`,
  CHANGE_PASSWORD: '/users/password',
  UPLOAD_PROFILE_PICTURE: '/users/profile-picture',
};

// ==================== Vital Signs Endpoints ====================
export const VITAL_ENDPOINTS = {
  RECORD_VITAL: '/vitals/record',
  GET_VITALS: '/vitals/list',
  GET_VITAL_BY_ID: (id: string) => `/vitals/${id}`,
  UPDATE_VITAL: (id: string) => `/vitals/${id}`,
  DELETE_VITAL: (id: string) => `/vitals/${id}`,
  GET_VITAL_EVOLUTION: '/vitals/evolution',
  EXPORT_VITALS: '/vitals/export',
  GET_LATEST_VITAL: (type: string) => `/vitals/latest/${type}`,
};

// ==================== Appointments Endpoints ====================
export const APPOINTMENT_ENDPOINTS = {
  CREATE_APPOINTMENT: '/appointments/create',
  GET_APPOINTMENTS: '/appointments/list',
  GET_APPOINTMENT_BY_ID: (id: string) => `/appointments/${id}`,
  UPDATE_APPOINTMENT: (id: string) => `/appointments/${id}`,
  CANCEL_APPOINTMENT: (id: string) => `/appointments/${id}/cancel`,
  GET_AVAILABLE_SLOTS: '/appointments/available-slots',
  CONFIRM_APPOINTMENT: (id: string) => `/appointments/${id}/confirm`,
  SEND_REMINDER: (id: string) => `/appointments/${id}/reminder`,
};

// ==================== Alerts Endpoints ====================
export const ALERT_ENDPOINTS = {
  GET_ALERTS: '/alerts/list',
  GET_ALERT_BY_ID: (id: string) => `/alerts/${id}`,
  MARK_AS_READ: (id: string) => `/alerts/${id}/read`,
  MARK_AS_UNREAD: (id: string) => `/alerts/${id}/unread`,
  ACKNOWLEDGE_ALERT: (id: string) => `/alerts/${id}/acknowledge`,
  DELETE_ALERT: (id: string) => `/alerts/${id}`,
  DELETE_ALL_ALERTS: '/alerts/delete-all',
  GET_UNREAD_COUNT: '/alerts/unread-count',
};

// ==================== Doctors Endpoints ====================
export const DOCTOR_ENDPOINTS = {
  GET_DOCTORS: '/doctors/list',
  GET_DOCTOR_BY_ID: (id: string) => `/doctors/${id}`,
  GET_DOCTOR_AVAILABILITY: (id: string) => `/doctors/${id}/availability`,
  SEARCH_DOCTORS: '/doctors/search',
  GET_DOCTOR_APPOINTMENTS: (id: string) => `/doctors/${id}/appointments`,
  RATE_DOCTOR: (id: string) => `/doctors/${id}/rate`,
};

// ==================== Forms/Questionnaires Endpoints ====================
export const FORM_ENDPOINTS = {
  SUBMIT_FORM: '/forms/submit',
  GET_FORMS: '/forms/list',
  GET_FORM_BY_ID: (id: string) => `/forms/${id}`,
  GET_FORM_HISTORY: '/forms/history',
  EXPORT_FORMS: '/forms/export',
};

// ==================== AI/MediAssist Endpoints ====================
export const AI_ENDPOINTS = {
  ANALYZE_SYMPTOMS: '/mediassist/api/mediassist/analyze',
  CHAT: '/mediassist/api/mediassist/chat',
  GET_RECOMMENDATIONS: '/mediassist/api/mediassist/recommendations',
};

// ==================== Admin Endpoints ====================
export const ADMIN_ENDPOINTS = {
  GET_USERS: '/admin/users',
  GET_USER: (id: string) => `/admin/users/${id}`,
  DELETE_USER: (id: string) => `/admin/users/${id}`,
  GET_STATISTICS: '/admin/statistics',
  GET_ACTIVITY_LOG: '/admin/activity-log',
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
