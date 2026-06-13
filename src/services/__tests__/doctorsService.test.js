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
  getDoctors,
  getDoctorById,
  getDoctorAvailability,
  searchDoctors,
  getDoctorAppointments,
  rateDoctor,
} from '../doctorsService'

describe('doctorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDoctors', () => {
    it('fetches doctors list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'd1', name: 'Dr. Smith' }] })

      const result = await getDoctors()

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors', { params: {} })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('passes specialization param', async () => {
      apiClient.get.mockResolvedValue({ data: [] })

      await getDoctors(1, 20, 'cardiology')

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors', { params: { specialization: 'cardiology' } })
    })
  })

  describe('getDoctorById', () => {
    it('fetches a specific doctor', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'd1', name: 'Dr. Smith' } })

      const result = await getDoctorById('d1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors/d1')
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Dr. Smith')
    })

    it('returns error when not found', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { error: 'Doctor not found' } } })

      const result = await getDoctorById('invalid')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Doctor not found')
    })
  })

  describe('getDoctorAvailability', () => {
    it('fetches doctor availability', async () => {
      apiClient.get.mockResolvedValue({ data: { available: true, slots: ['09:00'] } })

      const result = await getDoctorAvailability('d1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors/d1/availability')
      expect(result.success).toBe(true)
    })
  })

  describe('searchDoctors', () => {
    it('searches doctors by query', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'd1', name: 'Dr. Smith' }] })

      const result = await searchDoctors('Smith')

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors/search', {
        params: { search: 'Smith' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('getDoctorAppointments', () => {
    it('fetches appointments for a doctor', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'a1', status: 'scheduled' }] })

      const result = await getDoctorAppointments('d1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors/d1/appointments')
      expect(result.success).toBe(true)
    })
  })

  describe('rateDoctor', () => {
    it('rates a doctor with rating only', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Rating submitted' } })

      const result = await rateDoctor('d1', 5)

      expect(apiClient.post).toHaveBeenCalledWith('/api/doctors/d1/rate', { rating: 5 })
      expect(result.success).toBe(true)
    })

    it('rates a doctor with review', async () => {
      apiClient.post.mockResolvedValue({ data: { message: 'Rating submitted' } })

      const result = await rateDoctor('d1', 4, 'Great doctor!')

      expect(apiClient.post).toHaveBeenCalledWith('/api/doctors/d1/rate', {
        rating: 4,
        review: 'Great doctor!',
      })
      expect(result.success).toBe(true)
    })
  })
})
