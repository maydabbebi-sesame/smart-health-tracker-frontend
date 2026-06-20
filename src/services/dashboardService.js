import { getVitals, getVitalEvolution } from './vitalsService'
import { getAppointments } from './appointmentsService'
import { getAlerts, getUnreadAlertCount } from './alertsService'
import { getCurrentUser } from './authService'
import { useLocaleStore } from '../store/localeStore'

const LOCALE_TAGS = { fr: 'fr-FR', en: 'en-US' }

/**
 * Dashboard Service
 * Aggregates data from multiple services for the dashboard
 */

const UPCOMING_STATUSES = ['scheduled', 'confirmed']

/**
 * Get dashboard summary with stats
 */
export async function getDashboardSummary() {
  try {
    const userUid = getCurrentUser()?.uid || null

    const [vitalsRes, appointmentsRes, alertsCountRes, recentAlertsRes] = await Promise.all([
      getVitals().catch((err) => ({ success: false, data: [], error: err })),
      getAppointments(1, 50, null, userUid).catch((err) => ({ success: false, data: [], error: err })),
      getUnreadAlertCount().catch((err) => ({ success: false, data: { count: 0 }, error: err })),
      getAlerts(1, 5, true).catch((err) => ({ success: false, data: [], error: err })),
    ])

    const vitals = vitalsRes?.success === false ? null : Array.isArray(vitalsRes?.data) ? vitalsRes.data : null
    const appointments = appointmentsRes?.success === false ? null : Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : null
    const alertsCount = alertsCountRes?.success === false ? null : Number(alertsCountRes?.data?.unread_count ?? null)
    const recentAlerts = recentAlertsRes?.success === false ? [] : Array.isArray(recentAlertsRes?.data) ? recentAlertsRes.data : []

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const upcomingAppointments = appointments
      ? appointments
          .filter((a) => UPCOMING_STATUSES.includes(a.status) && new Date(a.appointment_date) >= startOfToday)
          .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
      : null

    const wellnessScore = vitals && vitals.length > 0 ? calculateWellnessScore(vitals) : null

    const stats = [
      {
        key: 'wellnessScore',
        label: 'Score de bien-être',
        value: wellnessScore !== null ? `${wellnessScore}%` : null,
        icon: 'heart',
      },
      {
        key: 'symptomsLogged',
        label: 'Symptômes enregistrés',
        value: vitals !== null ? String(vitals.length) : null,
        icon: 'activity',
      },
      {
        key: 'unreadAlerts',
        label: 'Alertes non lues',
        value: alertsCount !== null ? String(alertsCount) : null,
        icon: 'bell',
      },
      {
        key: 'upcomingAppointments',
        label: 'Rendez-vous à venir',
        value: upcomingAppointments !== null ? String(upcomingAppointments.length) : null,
        icon: 'activity',
      },
    ]

    return {
      stats,
      recentAlert: recentAlerts[0] || null,
      upcomingAppointments: upcomingAppointments ? upcomingAppointments.slice(0, 5) : [],
    }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return {
      stats: [
        { key: 'wellnessScore', label: 'Score de bien-être', value: null, icon: 'heart' },
        { key: 'symptomsLogged', label: 'Symptômes enregistrés', value: null, icon: 'activity' },
        { key: 'unreadAlerts', label: 'Alertes non lues', value: null, icon: 'bell' },
        { key: 'upcomingAppointments', label: 'Rendez-vous à venir', value: null, icon: 'activity' },
      ],
      recentAlert: null,
      upcomingAppointments: [],
    }
  }
}

/**
 * Get dashboard charts data from real vitals evolution
 */
export async function getDashboardCharts() {
  try {
    const userUid = getCurrentUser()?.uid || null

    const [heartRateRes, weightRes] = await Promise.all([
      getVitalEvolution('heart_rate', null, null, userUid).catch((err) => ({ success: false, error: err })),
      getVitalEvolution('weight', null, null, userUid).catch((err) => ({ success: false, error: err })),
    ])

    return {
      heartRateData: formatEvolutionData(heartRateRes, 'bpm'),
      weightData: formatEvolutionData(weightRes, 'weight'),
    }
  } catch (error) {
    console.error('Error fetching dashboard charts:', error)
    return {
      heartRateData: [],
      weightData: [],
    }
  }
}

/**
 * Convert a /vitals/evolution response into chart-ready points
 */
function formatEvolutionData(res, valueKey, limit = 8) {
  if (!res?.success || !Array.isArray(res.data)) {
    return []
  }

  return res.data
    .filter((entry) => entry.value !== null && entry.value !== undefined)
    .slice(-limit)
    .map((entry) => ({ date: formatShortDate(entry.recorded_at), [valueKey]: entry.value }))
}

function formatShortDate(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  const localeTag = LOCALE_TAGS[useLocaleStore.getState().locale] || LOCALE_TAGS.fr
  return date.toLocaleDateString(localeTag, { day: '2-digit', month: '2-digit' })
}

/**
 * Calculate wellness score based on the most recent vitals record (0-100)
 * Backend returns one record per submission with named columns
 * (heart_rate, systolic_bp, ...), not one row per measurement type.
 * @param {Array} vitals - List of vital records, most recent first
 * @returns {number|null} Wellness score 0-100 or null when no measurable field is present
 */
function calculateWellnessScore(vitals) {
  if (!vitals || vitals.length === 0) {
    return null
  }

  const latest = vitals[0]

  // Define normal ranges for each vital field returned by the backend
  const normalRanges = {
    heart_rate: { min: 50, max: 100 },
    systolic_bp: { min: 90, max: 140 },
    diastolic_bp: { min: 60, max: 90 },
    temperature: { min: 36.1, max: 37.2 },
    oxygen_saturation: { min: 95, max: 100 },
    respiratory_rate: { min: 12, max: 20 },
  }

  let scorePoints = 0
  let maxPoints = 0

  Object.entries(normalRanges).forEach(([field, range]) => {
    const value = latest[field]
    if (value === null || value === undefined) {
      return
    }
    maxPoints += 10
    if (value >= range.min && value <= range.max) {
      scorePoints += 10 // Full points if in normal range
    } else if (value >= range.min - 10 && value <= range.max + 10) {
      scorePoints += 5 // Half points if slightly off
    }
  })

  if (maxPoints === 0) {
    return null
  }

  const score = Math.round((scorePoints / maxPoints) * 100)
  return Math.min(100, Math.max(0, score))
}
