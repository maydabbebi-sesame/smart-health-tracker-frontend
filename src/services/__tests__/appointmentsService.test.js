import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../__tests__/setup.js'

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  confirmAppointment,
  sendReminder,
} from '../appointmentsService'

describe('appointmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAppointment', () => {
    it('posts appointment data and returns success', async () => {
      const data = { user_uid: 'u1', doctor_uid: 'd1', appointment_date: '2024-06-15', appointment_time: '10:00' }
      apiClient.post.mockResolvedValue({ data: { uid: 'a1', ...data } })

      const result = await createAppointment(data)

      expect(apiClient.post).toHaveBeenCalledWith('/api/appointments', data)
      expect(result.success).toBe(true)
      expect(result.data.uid).toBe('a1')
    })

    it('returns error on failure', async () => {
      apiClient.post.mockRejectedValue({ response: { data: { error: 'Missing required fields' } } })

      const result = await createAppointment({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing required fields')
    })
  })

  describe('getAppointments', () => {
    it('fetches appointments list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'a1' }] })

      const result = await getAppointments()

      expect(apiClient.get).toHaveBeenCalledWith('/api/appointments', { params: {} })
      expect(result.success).toBe(true)
    })

    it('passes status filter param', async () => {
      apiClient.get.mockResolvedValue({ data: [] })

      await getAppointments(1, 20, 'scheduled')

      expect(apiClient.get).toHaveBeenCalledWith('/api/appointments', { params: { status: 'scheduled' } })
    })
  })

  describe('getAppointmentById', () => {
    it('fetches a specific appointment', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'a1', status: 'scheduled' } })

      const result = await getAppointmentById('a1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/appointments/a1')
      expect(result.success).toBe(true)
    })
  })

  describe('updateAppointment', () => {
    it('updates appointment data', async () => {
      apiClient.put.mockResolvedValue({ data: { uid: 'a1', reason: 'Updated' } })

      const result = await updateAppointment('a1', { reason: 'Updated' })

      expect(apiClient.put).toHaveBeenCalledWith('/api/appointments/a1', { reason: 'Updated' })
      expect(result.success).toBe(true)
    })
  })

  describe('cancelAppointment', () => {
    it('cancels appointment with reason', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Cancelled' } })

      const result = await cancelAppointment('a1', 'No longer needed')

      expect(apiClient.post).toHaveBeenCalledWith('/api/appointments/a1/cancel', { reason: 'No longer needed' })
      expect(result.success).toBe(true)
    })

    it('cancels without reason', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Cancelled' } })

      const result = await cancelAppointment('a1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/appointments/a1/cancel', {})
      expect(result.success).toBe(true)
    })
  })

  describe('getAvailableSlots', () => {
    it('fetches available slots for a doctor', async () => {
      apiClient.get.mockResolvedValue({ data: { available_slots: ['09:00', '09:30'] } })

      const result = await getAvailableSlots('d1', '2024-06-15')

      expect(apiClient.get).toHaveBeenCalledWith('/api/appointments/available-slots', {
        params: { doctorId: 'd1', date: '2024-06-15' },
      })
      expect(result.success).toBe(true)
      expect(result.data.available_slots).toHaveLength(2)
    })
  })

  describe('confirmAppointment', () => {
    it('confirms an appointment', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Confirmed' } })

      const result = await confirmAppointment('a1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/appointments/a1/confirm', {})
      expect(result.success).toBe(true)
    })
  })

  describe('sendReminder', () => {
    it('sends a reminder for an appointment', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Reminder sent' } })

      const result = await sendReminder('a1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/appointments/a1/reminder', {})
      expect(result.success).toBe(true)
    })
  })
})
