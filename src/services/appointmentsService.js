import { apiClient } from './apiClient'
import { APPOINTMENT_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * Appointments Service - Real API Integration
 * Handles appointment scheduling and management
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to create appointment',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to create appointment',
    }
  }
}

/**
 * Get user's appointments
 */
export async function getAppointments(page = 1, pageSize = 20, status = null) {
  try {
    const params = {
      page,
      pageSize,
    }

    if (status) {
      params.status = status
    }

    const response = await apiClient.get(APPOINTMENT_ENDPOINTS.GET_APPOINTMENTS, {
      params,
    })

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch appointments',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch appointments',
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch appointment',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch appointment',
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to update appointment',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to update appointment',
    }
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id, reason = null) {
  try {
    const payload = {}
    if (reason) {
      payload.reason = reason
    }

    const response = await apiClient.post(
      APPOINTMENT_ENDPOINTS.CANCEL_APPOINTMENT(id),
      payload,
    )

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to cancel appointment',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to cancel appointment',
    }
  }
}

/**
 * Get available appointment slots for a doctor
 */
export async function getAvailableSlots(doctorId, date = null) {
  try {
    const params = {
      doctorId,
    }

    if (date) {
      params.date = date
    }

    const response = await apiClient.get(
      APPOINTMENT_ENDPOINTS.GET_AVAILABLE_SLOTS,
      { params },
    )

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to fetch available slots',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch available slots',
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

    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to confirm appointment',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to confirm appointment',
    }
  }
}

/**
 * Send appointment reminder
 */
export async function sendReminder(id) {
  try {
    const response = await apiClient.post(
      APPOINTMENT_ENDPOINTS.SEND_REMINDER(id),
      {},
    )

    if (response.data.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.data.error || 'Failed to send reminder',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to send reminder',
    }
  }
}
