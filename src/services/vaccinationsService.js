import { apiClient } from './apiClient'
import { VACCINATION_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Vaccinations Service - Real API Integration
 * Handles the patient's vaccination records
 *
 * Backend POST /api/vaccinations accepts: { name, date_label?, status? }
 * Backend GET /api/vaccinations returns: [ { uid, name, date_label, status, created_at, updated_at } ]
 */

export async function getVaccinations() {
  try {
    const response = await apiClient.get(VACCINATION_ENDPOINTS.GET_VACCINATIONS)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les vaccinations',
    }
  }
}

export async function createVaccination(entryData) {
  try {
    const response = await apiClient.post(VACCINATION_ENDPOINTS.CREATE_VACCINATION, entryData)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'ajouter la vaccination',
    }
  }
}

export async function updateVaccination(id, entryData) {
  try {
    const response = await apiClient.put(VACCINATION_ENDPOINTS.UPDATE_VACCINATION(id), entryData)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de mettre à jour la vaccination',
    }
  }
}

export async function deleteVaccination(id) {
  try {
    await apiClient.delete(VACCINATION_ENDPOINTS.DELETE_VACCINATION(id))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de supprimer la vaccination',
    }
  }
}
