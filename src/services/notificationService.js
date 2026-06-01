import { notifications } from '../mocks/notifications.mock'
import { resolveMock } from './mockApi'

export function getNotifications() {
  return resolveMock(notifications)
}
