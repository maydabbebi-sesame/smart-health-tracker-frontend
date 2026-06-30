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
  getVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination,
} from '../vaccinationsService'

describe('vaccinationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVaccinations', () => {
    it('fetches the vaccinations list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'v1', name: 'COVID-19' }] })

      const result = await getVaccinations()

      expect(apiClient.get).toHaveBeenCalledWith('/api/vaccinations')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('returns error on failure', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { error: 'Unauthorized' } } })

      const result = await getVaccinations()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('createVaccination', () => {
    it('creates a vaccination record', async () => {
      apiClient.post.mockResolvedValue({ data: { uid: 'v1', message: 'Vaccination added successfully' } })

      const result = await createVaccination({ name: 'COVID-19', status: 'A jour' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/vaccinations', { name: 'COVID-19', status: 'A jour' })
      expect(result.success).toBe(true)
    })
  })

  describe('updateVaccination', () => {
    it('updates a vaccination record', async () => {
      apiClient.put.mockResolvedValue({ data: { message: 'Vaccination updated successfully' } })

      const result = await updateVaccination('v1', { status: 'À renouveler' })

      expect(apiClient.put).toHaveBeenCalledWith('/api/vaccinations/v1', { status: 'À renouveler' })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteVaccination', () => {
    it('deletes a vaccination record', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteVaccination('v1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/vaccinations/v1')
      expect(result.success).toBe(true)
    })
  })
})
