import { healthHistoryRecords } from '../mocks/healthHistory.mock'
import { resolveMock } from './mockApi'

export function getHealthHistory() {
  return resolveMock(healthHistoryRecords)
}
