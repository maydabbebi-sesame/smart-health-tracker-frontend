import { getVitals, getLatestVital } from './vitalsService'
import { getAppointments } from './appointmentsService'
import { getUnreadAlertCount } from './alertsService'

/**
 * Dashboard Service
 * Aggregates data from multiple services for the dashboard
 */

/**
 * Get dashboard summary with stats
 */
export async function getDashboardSummary() {
  try {
    // Fetch all data in parallel
    const [vitalsRes, appointmentsRes, alertsRes] = await Promise.all([
      getVitals(),
      getAppointments(),
      getUnreadAlertCount(),
    ])

    // Backend returns arrays directly in .data
    const vitals = Array.isArray(vitalsRes.data) ? vitalsRes.data : []
    const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled')

    // Calculate wellness score client-side (0-100)
    const wellnessScore = calculateWellnessScore(vitals)

    const stats = {
      totalVitalsRecorded: vitals.length,
      upcomingAppointments: scheduledAppointments.length,
      pendingAlerts: alertsRes.data?.count || 0,
      wellnessScore,
    }

    // Generate health plan items (wellness recommendations)
    const healthPlanItems = generateHealthPlanItems(vitals, wellnessScore)

    return { success: true, data: { stats, healthPlanItems } }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard summary',
    }
  }
}

/**
 * Get dashboard charts data
 */
export async function getDashboardCharts() {
  try {
    // Fetch latest vitals for charts
    const [heartRateRes, bpRes, tempRes] = await Promise.all([
      getLatestVital('heart_rate'),
      getLatestVital('blood_pressure'),
      getLatestVital('temperature'),
    ])

    const heartRateData = heartRateRes.success ? heartRateRes.data : null
    const bpData = bpRes.success ? bpRes.data : null
    const tempData = tempRes.success ? tempRes.data : null

    return {
      success: true,
      data: {
        heartRateData,
        bpData,
        tempData,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard charts',
    }
  }
}

/**
 * Calculate wellness score based on vitals (0-100)
 * @param {Array} vitals - List of vital measurements
 * @returns {number} Wellness score 0-100
 */
function calculateWellnessScore(vitals) {
  if (!vitals || vitals.length === 0) {
    return 50 // Default neutral score
  }

  // Define normal ranges for each vital
  const normalRanges = {
    heart_rate: { min: 50, max: 100 },
    blood_pressure_systolic: { min: 90, max: 140 },
    blood_pressure_diastolic: { min: 60, max: 90 },
    temperature: { min: 36.1, max: 37.2 },
    oxygen: { min: 95, max: 100 },
    respiratory_rate: { min: 12, max: 20 },
  }

  let scorePoints = 0
  let maxPoints = 0

  // Evaluate each vital
  vitals.forEach((vital) => {
    const range = normalRanges[vital.type]
    if (range) {
      maxPoints += 10
      if (vital.value >= range.min && vital.value <= range.max) {
        scorePoints += 10 // Full points if in normal range
      } else if (
        vital.value >= range.min - 10 &&
        vital.value <= range.max + 10
      ) {
        scorePoints += 5 // Half points if slightly off
      }
    }
  })

  // Calculate percentage
  const score = maxPoints > 0 ? Math.round((scorePoints / maxPoints) * 100) : 50
  return Math.min(100, Math.max(0, score))
}

/**
 * Generate health plan items based on vitals and wellness score
 * @param {Array} vitals - List of vital measurements
 * @param {number} wellnessScore - Overall wellness score
 * @returns {Array} Array of health plan recommendations
 */
function generateHealthPlanItems(vitals, wellnessScore) {
  const items = []

  // Check if there are any vitals with concerning values
  const hasHighHeartRate = vitals.some(
    (v) => v.type === 'heart_rate' && v.value > 100,
  )
  const hasHighBloodPressure = vitals.some(
    (v) => v.type === 'blood_pressure' && (v.systolic > 140 || v.diastolic > 90),
  )
  const hasHighTemperature = vitals.some(
    (v) => v.type === 'temperature' && v.value > 37.5,
  )
  const hasLowOxygen = vitals.some((v) => v.type === 'oxygen' && v.value < 95)

  // Generate recommendations
  if (wellnessScore < 60) {
    items.push({
      id: 1,
      title: 'Schedule a Check-up',
      description: 'Your wellness score indicates you should see a doctor.',
      status: 'pending',
      priority: 'high',
    })
  }

  if (hasHighHeartRate) {
    items.push({
      id: 2,
      title: 'Monitor Heart Rate',
      description: 'Your heart rate has been elevated. Monitor and reduce stress.',
      status: 'active',
      priority: 'high',
    })
  }

  if (hasHighBloodPressure) {
    items.push({
      id: 3,
      title: 'Blood Pressure Management',
      description: 'Consider lifestyle changes to manage your blood pressure.',
      status: 'active',
      priority: 'high',
    })
  }

  if (hasHighTemperature) {
    items.push({
      id: 4,
      title: 'Fever Alert',
      description: 'You have elevated temperature. Stay hydrated and rest.',
      status: 'urgent',
      priority: 'critical',
    })
  }

  if (hasLowOxygen) {
    items.push({
      id: 5,
      title: 'Low Oxygen Level',
      description: 'Your oxygen level is below normal. Seek medical attention.',
      status: 'urgent',
      priority: 'critical',
    })
  }

  // If no issues found, add wellness maintenance
  if (items.length === 0) {
    items.push({
      id: 6,
      title: 'Maintain Your Health',
      description:
        'Keep up with regular monitoring and healthy lifestyle habits.',
      status: 'completed',
      priority: 'low',
    })
  }

  return items
}
