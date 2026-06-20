import { apiClient } from './apiClient'
import { DOCTOR_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Doctors Service - Real API Integration
 * Handles doctor listings, search, and details
 */

/**
 * Get list of all doctors
 */
export async function getDoctors(page = 1, pageSize = 20, specialization = null, location = null) {
  try {
    const params = {}
    if (specialization) params.specialization = specialization
    if (location) params.location = location

    const response = await apiClient.get(DOCTOR_ENDPOINTS.GET_DOCTORS, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les médecins',
    }
  }
}

/**
 * Doctor Agent: search platform doctors + the scraped med.tn directory +
 * Google Places, combined, around a patient-given address.
 */
export async function searchNearbyDoctors(address, specialization = null) {
  try {
    const params = { address }
    if (specialization) params.specialization = specialization

    const response = await apiClient.get(DOCTOR_ENDPOINTS.SEARCH_NEARBY, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de rechercher des médecins à proximité',
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
        'Impossible de récupérer le médecin',
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
        'Impossible de récupérer les disponibilités du médecin',
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
        'Impossible de rechercher des médecins',
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
        'Impossible de récupérer les rendez-vous du médecin',
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
        'Impossible de noter le médecin',
    }
  }
}
