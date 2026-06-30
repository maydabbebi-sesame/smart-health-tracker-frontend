import { apiClient } from './apiClient'
import { FORM_ENDPOINTS } from '../constants/apiEndpoints'
import { getCurrentUser } from './authService'

/**
 * Forms/Questionnaires Service - Real API Integration
 * Handles form submissions and retrieval
 */

/**
 * Submit a form/questionnaire
 */
export async function submitForm(formType, answers) {
  try {
    const user = getCurrentUser()
    const userUid = user?.uid || null

    const payload = {
      user_uid: userUid,
      questionnaire_name: formType,
      answers,
    }

    const response = await apiClient.post(FORM_ENDPOINTS.SUBMIT_FORM, payload)
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de soumettre le formulaire',
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
      error: response.data.error || 'Impossible de récupérer les formulaires',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les formulaires',
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
      error: response.data.error || 'Impossible de récupérer le formulaire',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer le formulaire',
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
      error: response.data.error || 'Impossible de récupérer l\'historique des formulaires',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer l\'historique des formulaires',
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
      error: response.data.error || 'Impossible d\'exporter les formulaires',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'exporter les formulaires',
    }
  }
}
