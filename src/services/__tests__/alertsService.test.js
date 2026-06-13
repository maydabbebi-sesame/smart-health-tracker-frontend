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
  getAlerts,
  getAlertById,
  markAlertAsRead,
  markAlertAsUnread,
  acknowledgeAlert,
  deleteAlert,
  deleteAllAlerts,
  getUnreadAlertCount,
} from '../alertsService'

describe('alertsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAlerts', () => {
    it('fetches alerts list', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'al1', title: 'High BP' }] })

      const result = await getAlerts()

      expect(apiClient.get).toHaveBeenCalledWith('/api/alerts', { params: {} })
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('passes unread_only param', async () => {
      apiClient.get.mockResolvedValue({ data: [] })

      await getAlerts(1, 20, true)

      expect(apiClient.get).toHaveBeenCalledWith('/api/alerts', { params: { unread_only: 'true' } })
    })
  })

  describe('getAlertById', () => {
    it('fetches a specific alert', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'al1', title: 'Alert' } })

      const result = await getAlertById('al1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/alerts/al1')
      expect(result.success).toBe(true)
    })
  })

  describe('markAlertAsRead', () => {
    it('marks alert as read', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await markAlertAsRead('al1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/alerts/al1/read', {})
      expect(result.success).toBe(true)
    })
  })

  describe('markAlertAsUnread', () => {
    it('marks alert as unread', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await markAlertAsUnread('al1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/alerts/al1/unread', {})
      expect(result.success).toBe(true)
    })
  })

  describe('acknowledgeAlert', () => {
    it('acknowledges an alert', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await acknowledgeAlert('al1')

      expect(apiClient.post).toHaveBeenCalledWith('/api/alerts/al1/acknowledge', {})
      expect(result.success).toBe(true)
    })
  })

  describe('deleteAlert', () => {
    it('deletes an alert', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteAlert('al1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/alerts/al1')
      expect(result.success).toBe(true)
    })
  })

  describe('deleteAllAlerts', () => {
    it('deletes all alerts', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await deleteAllAlerts()

      expect(apiClient.post).toHaveBeenCalledWith('/api/alerts/delete-all', {})
      expect(result.success).toBe(true)
    })
  })

  describe('getUnreadAlertCount', () => {
    it('fetches unread count', async () => {
      apiClient.get.mockResolvedValue({ data: { unread_count: 5 } })

      const result = await getUnreadAlertCount()

      expect(apiClient.get).toHaveBeenCalledWith('/api/alerts/unread-count')
      expect(result.success).toBe(true)
      expect(result.data.unread_count).toBe(5)
    })
  })
})
