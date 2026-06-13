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
    return { success: true, data: response.data }
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
    return { success: true, data: response.data }
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
    await apiClient.post(USER_ENDPOINTS.CHANGE_PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return { success: true }
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
    return { success: true, data: response.data }
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
    await apiClient.delete(USER_ENDPOINTS.DELETE_ACCOUNT)
    return { success: true }
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
