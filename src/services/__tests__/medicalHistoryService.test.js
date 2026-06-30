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
  getMedicalHistory,
  createMedicalHistoryEntry,
  updateMedicalHistoryEntry,
  deleteMedicalHistoryEntry,
} from '../medicalHistoryService'

describe('medicalHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMedicalHistory', () => {
    it('fetches the medical history list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'mh1', title: 'Asthme' }] })

      const result = await getMedicalHistory()

      expect(apiClient.get).toHaveBeenCalledWith('/api/medical-history')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('returns error on failure', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { error: 'Unauthorized' } } })

      const result = await getMedicalHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('createMedicalHistoryEntry', () => {
    it('creates a medical history entry', async () => {
      apiClient.post.mockResolvedValue({ data: { uid: 'mh1', message: 'Medical history entry added successfully' } })

      const result = await createMedicalHistoryEntry({ title: 'Asthme léger', status: 'Stable' })

      expect(apiClient.post).toHaveBeenCalledWith('/api/medical-history', { title: 'Asthme léger', status: 'Stable' })
      expect(result.success).toBe(true)
    })
  })

  describe('updateMedicalHistoryEntry', () => {
    it('updates a medical history entry', async () => {
      apiClient.put.mockResolvedValue({ data: { message: 'Medical history entry updated successfully' } })

      const result = await updateMedicalHistoryEntry('mh1', { status: 'Active' })

      expect(apiClient.put).toHaveBeenCalledWith('/api/medical-history/mh1', { status: 'Active' })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteMedicalHistoryEntry', () => {
    it('deletes a medical history entry', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteMedicalHistoryEntry('mh1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/medical-history/mh1')
      expect(result.success).toBe(true)
    })
  })
})
