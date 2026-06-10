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

    if (result.success && result.data?.data) {
      // Transform vitals to display format
      const formattedRecords = result.data.data.map((vital) =>
        transformVitalToDisplayFormat(vital),
      )

      return {
        success: true,
        data: {
          ...result.data,
          data: formattedRecords,
        },
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
 */
function transformVitalToDisplayFormat(vital) {
  const displayNames = {
    heart_rate: 'Heart Rate',
    blood_pressure: 'Blood Pressure',
    temperature: 'Temperature',
    oxygen: 'Oxygen Level',
    respiratory_rate: 'Respiratory Rate',
    weight: 'Weight',
  }

  const units = {
    heart_rate: 'bpm',
    blood_pressure: 'mmHg',
    temperature: '°C',
    oxygen: '%',
    respiratory_rate: 'breaths/min',
    weight: 'kg',
  }

  return {
    id: vital.id,
    title: displayNames[vital.type] || vital.type,
    date: vital.timestamp || vital.date,
    type: 'Vitals',
    value: formatVitalValue(vital),
    unit: units[vital.type] || '',
    originalVital: vital, // Keep original for detailed view
  }
}

/**
 * Format vital value for display
 */
function formatVitalValue(vital) {
  switch (vital.type) {
    case 'blood_pressure':
      return `${vital.systolic}/${vital.diastolic}`
    case 'temperature':
      return vital.value.toFixed(1)
    case 'heart_rate':
    case 'oxygen':
    case 'respiratory_rate':
    case 'weight':
      return vital.value.toString()
    default:
      return vital.value.toString()
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
