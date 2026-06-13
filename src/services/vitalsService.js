import { apiClient } from './apiClient'
import { VITAL_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Vital Signs Service - Real API Integration
 * Handles vital measurements and health metrics
 *
 * Backend POST /api/vitals accepts: { user_uid, age?, gender?, height?, heart_rate, systolic_bp, diastolic_bp, temperature?, oxygen_saturation?, respiratory_rate?, notes?, weight?, glycemia?, weight_variation?, weight_variation_kg?, health_issues_history?, drug_allergies_flag?, drug_allergies?, family_health_issues?, smoking?, cigarettes_per_day?, alcohol?, alcohol_glasses?, current_treatment?, current_treatments?, complements?, complements_text?, observance?, symptoms?, pain_intensity?, symptoms_description?, symptoms_duration?, pain_location?, triggers?, general_state? }
 * Backend GET /api/vitals returns: [ { uid, user_uid, age, gender, height, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation, respiratory_rate, notes, weight, glycemia, weight_variation, weight_variation_kg, health_issues_history, drug_allergies_flag, drug_allergies, family_health_issues, smoking, cigarettes_per_day, alcohol, alcohol_glasses, current_treatment, current_treatments, complements, complements_text, observance, symptoms, pain_intensity, symptoms_description, symptoms_duration, pain_location, triggers, general_state, recorded_at } ]
 */

/**
 * Record a new vital measurement
 */
export async function recordVital(vitalData) {
  try {
    console.log('Recording vital with payload:', vitalData)
    const response = await apiClient.post(VITAL_ENDPOINTS.RECORD_VITAL, vitalData)
    console.log('Vital recorded successfully:', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Error recording vital:', error.response?.data || error.message)
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to record vital',
    }
  }
}

/**
 * Get list of vitals
 * Backend accepts query params: user_uid (optional)
 */
export async function getVitals(page = 1, pageSize = 20, userUid = null) {
  try {
    const params = {}
    if (userUid) {
      params.user_uid = userUid
    }

    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITALS, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch vitals',
    }
  }
}

/**
 * Get specific vital by ID
 */
export async function getVitalById(id) {
  try {
    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITAL_BY_ID(id))
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch vital',
    }
  }
}

/**
 * Update a vital measurement
 */
export async function updateVital(id, vitalData) {
  try {
    const response = await apiClient.put(
      VITAL_ENDPOINTS.UPDATE_VITAL(id),
      vitalData,
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to update vital',
    }
  }
}

/**
 * Delete a vital measurement
 */
export async function deleteVital(id) {
  try {
    await apiClient.delete(VITAL_ENDPOINTS.DELETE_VITAL(id))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to delete vital',
    }
  }
}

/**
 * Get vital evolution/trend data
 * Backend expects query params: measure (required), user_uid (optional), from (optional), to (optional)
 */
export async function getVitalEvolution(measure, from = null, to = null, userUid = null) {
  try {
    const params = { measure }
    if (from) params.from = from
    if (to) params.to = to
    if (userUid) params.user_uid = userUid

    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITAL_EVOLUTION, {
      params,
    })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch vital evolution',
    }
  }
}

/**
 * Export vitals data
 * Backend expects query params: format (csv|pdf), user_uid (optional), from (optional), to (optional)
 */
export async function exportVitals(format = 'csv', from = null, to = null, userUid = null) {
  try {
    const params = { format }
    if (from) params.from = from
    if (to) params.to = to
    if (userUid) params.user_uid = userUid

    const response = await apiClient.get(VITAL_ENDPOINTS.EXPORT_VITALS, {
      params,
      responseType: 'blob',
    })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to export vitals',
    }
  }
}

/**
 * Get latest vital of a specific type
 */
export async function getLatestVital(type) {
  try {
    const response = await apiClient.get(VITAL_ENDPOINTS.GET_LATEST_VITAL(type))
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch latest vital',
    }
  }
}
