import { apiClient } from './apiClient'
import { ALERT_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Alerts Service - Real API Integration
 * Handles alert management (health alerts from vitals and forms)
 */

/**
 * Get all alerts for the user
 */
export async function getAlerts(page = 1, pageSize = 20, unreadOnly = false) {
  try {
    const params = {}
    if (unreadOnly) {
      params.unread_only = 'true'
    }

    const response = await apiClient.get(ALERT_ENDPOINTS.GET_ALERTS, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch alerts',
    }
  }
}

/**
 * Get specific alert by ID
 */
export async function getAlertById(id) {
  try {
    const response = await apiClient.get(ALERT_ENDPOINTS.GET_ALERT_BY_ID(id))
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch alert',
    }
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(id) {
  try {
    await apiClient.post(ALERT_ENDPOINTS.MARK_AS_READ(id), {})
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to mark alert as read',
    }
  }
}

/**
 * Mark alert as unread
 */
export async function markAlertAsUnread(id) {
  try {
    await apiClient.post(ALERT_ENDPOINTS.MARK_AS_UNREAD(id), {})
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to mark alert as unread',
    }
  }
}

/**
 * Acknowledge/dismiss an alert
 */
export async function acknowledgeAlert(id) {
  try {
    await apiClient.post(ALERT_ENDPOINTS.ACKNOWLEDGE_ALERT(id), {})
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to acknowledge alert',
    }
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(id) {
  try {
    await apiClient.delete(ALERT_ENDPOINTS.DELETE_ALERT(id))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to delete alert',
    }
  }
}

/**
 * Delete all alerts
 */
export async function deleteAllAlerts() {
  try {
    await apiClient.post(ALERT_ENDPOINTS.DELETE_ALL_ALERTS, {})
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to delete all alerts',
    }
  }
}

/**
 * Get count of unread alerts
 */
export async function getUnreadAlertCount() {
  try {
    const response = await apiClient.get(ALERT_ENDPOINTS.GET_UNREAD_COUNT)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch unread count',
    }
  }
}
