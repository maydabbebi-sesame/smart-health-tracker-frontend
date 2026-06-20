import { apiClient } from './apiClient'
import { TRANSLATION_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Translations Service - Real API Integration
 * Fetches the EN/FR translation dictionary stored in the database
 */

export async function getTranslations(locale) {
  try {
    const response = await apiClient.get(TRANSLATION_ENDPOINTS.GET_TRANSLATIONS(locale))
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch translations',
    }
  }
}
