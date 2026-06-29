import { apiClient } from './apiClient'
import { APPOINTMENT_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Appointments Service - Real API Integration
 * Handles appointment scheduling and management
 *
 * Backend POST /api/appointments expects: { user_uid, doctor_uid, appointment_date, appointment_time, reason?, reminder_days? }
 * Backend GET /api/appointments returns: [ { uid, user_uid, doctor_uid, appointment_date, appointment_time, reason, status } ]
 */

/**
 * Create a new appointment
 */
export async function createAppointment(appointmentData) {
  try {
    const response = await apiClient.post(
      APPOINTMENT_ENDPOINTS.CREATE_APPOINTMENT,
      appointmentData,
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de créer le rendez-vous',
    }
  }
}

/**
 * Get user's appointments
 */
export async function getAppointments(page = 1, pageSize = 20, status = null, userUid = null) {
  try {
    const params = {}
    if (status) params.status = status
    if (userUid) params.user_uid = userUid

    const response = await apiClient.get(APPOINTMENT_ENDPOINTS.GET_APPOINTMENTS, {
      params,
    })
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer les rendez-vous',
    }
  }
}

/**
 * Get specific appointment by ID
 */
export async function getAppointmentById(id) {
  try {
    const response = await apiClient.get(
      APPOINTMENT_ENDPOINTS.GET_APPOINTMENT_BY_ID(id),
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de récupérer le rendez-vous',
    }
  }
}

/**
 * Update an appointment
 */
export async function updateAppointment(id, appointmentData) {
  try {
    const response = await apiClient.put(
      APPOINTMENT_ENDPOINTS.UPDATE_APPOINTMENT(id),
      appointmentData,
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de mettre à jour le rendez-vous',
    }
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id, reason = null) {
  try {
    const payload = {}
    if (reason) payload.reason = reason

    const response = await apiClient.post(
      APPOINTMENT_ENDPOINTS.CANCEL_APPOINTMENT(id),
      payload,
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'annuler le rendez-vous',
    }
  }
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(id) {
  try {
    const response = await apiClient.post(
      APPOINTMENT_ENDPOINTS.CONFIRM_APPOINTMENT(id),
      {},
    )
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible de confirmer le rendez-vous',
    }
  }
}

