import { getAlerts, getUnreadAlertCount } from './alertsService'

/**
 * Notification Service
 * Provides real-time alert notifications using alertsService
 */

/**
 * Get notifications (alias for alerts)
 */
export async function getNotifications(page = 1, pageSize = 20) {
  return getAlerts(page, pageSize, false)
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(page = 1, pageSize = 20) {
  return getAlerts(page, pageSize, true)
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  return getUnreadAlertCount()
}
