import { getVitals } from './vitalsService'

/**
 * Health History Service
 * Provides health history and vital sign records using vitalsService
 */

/**
 * Get health history records (vitals with display formatting)
 */
export async function getHealthHistory(page = 1, pageSize = 20) {
  try {
    const result = await getVitals(page, pageSize)

    if (result.success && result.data) {
      // Backend returns array of vitals directly
      const vitals = Array.isArray(result.data) ? result.data : []
      const formattedRecords = vitals.map((vital) =>
        transformVitalToDisplayFormat(vital),
      )

      return {
        success: true,
        data: formattedRecords,
      }
    }

    return result
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch health history',
    }
  }
}

/**
 * Transform vital measurement to display format
 * Maps API vital structure to user-friendly display structure
 * Backend vital: { uid, user_uid, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation, respiratory_rate, notes, recorded_at }
 */
function transformVitalToDisplayFormat(vital) {
  const entries = []

  if (vital.heart_rate != null) {
    entries.push({ label: 'Heart Rate', value: `${vital.heart_rate}`, unit: 'bpm' })
  }
  if (vital.systolic_bp != null && vital.diastolic_bp != null) {
    entries.push({ label: 'Blood Pressure', value: `${vital.systolic_bp}/${vital.diastolic_bp}`, unit: 'mmHg' })
  }
  if (vital.temperature != null) {
    entries.push({ label: 'Temperature', value: `${vital.temperature.toFixed(1)}`, unit: '°C' })
  }
  if (vital.oxygen_saturation != null) {
    entries.push({ label: 'Oxygen Level', value: `${vital.oxygen_saturation}`, unit: '%' })
  }
  if (vital.respiratory_rate != null) {
    entries.push({ label: 'Respiratory Rate', value: `${vital.respiratory_rate}`, unit: 'breaths/min' })
  }

  return {
    id: vital.uid,
    date: vital.recorded_at,
    type: 'Vitals',
    entries,
    notes: vital.notes,
    originalVital: vital,
  }
}

/**
 * Get vital status (normal, warning, critical)
 */
function getVitalStatus(vital) {
  const ranges = {
    heart_rate: { normal: [50, 100], warning: [40, 120], critical: null },
    blood_pressure: {
      normal: [90 / 60, 140 / 90],
      warning: [120 / 80, 160 / 100],
      critical: null,
    },
    temperature: {
      normal: [36.1, 37.2],
      warning: [35.1, 38.5],
      critical: null,
    },
    oxygen: { normal: [95, 100], warning: [90, 95], critical: null },
    respiratory_rate: { normal: [12, 20], warning: [10, 25], critical: null },
  }

  const range = ranges[vital.type]
  if (!range) return 'unknown'

  const value = parseFloat(vital.value)
  if (
    value >= range.normal[0] &&
    value <= range.normal[1]
  ) {
    return 'normal'
  } else if (
    value >= range.warning[0] &&
    value <= range.warning[1]
  ) {
    return 'warning'
  }
  return 'critical'
}
