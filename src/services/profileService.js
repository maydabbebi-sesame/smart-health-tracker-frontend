import { apiClient } from './apiClient'
import { USER_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Profile/User Service - Real API Integration
 * Handles user profile operations
 */

/**
 * Get user profile
 */
export async function getPatientProfile() {
  try {
    const response = await apiClient.get(USER_ENDPOINTS.GET_PROFILE)

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch profile',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch profile',
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData) {
  try {
    const response = await apiClient.put(USER_ENDPOINTS.UPDATE_PROFILE, profileData)

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to update profile',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to update profile',
    }
  }
}

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await apiClient.post(USER_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    })

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to change password',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to change password',
    }
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(
      USER_ENDPOINTS.UPLOAD_PROFILE_PICTURE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to upload profile picture',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to upload profile picture',
    }
  }
}

/**
 * Delete account
 */
export async function deleteAccount() {
  try {
    const response = await apiClient.delete(USER_ENDPOINTS.DELETE_ACCOUNT)

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to delete account',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to delete account',
    }
  }
}
