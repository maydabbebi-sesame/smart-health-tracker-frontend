import { apiClient } from './apiClient'
import { AI_ENDPOINTS } from '../constants/apiEndpoints'

export async function getRecommendations() {
  try {
    const response = await apiClient.get(AI_ENDPOINTS.GET_RECOMMENDATIONS)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message }
  }
}
