import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../__tests__/setup.js'

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import {
  login,
  register,
  verifyEmail,
  resendVerificationCode,
  enableMFA,
  verifyMFA,
  logout,
  loginWithGoogle,
  loginWithFacebook,
  loginWithApple,
  requestMFA,
  forgotPassword,
  resetPassword,
  setAuthToken,
  getToken,
  getStoredUser,
  clearToken,
  isAuthenticated,
  getCurrentUser,
} from '../authService'

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('setAuthToken / getToken / getStoredUser / clearToken', () => {
    it('stores and retrieves token and user', () => {
      setAuthToken('tok123', { email: 'a@b.com' })
      expect(localStorage.setItem).toHaveBeenCalledWith('smart_health_tracker_token', 'tok123')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'smart_health_tracker_user',
        JSON.stringify({ email: 'a@b.com' }),
      )
    })

    it('isAuthenticated returns false when no token', () => {
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('login', () => {
    it('returns success with token on successful login', async () => {
      apiClient.post.mockResolvedValue({
        data: { access_token: 'jwt123', token_type: 'Bearer', expires_in: 3600 },
      })

      const result = await login({ email: 'test@test.com', password: 'pass' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@test.com',
        password: 'pass',
      })
      expect(result.success).toBe(true)
      expect(result.token).toBe('jwt123')
    })

    it('returns mfaRequired when MFA is needed', async () => {
      apiClient.post.mockResolvedValue({
        data: { mfa_required: true, message: 'Enter MFA code' },
      })

      const result = await login({ email: 'test@test.com', password: 'pass' })

      expect(result.success).toBe(true)
      expect(result.mfaRequired).toBe(true)
    })

    it('returns error on failed login', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      })

      const result = await login({ email: 'test@test.com', password: 'wrong' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('register', () => {
    it('returns success with uid on registration', async () => {
      apiClient.post.mockResolvedValue({
        data: { message: 'User created', uid: 'abc123' },
      })

      const result = await register('John', 'john@test.com', 'pass123')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'John',
        email: 'john@test.com',
        password: 'pass123',
        role: 'user',
      })
      expect(result.success).toBe(true)
      expect(result.data.uid).toBe('abc123')
    })

    it('returns error on failed registration', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { error: 'Email already exists' } },
      })

      const result = await register('John', 'john@test.com', 'pass123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })
  })

  describe('verifyEmail', () => {
    it('sends uid and code to verify endpoint', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Verified' } })

      const result = await verifyEmail('uid123', '123456')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/verify-email', {
        uid: 'uid123',
        code: '123456',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('resendVerificationCode', () => {
    it('sends email to request-verification endpoint', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Sent' } })

      const result = await resendVerificationCode('test@test.com')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/request-verification', {
        email: 'test@test.com',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('enableMFA', () => {
    it('sends current_password to enable-mfa', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'MFA enabled' } })

      const result = await enableMFA('mypassword')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/enable-mfa', {
        current_password: 'mypassword',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('verifyMFA', () => {
    it('returns token on successful MFA verification', async () => {
      apiClient.post.mockResolvedValue({
        data: { access_token: 'mfa_token', token_type: 'Bearer', expires_in: 3600 },
      })

      const result = await verifyMFA('test@test.com', '123456')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/verify-mfa', {
        email: 'test@test.com',
        code: '123456',
      })
      expect(result.success).toBe(true)
      expect(result.token).toBe('mfa_token')
    })
  })

  describe('logout', () => {
    it('calls logout endpoint and clears token', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await logout()

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout')
      expect(localStorage.removeItem).toHaveBeenCalledWith('smart_health_tracker_token')
      expect(result.success).toBe(true)
    })
  })

  describe('loginWithGoogle', () => {
    it('sends id_token to google login endpoint', async () => {
      apiClient.post.mockResolvedValue({
        data: { access_token: 'google_tok' },
      })

      const result = await loginWithGoogle('google_id_token')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login/google', {
        id_token: 'google_id_token',
      })
      expect(result.success).toBe(true)
      expect(result.token).toBe('google_tok')
    })
  })

  describe('loginWithFacebook', () => {
    it('sends access_token to facebook login endpoint', async () => {
      apiClient.post.mockResolvedValue({
        data: { access_token: 'fb_tok' },
      })

      const result = await loginWithFacebook('fb_access_token')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login/facebook', {
        access_token: 'fb_access_token',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('loginWithApple', () => {
    it('sends id_token to apple login endpoint', async () => {
      apiClient.post.mockResolvedValue({
        data: { access_token: 'apple_tok' },
      })

      const result = await loginWithApple('apple_id_token')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login/apple', {
        id_token: 'apple_id_token',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('requestMFA', () => {
    it('sends uid to request-mfa', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Code sent' } })

      const result = await requestMFA('uid123')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/request-mfa', { uid: 'uid123' })
      expect(result.success).toBe(true)
    })
  })

  describe('forgotPassword', () => {
    it('sends email to forgot-password', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Reset email sent' } })

      const result = await forgotPassword('test@test.com')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@test.com',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('resetPassword', () => {
    it('sends email, code, new_password to reset-password', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Password reset' } })

      const result = await resetPassword('test@test.com', '123456', 'newpass')

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        email: 'test@test.com',
        code: '123456',
        new_password: 'newpass',
      })
      expect(result.success).toBe(true)
    })
  })
})
