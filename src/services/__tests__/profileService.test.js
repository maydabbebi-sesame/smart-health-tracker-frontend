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
  getPatientProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture,
  deleteAccount,
} from '../profileService'

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPatientProfile', () => {
    it('fetches user profile', async () => {
      apiClient.get.mockResolvedValue({ data: { uid: 'u1', name: 'John', email: 'john@test.com' } })

      const result = await getPatientProfile()

      expect(apiClient.get).toHaveBeenCalledWith('/api/users/profile')
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('John')
    })

    it('returns error on failure', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { error: 'Unauthorized' } } })

      const result = await getPatientProfile()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('updateUserProfile', () => {
    it('updates profile data', async () => {
      apiClient.put.mockResolvedValue({ data: { message: 'Profile updated' } })

      const result = await updateUserProfile({ name: 'Jane', phone: '555-1234' })

      expect(apiClient.put).toHaveBeenCalledWith('/api/users/profile', { name: 'Jane', phone: '555-1234' })
      expect(result.success).toBe(true)
    })
  })

  describe('changePassword', () => {
    it('sends current and new password', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await changePassword('oldpass', 'newpass')

      expect(apiClient.post).toHaveBeenCalledWith('/api/users/change-password', {
        current_password: 'oldpass',
        new_password: 'newpass',
      })
      expect(result.success).toBe(true)
    })

    it('returns error on wrong current password', async () => {
      apiClient.post.mockRejectedValue({ response: { data: { error: 'Invalid current password' } } })

      const result = await changePassword('wrong', 'newpass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid current password')
    })
  })

  describe('uploadProfilePicture', () => {
    it('uploads file with multipart/form-data', async () => {
      apiClient.post.mockResolvedValue({ data: { url: '/uploads/profile_pictures/u1.png' } })

      const file = { name: 'photo.png' }
      const result = await uploadProfilePicture(file)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/users/profile-picture',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      expect(result.success).toBe(true)
      expect(result.data.url).toContain('profile_pictures')
    })
  })

  describe('deleteAccount', () => {
    it('deletes the user account', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteAccount()

      expect(apiClient.delete).toHaveBeenCalledWith('/api/users/profile')
      expect(result.success).toBe(true)
    })
  })
})
