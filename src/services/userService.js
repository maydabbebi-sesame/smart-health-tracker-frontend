import { apiClient } from './apiClient'
import { USER_ENDPOINTS } from '../constants/apiEndpoints'

export async function getProfile() {
  try {
    const response = await apiClient.get(USER_ENDPOINTS.GET_PROFILE)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message }
  }
}
