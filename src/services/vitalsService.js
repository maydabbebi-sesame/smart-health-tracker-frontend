import { apiClient } from './apiClient'
import { VITAL_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Vital Signs Service - Real API Integration
 * Handles vital measurements and health metrics
 */

/**
 * Record a new vital measurement
 */
export async function recordVital(vitalData) {
  try {
    const response = await apiClient.post(VITAL_ENDPOINTS.RECORD_VITAL, vitalData)

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to record vital',
    }
  } catch (error) {
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
 * Get list of vitals with pagination
 */
export async function getVitals(page = 1, pageSize = 20, type = null) {
  try {
    const params = {
      page,
      pageSize,
    }

    if (type) {
      params.type = type
    }

    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITALS, { params })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch vitals',
    }
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch vital',
    }
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to update vital',
    }
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
    const response = await apiClient.delete(VITAL_ENDPOINTS.DELETE_VITAL(id))

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to delete vital',
    }
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
 */
export async function getVitalEvolution(type, timeRange = 'week') {
  try {
    const params = {
      type,
      timeRange,
    }

    const response = await apiClient.get(VITAL_ENDPOINTS.GET_VITAL_EVOLUTION, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch vital evolution',
    }
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
 */
export async function exportVitals(format = 'csv', dateFrom = null, dateTo = null) {
  try {
    const params = {
      format,
    }

    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    const response = await apiClient.get(VITAL_ENDPOINTS.EXPORT_VITALS, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to export vitals',
    }
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch latest vital',
    }
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
