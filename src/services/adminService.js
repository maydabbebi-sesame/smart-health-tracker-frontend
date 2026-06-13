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
    return { success: true, data: response.data }
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
    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_USERS)
    return { success: true, data: response.data }
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
    return { success: true, data: response.data }
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
    await apiClient.delete(ADMIN_ENDPOINTS.DELETE_USER(id))
    return { success: true }
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
    const response = await apiClient.get(ADMIN_ENDPOINTS.GET_ACTIVITY_LOG)
    return { success: true, data: response.data }
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
