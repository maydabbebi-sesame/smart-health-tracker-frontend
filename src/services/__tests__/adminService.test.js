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
  getAdminStatistics,
  getUsers,
  getUser,
  deleteUser,
  getActivityLog,
} from '../adminService'

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAdminStatistics', () => {
    it('fetches admin statistics', async () => {
      apiClient.get.mockResolvedValue({
        data: { total_users: 100, total_doctors: 15, total_appointments: 250 },
      })

      const result = await getAdminStatistics()

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/statistics')
      expect(result.success).toBe(true)
      expect(result.data.total_users).toBe(100)
    })

    it('returns error on failure', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { error: 'Forbidden' } } })

      const result = await getAdminStatistics()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Forbidden')
    })
  })

  describe('getUsers', () => {
    it('fetches all users', async () => {
      apiClient.get.mockResolvedValue({ data: [{ uid: 'u1', name: 'John' }] })

      const result = await getUsers()

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })
  })

  describe('getUser', () => {
    it('fetches a specific user', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'u1', name: 'John', email: 'john@test.com' } })

      const result = await getUser('u1')

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/users/u1')
      expect(result.success).toBe(true)
      expect(result.data.email).toBe('john@test.com')
    })
  })

  describe('deleteUser', () => {
    it('deletes a user', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteUser('u1')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/admin/users/u1')
      expect(result.success).toBe(true)
    })

    it('returns error when user not found', async () => {
      apiClient.delete.mockRejectedValue({ response: { data: { error: 'User not found' } } })

      const result = await deleteUser('invalid')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('getActivityLog', () => {
    it('fetches activity log', async () => {
      apiClient.get.mockResolvedValue({
        data: [{ uid: 'l1', action: 'user_registered', description: 'User John registered' }],
      })

      const result = await getActivityLog()

      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/activity-log')
      expect(result.success).toBe(true)
      expect(result.data[0].action).toBe('user_registered')
    })
  })
})
