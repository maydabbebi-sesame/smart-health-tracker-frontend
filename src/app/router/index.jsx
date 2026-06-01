import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AuthLayout } from '../../layouts/AuthLayout'
import { AppLayout } from '../../layouts/AppLayout'
import { AdminLayout } from '../../layouts/AdminLayout'
import { ProtectedRoute } from '../../features/auth/ProtectedRoute'
import { LoadingSkeleton } from '../../shared/ui/LoadingSkeleton'

const AdminDashboardPage = lazy(() => import('../../pages/admin/AdminDashboardPage'))
const AIAnalysisPage = lazy(() => import('../../pages/AIAnalysisPage'))
const DashboardPage = lazy(() => import('../../pages/DashboardPage'))
const HistoryPage = lazy(() => import('../../pages/HistoryPage'))
const LoginPage = lazy(() => import('../../pages/LoginPage'))
const NotificationsPage = lazy(() => import('../../pages/NotificationsPage'))
const ProfilePage = lazy(() => import('../../pages/ProfilePage'))
const RegisterPage = lazy(() => import('../../pages/RegisterPage'))
const SettingsPage = lazy(() => import('../../pages/SettingsPage'))
const SymptomsPage = lazy(() => import('../../pages/Symptoms/Symptoms'))

function PageLoader() {
  return <LoadingSkeleton />
}

function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: '/register',
        element: withSuspense(<RegisterPage />),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: withSuspense(<DashboardPage />),
          },
          {
            path: '/symptoms',
            element: withSuspense(<SymptomsPage />),
          },
          {
            path: '/history',
            element: <Navigate to="/health-history" replace />,
          },
          {
            path: '/health-history',
            element: withSuspense(<HistoryPage />),
          },
          {
            path: '/ai-analysis',
            element: withSuspense(<AIAnalysisPage />),
          },
          {
            path: '/notifications',
            element: withSuspense(<NotificationsPage />),
          },
          {
            path: '/profile',
            element: withSuspense(<ProfilePage />),
          },
          {
            path: '/settings',
            element: withSuspense(<SettingsPage />),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: withSuspense(<AdminDashboardPage />),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
