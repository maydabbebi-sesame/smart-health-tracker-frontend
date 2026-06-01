const TOKEN_KEY = 'smart_health_tracker_token'

export function createFakeJwt(payload = {}) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(
    JSON.stringify({
      sub: 'demo-user',
      name: payload.name || 'Maya Ben Ali',
      email: payload.email || 'maya@smarthealth.local',
      role: payload.role || 'patient',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }),
  )

  return `${header}.${body}.fake-signature`
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getCurrentUser() {
  const token = getToken()

  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))

    if (decoded.exp && decoded.exp <= Math.floor(Date.now() / 1000)) {
      clearToken()
      return null
    }

    return decoded
  } catch {
    clearToken()
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser())
}

export function loginWithFakeJwt(credentials = {}) {
  const token = createFakeJwt(credentials)
  setToken(token)
  return token
}
