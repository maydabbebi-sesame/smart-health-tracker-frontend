import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getCurrentUser } from './auth'

export function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
