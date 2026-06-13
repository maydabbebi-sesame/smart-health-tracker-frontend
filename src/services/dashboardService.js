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
      getVitals().catch(err => ({ success: false, data: [], error: err })),
      getAppointments().catch(err => ({ success: false, data: [], error: err })),
      getUnreadAlertCount().catch(err => ({ success: false, data: { count: 0 }, error: err })),
    ])

    const vitals = vitalsRes?.success === false ? null : Array.isArray(vitalsRes?.data) ? vitalsRes.data : null
    const appointments = appointmentsRes?.success === false ? null : Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : null
    const alertsCount = alertsRes?.success === false ? null : Number(alertsRes?.data?.count ?? null)
    const scheduledAppointments = appointments ? appointments.filter(a => a.status === 'scheduled') : null

    const wellnessScore = vitals && vitals.length > 0 ? calculateWellnessScore(vitals) : null

    const stats = [
      {
        label: 'Wellness score',
        value: wellnessScore !== null ? `${wellnessScore}%` : null,
        icon: 'heart',
      },
      {
        label: 'Symptoms logged',
        value: vitals !== null ? String(vitals.length) : null,
        icon: 'activity',
      },
      {
        label: 'Unread alerts',
        value: alertsCount !== null ? String(alertsCount) : null,
        icon: 'bell',
      },
      {
        label: 'Upcoming appointments',
        value: scheduledAppointments !== null ? String(scheduledAppointments.length) : null,
        icon: 'activity',
      },
    ]

    // Generate health plan items (wellness recommendations)
    const healthPlanItems = generateHealthPlanItems(vitals, wellnessScore)

    return { stats, healthPlanItems }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return {
      stats: [
        { label: 'Wellness score', value: null, icon: 'heart' },
        { label: 'Symptoms logged', value: null, icon: 'activity' },
        { label: 'Unread alerts', value: null, icon: 'bell' },
        { label: 'Upcoming appointments', value: null, icon: 'activity' },
      ],
      healthPlanItems: [],
    }
  }
}

/**
 * Get dashboard charts data
 */
export async function getDashboardCharts() {
  try {
    // No chart defaults provided when model/backend data is not available.
    // Replace this implementation with real backend aggregation once ready.
    return {
      heartRateData: [],
      weightData: [],
      activityData: [],
    }
  } catch (error) {
    console.error('Error fetching dashboard charts:', error)
    return {
      heartRateData: [],
      weightData: [],
      activityData: [],
    }
  }
}

/**
 * Calculate wellness score based on vitals (0-100)
 * @param {Array} vitals - List of vital measurements
 * @returns {number|null} Wellness score 0-100 or null when insufficient data
 */
function calculateWellnessScore(vitals) {
  if (!vitals || vitals.length === 0) {
    return null
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
  if (!vitals || vitals.length === 0 || wellnessScore === null) {
    return []
  }

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
