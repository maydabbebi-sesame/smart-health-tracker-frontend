import { apiClient } from './apiClient'
import { DOCTOR_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Doctors Service - Real API Integration
 * Handles doctor listings, search, and details
 */

/**
 * Get list of all doctors
 */
export async function getDoctors(page = 1, pageSize = 20, specialization = null) {
  try {
    const params = {
      page,
      pageSize,
    }

    if (specialization) {
      params.specialization = specialization
    }

    const response = await apiClient.get(DOCTOR_ENDPOINTS.GET_DOCTORS, { params })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch doctors',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch doctors',
    }
  }
}

/**
 * Get specific doctor by ID
 */
export async function getDoctorById(id) {
  try {
    const response = await apiClient.get(DOCTOR_ENDPOINTS.GET_DOCTOR_BY_ID(id))

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch doctor',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch doctor',
    }
  }
}

/**
 * Get doctor's availability
 */
export async function getDoctorAvailability(id) {
  try {
    const response = await apiClient.get(
      DOCTOR_ENDPOINTS.GET_DOCTOR_AVAILABILITY(id),
    )

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch doctor availability',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch doctor availability',
    }
  }
}

/**
 * Search doctors by name or specialization
 */
export async function searchDoctors(query, page = 1, pageSize = 20) {
  try {
    const params = {
      search: query,
      page,
      pageSize,
    }

    const response = await apiClient.get(DOCTOR_ENDPOINTS.SEARCH_DOCTORS, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to search doctors',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to search doctors',
    }
  }
}

/**
 * Get doctor's appointments
 */
export async function getDoctorAppointments(id, page = 1, pageSize = 20) {
  try {
    const params = {
      page,
      pageSize,
    }

    const response = await apiClient.get(
      DOCTOR_ENDPOINTS.GET_DOCTOR_APPOINTMENTS(id),
      { params },
    )

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch doctor appointments',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch doctor appointments',
    }
  }
}

/**
 * Rate a doctor
 */
export async function rateDoctor(id, rating, review = null) {
  try {
    const payload = {
      rating,
    }

    if (review) {
      payload.review = review
    }

    const response = await apiClient.post(
      DOCTOR_ENDPOINTS.RATE_DOCTOR(id),
      payload,
    )

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to rate doctor',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to rate doctor',
    }
  }
}
