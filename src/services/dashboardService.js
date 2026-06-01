import {
  activityData,
  dashboardStats,
  healthPlanItems,
  heartRateData,
  weightData,
} from '../mocks/dashboard.mock'
import { resolveMock } from './mockApi'

export function getDashboardSummary() {
  return resolveMock({
    stats: dashboardStats,
    healthPlanItems,
  })
}

export function getDashboardCharts() {
  return resolveMock({
    heartRateData,
    weightData,
    activityData,
  })
}
