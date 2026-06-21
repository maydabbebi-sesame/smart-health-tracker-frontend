import axios from 'axios'

import { queryClient } from '../lib/queryClient'

const TOKEN_KEY = 'smart_health_tracker_token'
const USER_KEY = 'smart_health_tracker_user'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// A 401 on an /api/auth/* call (e.g. wrong credentials, bad MFA code) is a
// normal login-flow error and must be left to the caller. A 401 on any other
// endpoint means the stored session is no longer valid, so we clear it and
// send the user back to the login page instead of letting pages render with
// silently empty/stale data.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (status === 401 && !url.includes('/api/auth/')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      queryClient.clear()

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
