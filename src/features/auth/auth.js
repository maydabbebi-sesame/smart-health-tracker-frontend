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
  enableMFA,
  verifyMFA,
  logout,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
  loginWithFacebook,
  loginWithApple,
} from '../../services/authService'
