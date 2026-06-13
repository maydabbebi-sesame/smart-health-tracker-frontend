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
 * Backend returns: { access_token, token_type, expires_in } or { mfa_required, message }
 */
export async function login(authData) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
      email: authData.email,
      password: authData.password,
    })

    const data = response.data

    // MFA required flow
    if (data.mfa_required) {
      return { success: true, mfaRequired: true, message: data.message }
    }

    // Successful login - backend returns access_token directly
    if (data.access_token) {
      const userUid = data.uid || data.user?.uid || data.user_uid || data.user?.id || null
      const user = { email: authData.email }
      if (userUid) user.uid = userUid
      setAuthToken(data.access_token, user)
      return { success: true, user, token: data.access_token }
    }

    return { success: false, error: 'Login failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Login failed',
    }
  }
}

/**
 * Register new user
 * Backend returns: { message, uid } on 201
 */
export async function register(name, email, password, role = 'user') {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, {
      name,
      email,
      password,
      role,
    })

    return {
      success: true,
      data: { uid: response.data.uid, message: response.data.message },
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
 * Backend expects: { uid, code }
 * Backend returns: { message }
 */
export async function verifyEmail(uid, code) {
  try {
    await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, {
      uid,
      code,
    })

    return { success: true }
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
 * Backend expects: { email }
 * Backend returns: { message }
 */
export async function resendVerificationCode(email) {
  try {
    await apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email })

    return { success: true }
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
 * Enable MFA (requires current_password)
 * Backend expects: { current_password }
 * Backend returns: { message }
 */
export async function enableMFA(currentPassword) {
  try {
    await apiClient.post(AUTH_ENDPOINTS.ENABLE_MFA, {
      current_password: currentPassword,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'MFA setup failed',
    }
  }
}

/**
 * Verify MFA code
 * Backend expects: { email, code }
 * Backend returns: { access_token, token_type, expires_in }
 */
export async function verifyMFA(email, code) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.VERIFY_MFA, {
      email,
      code,
    })

    const data = response.data

    if (data.access_token) {
      const userUid = data.uid || data.user?.uid || data.user_uid || data.user?.id || null
      const user = { email }
      if (userUid) user.uid = userUid
      setAuthToken(data.access_token, user)
      return { success: true, user, token: data.access_token }
    }

    return { success: false, error: 'MFA verification failed' }
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
 * Logout - revokes token on backend
 */
export async function logout() {
  try {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT)
  } catch {
    // Best-effort - clear local state regardless
  }
  clearToken()
  return { success: true }
}

/**
 * Login with Google
 * Backend expects: { id_token }
 * Backend returns: { access_token, token_type, expires_in }
 */
export async function loginWithGoogle(idToken) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN_GOOGLE, {
      id_token: idToken,
    })

    const data = response.data
    if (data.access_token) {
      const userUid = data.uid || data.user?.uid || data.user_uid || data.user?.id || null
      const user = { provider: 'google' }
      if (userUid) user.uid = userUid
      setAuthToken(data.access_token, user)
      return { success: true, user, token: data.access_token }
    }

    return { success: false, error: 'Google login failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Google login failed',
    }
  }
}

/**
 * Login with Facebook
 * Backend expects: { access_token }
 * Backend returns: { access_token, token_type, expires_in }
 */
export async function loginWithFacebook(accessToken) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN_FACEBOOK, {
      access_token: accessToken,
    })

    const data = response.data
    if (data.access_token) {
      const userUid = data.uid || data.user?.uid || data.user_uid || data.user?.id || null
      const user = { provider: 'facebook' }
      if (userUid) user.uid = userUid
      setAuthToken(data.access_token, user)
      return { success: true, user, token: data.access_token }
    }

    return { success: false, error: 'Facebook login failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Facebook login failed',
    }
  }
}

/**
 * Login with Apple
 * Backend expects: { id_token }
 * Backend returns: { access_token, token_type, expires_in }
 */
export async function loginWithApple(idToken) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN_APPLE, {
      id_token: idToken,
    })

    const data = response.data
    if (data.access_token) {
      const userUid = data.uid || data.user?.uid || data.user_uid || data.user?.id || null
      const user = { provider: 'apple' }
      if (userUid) user.uid = userUid
      setAuthToken(data.access_token, user)
      return { success: true, user, token: data.access_token }
    }

    return { success: false, error: 'Apple login failed' }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Apple login failed',
    }
  }
}

/**
 * Request MFA setup/code
 */
export async function requestMFA(uid) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.REQUEST_MFA, { uid })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'MFA request failed',
    }
  }
}

/**
 * Forgot password - sends reset email
 */
export async function forgotPassword(email) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email })
    return { success: true, message: response.data.message }
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
 * Reset password with code
 */
export async function resetPassword(email, code, newPassword) {
  try {
    const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      email,
      code,
      new_password: newPassword,
    })
    return { success: true, message: response.data.message }
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
