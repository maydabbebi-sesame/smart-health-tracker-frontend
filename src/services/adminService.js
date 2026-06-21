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
        'Impossible de récupérer les statistiques',
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
        'Impossible de récupérer les utilisateurs',
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
        'Impossible de récupérer l\'utilisateur',
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
        'Impossible de supprimer l\'utilisateur',
    }
  }
}

/**
 * Enable or disable a user account (admin only)
 */
export async function updateUserStatus(id, isActive) {
  try {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.UPDATE_USER_STATUS(id), { is_active: isActive })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Impossible de mettre à jour le statut de l'utilisateur",
    }
  }
}

/**
 * Change a user's role (admin only)
 */
export async function updateUserRole(id, role) {
  try {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.UPDATE_USER_ROLE(id), { role })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Impossible de mettre à jour le rôle de l'utilisateur",
    }
  }
}

/**
 * Invalidate a user's existing sessions, forcing them to log in again (admin only)
 */
export async function regenerateUserToken(id) {
  try {
    const response = await apiClient.post(ADMIN_ENDPOINTS.REGENERATE_USER_TOKEN(id))
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de régénérer le jeton de session',
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
        'Impossible de récupérer le journal d\'activité',
    }
  }
}
