import { apiClient } from './apiClient'
import { MEDICAL_HISTORY_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Medical History Service - Real API Integration
 * Handles the patient's medical history (conditions) entries
 *
 * Backend POST /api/medical-history accepts: { title, date_label?, status? }
 * Backend GET /api/medical-history returns: [ { uid, title, date_label, status, created_at, updated_at } ]
 */

export async function getMedicalHistory() {
  try {
    const response = await apiClient.get(MEDICAL_HISTORY_ENDPOINTS.GET_MEDICAL_HISTORY)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les antécédents médicaux',
    }
  }
}

export async function createMedicalHistoryEntry(entryData) {
  try {
    const response = await apiClient.post(MEDICAL_HISTORY_ENDPOINTS.CREATE_MEDICAL_HISTORY, entryData)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'ajouter l\'antécédent médical',
    }
  }
}

export async function updateMedicalHistoryEntry(id, entryData) {
  try {
    const response = await apiClient.put(MEDICAL_HISTORY_ENDPOINTS.UPDATE_MEDICAL_HISTORY(id), entryData)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de mettre à jour l\'antécédent médical',
    }
  }
}

export async function deleteMedicalHistoryEntry(id) {
  try {
    await apiClient.delete(MEDICAL_HISTORY_ENDPOINTS.DELETE_MEDICAL_HISTORY(id))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de supprimer l\'antécédent médical',
    }
  }
}
