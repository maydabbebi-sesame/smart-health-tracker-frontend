import { apiClient } from './apiClient'
import { AUTH_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Authentication Service - Real API Integration
 * Handles login, registration, email verification, and MFA
 */

const TOKEN_KEY = 'smart_health_tracker_token'
const USER_KEY = 'smart_health_tracker_user'

/**
 * Store token and user in localStorage
 */
export function setAuthToken(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Get stored token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get stored user
 */
export function getStoredUser() {
  try {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

/**
 * Clear authentication data
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken() && !!getStoredUser()
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return getStoredUser()
}

/**
 * Login with email and password
 */
export async function login(email, password) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    })

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      setAuthToken(token, user)
      return { success: true, user }
    }

    return { success: false, error: response.data.error || 'Login failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Login failed',
    }
  }
}

/**
 * Register new user
 */
export async function register(name, email, password, role = 'user') {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, {
      name,
      email,
      password,
      role,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Registration failed',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Registration failed',
    }
  }
}

/**
 * Verify email with code
 */
export async function verifyEmail(email, code) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, {
      email,
      code,
    })

    if (response.data.success) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Email verification failed',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Email verification failed',
    }
  }
}

/**
 * Resend verification code to email
 */
export async function resendVerificationCode(email) {
  try {
    const response = await apiClient.post(
      AUTH_ENDPOINTS.RESEND_VERIFICATION,
      { email },
    )

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to resend verification code',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to resend verification code',
    }
  }
}

/**
 * Request MFA setup
 */
export async function requestMFA(uid) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.REQUEST_MFA, { uid })

    if (response.data.success) {
      return { success: true, data: response.data.data }
    }

    return { success: false, error: response.data.error || 'MFA setup failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'MFA setup failed',
    }
  }
}

/**
 * Verify MFA code
 */
export async function verifyMFA(uid, code) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_MFA, {
      uid,
      code,
    })

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      setAuthToken(token, user)
      return { success: true, user }
    }

    return {
      success: false,
      error: response.data.error || 'MFA verification failed',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'MFA verification failed',
    }
  }
}

/**
 * Logout
 */
export function logout() {
  clearToken()
  // Optionally call backend logout endpoint
  return { success: true }
}

/**
 * Forgot password
 */
export async function forgotPassword(email) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      email,
    })

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to send reset email',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to send reset email',
    }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(email, code, newPassword) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      email,
      code,
      password: newPassword,
    })

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to reset password',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to reset password',
    }
  }
}
