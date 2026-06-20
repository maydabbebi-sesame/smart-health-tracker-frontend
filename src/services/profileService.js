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
        'Impossible de récupérer le profil',
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
        'Impossible de mettre à jour le profil',
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
        'Impossible de modifier le mot de passe',
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
        'Impossible de télécharger la photo de profil',
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
        'Impossible de supprimer le compte',
    }
  }
}
