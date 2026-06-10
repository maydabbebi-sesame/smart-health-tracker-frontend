import { apiClient } from './apiClient'
import { ADMIN_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Admin Service - Real API Integration
 * Handles admin dashboard and user management operations
 */

/**
 * Get admin statistics
 */
export async function getAdminStatistics() {
  try {
    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_STATISTICS)

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch statistics',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch statistics',
    }
  }
}

/**
 * Get list of all users (admin only)
 */
export async function getUsers(page = 1, pageSize = 20) {
  try {
    const params = {
      page,
      pageSize,
    }

    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_USERS, { params })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch users',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch users',
    }
  }
}

/**
 * Get specific user details (admin only)
 */
export async function getUser(id) {
  try {
    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_USER(id))

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch user',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch user',
    }
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(id) {
  try {
    const response = await apiClient.delete(ADMIN_ENDPOINTS.DELETE_USER(id))

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to delete user',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to delete user',
    }
  }
}

/**
 * Get activity log (admin only)
 */
export async function getActivityLog(page = 1, pageSize = 20) {
  try {
    const params = {
      page,
      pageSize,
    }

    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_ACTIVITY_LOG, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch activity log',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch activity log',
    }
  }
}
