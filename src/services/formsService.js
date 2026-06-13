import { apiClient } from './apiClient'
import { FORM_ENDPOINTS, VITAL_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Forms/Questionnaires Service - Real API Integration
 * Handles form submissions and retrieval
 */

/**
 * Submit a form/questionnaire
 */
export async function submitForm(formType, answers) {
  try {
    const payload = {
      formType,
      answers,
    }

    const response = await apiClient.post(VITAL_ENDPOINTS.RECORD_VITAL, payload)

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to submit form',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to submit form',
    }
  }
}

/**
 * Get list of submitted forms
 */
export async function getForms(page = 1, pageSize = 20, formType = null) {
  try {
    const params = {
      page,
      pageSize,
    }

    if (formType) {
      params.formType = formType
    }

    const response = await apiClient.get(FORM_ENDPOINTS.GET_FORMS, { params })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch forms',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch forms',
    }
  }
}

/**
 * Get specific form by ID
 */
export async function getFormById(id) {
  try {
    const response = await apiClient.get(FORM_ENDPOINTS.GET_FORM_BY_ID(id))

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch form',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch form',
    }
  }
}

/**
 * Get form history/past submissions
 */
export async function getFormHistory(page = 1, pageSize = 20, formType = null) {
  try {
    const params = {
      page,
      pageSize,
    }

    if (formType) {
      params.formType = formType
    }

    const response = await apiClient.get(FORM_ENDPOINTS.GET_FORM_HISTORY, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch form history',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch form history',
    }
  }
}

/**
 * Export forms data
 */
export async function exportForms(format = 'csv', dateFrom = null, dateTo = null) {
  try {
    const params = {
      format,
    }

    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    const response = await apiClient.get(FORM_ENDPOINTS.EXPORT_FORMS, { params })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to export forms',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to export forms',
    }
  }
}
