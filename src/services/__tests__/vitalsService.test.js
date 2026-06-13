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
  recordVital,
  getVitals,
  getVitalById,
  updateVital,
  deleteVital,
  getVitalEvolution,
  exportVitals,
  getLatestVital,
} from '../vitalsService'

describe('vitalsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordVital', () => {
    it('posts vital data and returns success', async () => {
      const vitalData = { user_uid: 'u1', heart_rate: 72, systolic_bp: 120, diastolic_bp: 80 }
      apiClient.post.mockResolvedValue({ data: { uid: 'v1', ...vitalData } })

      const result = await recordVital(vitalData)

      expect(apiClient.post).toHaveBeenCalledWith('/api/vitals', vitalData)
      expect(result.success).toBe(true)
      expect(result.data.uid).toBe('v1')
    })

    it('returns error on failure', async () => {
      apiClient.post.mockRejectedValue({ response: { data: { error: 'Missing field' } } })

      const result = await recordVital({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing field')
    })
  })

  describe('getVitals', () => {
    it('fetches vitals list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'v1' }, { uid: 'v2' }] })

      const result = await getVitals()

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals', { params: {} })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('passes user_uid param when provided', async () => {
      apiClient.get.mockResolvedValue({ data: [] })

      await getVitals(1, 20, 'user123')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals', { params: { user_uid: 'user123' } })
    })
  })

  describe('getVitalById', () => {
    it('fetches a specific vital', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'v1', heart_rate: 75 } })

      const result = await getVitalById('v1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals/v1')
      expect(result.success).toBe(true)
      expect(result.data.heart_rate).toBe(75)
    })
  })

  describe('updateVital', () => {
    it('updates a vital record', async () => {
      apiClient.put.mockResolvedValue({ data: { uid: 'v1', heart_rate: 80 } })

      const result = await updateVital('v1', { heart_rate: 80 })

      expect(apiClient.put).toHaveBeenCalledWith('/api/vitals/v1', { heart_rate: 80 })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteVital', () => {
    it('deletes a vital record', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteVital('v1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/vitals/v1')
      expect(result.success).toBe(true)
    })
  })

  describe('getVitalEvolution', () => {
    it('fetches evolution data with measure param', async () => {
      apiClient.get.mockResolvedValue({ data: [{ date: '2024-01-01', value: 72 }] })

      const result = await getVitalEvolution('heart_rate')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals/evolution', {
        params: { measure: 'heart_rate' },
      })
      expect(result.success).toBe(true)
    })

    it('passes all optional params', async () => {
      apiClient.get.mockResolvedValue({ data: [] })

      await getVitalEvolution('heart_rate', '2024-01-01', '2024-12-31', 'u1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals/evolution', {
        params: { measure: 'heart_rate', from: '2024-01-01', to: '2024-12-31', user_uid: 'u1' },
      })
    })
  })

  describe('exportVitals', () => {
    it('fetches export as blob', async () => {
      const blobData = Buffer.from('csv data')
      apiClient.get.mockResolvedValue({ data: blobData })

      const result = await exportVitals('csv')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals/export', {
        params: { format: 'csv' },
        responseType: 'blob',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('getLatestVital', () => {
    it('fetches latest vital by type', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'v5', heart_rate: 68 } })

      const result = await getLatestVital('heart_rate')

      expect(apiClient.get).toHaveBeenCalledWith('/api/vitals/latest/heart_rate')
      expect(result.success).toBe(true)
      expect(result.data.heart_rate).toBe(68)
    })

    it('returns error when type not found', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'No vital records found for this type' } },
      })

      const result = await getLatestVital('unknown')

      expect(result.success).toBe(false)
    })
  })
})
