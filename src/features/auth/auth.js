/**
 * Legacy auth exports for backward compatibility
 * These re-export from the new authService
 */
export {
  getToken,
  setAuthToken,
  getStoredUser,
  clearToken,
  isAuthenticated,
  getCurrentUser,
  login,
  register,
  verifyEmail,
  resendVerificationCode,
  requestMFA,
  verifyMFA,
  logout,
  forgotPassword,
  resetPassword,
} from '../../services/authService'
