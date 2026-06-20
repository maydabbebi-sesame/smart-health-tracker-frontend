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
        'Impossible d\'enregistrer le relevé',
    }
  }
}

/**
 * Get list of vitals
 * Backend accepts query params: user_uid (optional), period (optional: week|month|3months)
 */
export async function getVitals(page = 1, pageSize = 20, userUid = null, period = null) {
  try {
    const params = {}
    if (userUid) {
      params.user_uid = userUid
    }
    if (period) {
      params.period = period
    }

    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITALS, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les relevés',
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
        'Impossible de récupérer le relevé',
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
        'Impossible de mettre à jour le relevé',
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
        'Impossible de supprimer le relevé',
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
        'Impossible de récupérer l\'évolution du relevé',
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
        'Impossible d\'exporter les relevés',
    }
  }
}

/**
 * Export an AI-generated trend analysis as a downloadable PDF.
 * Backend renders the PDF (auth + layout); the analysis text itself comes
 * from mediAssistService.getTrendsAnalysis().
 */
export async function exportTrendAnalysisPdf(period, analysis, userUid = null) {
  try {
    const payload = { period, analysis }
    if (userUid) {
      payload.user_uid = userUid
    }

    const response = await apiClient.post(VITAL_ENDPOINTS.EXPORT_ANALYSIS_PDF, payload, {
      responseType: 'blob',
    })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'exporter l\'analyse de tendance',
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
        'Impossible de récupérer le dernier relevé',
    }
  }
}
