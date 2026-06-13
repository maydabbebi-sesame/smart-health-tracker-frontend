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
    const params = {}
    if (specialization) params.specialization = specialization

    const response = await apiClient.get(DOCTOR_ENDPOINTS.GET_DOCTORS, { params })
    return { success: true, data: response.data }
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
    return { success: true, data: response.data }
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
    return { success: true, data: response.data }
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
    const params = { search: query }

    const response = await apiClient.get(DOCTOR_ENDPOINTS.SEARCH_DOCTORS, {
      params,
    })
    return { success: true, data: response.data }
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
    const response = await apiClient.get(
      DOCTOR_ENDPOINTS.GET_DOCTOR_APPOINTMENTS(id),
    )
    return { success: true, data: response.data }
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
    const payload = { rating }
    if (review) payload.review = review

    const response = await apiClient.post(
      DOCTOR_ENDPOINTS.RATE_DOCTOR(id),
      payload,
    )
    return { success: true, data: response.data }
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
