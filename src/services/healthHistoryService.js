import { getVitals } from './vitalsService'

/**
 * Health History Service
 * Provides health history and vital sign records using vitalsService
 */

/**
 * Get health history records (vitals with display formatting)
 * @param {string|null} period - 'week' | 'month' | '3months', restricts results to that window
 */
export async function getHealthHistory(page = 1, pageSize = 20, period = null) {
  try {
    const result = await getVitals(page, pageSize, null, period)

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
      error: error.message || 'Impossible de récupérer l\'historique de santé',
    }
  }
}

/**
 * Build a sortable 'YYYY-MM-DD' key from the backend's recorded_at.
 * Flask serializes datetimes as RFC1123 strings (e.g. "Thu, 18 Jun 2026
 * 14:20:12 GMT") which `new Date(...)` parses correctly — but the "GMT" is a
 * mislabel: the stored value is a naive local timestamp, never actually
 * converted to UTC. Reading it back with local-time getters (getDate() etc.)
 * re-applies the browser's timezone offset on top of a value that was never
 * shifted in the first place, which can push late-evening records into the
 * next calendar day. Using the UTC getters instead echoes back the exact
 * date/time embedded in the string, with no timezone math at all.
 */
function toDateKey(value) {
  if (!value) return 'Date inconnue'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Date inconnue'
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Transform vital measurement to display format
 * Maps API vital structure to user-friendly display structure
 * Backend vital: { uid, user_uid, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation, respiratory_rate, notes, recorded_at }
 */
function transformVitalToDisplayFormat(vital) {
  const entries = []

  if (vital.heart_rate != null) {
    entries.push({ label: 'Fréquence cardiaque', value: `${vital.heart_rate}`, unit: 'bpm' })
  }
  if (vital.systolic_bp != null && vital.diastolic_bp != null) {
    entries.push({ label: 'Tension artérielle', value: `${vital.systolic_bp}/${vital.diastolic_bp}`, unit: 'mmHg' })
  }
  if (vital.temperature != null) {
    entries.push({ label: 'Température', value: `${vital.temperature.toFixed(1)}`, unit: '°C' })
  }
  if (vital.oxygen_saturation != null) {
    entries.push({ label: 'Saturation en oxygène', value: `${vital.oxygen_saturation}`, unit: '%' })
  }
  if (vital.respiratory_rate != null) {
    entries.push({ label: 'Fréquence respiratoire', value: `${vital.respiratory_rate}`, unit: 'resp/min' })
  }
  if (vital.glycemia != null) {
    entries.push({ label: 'Glycémie', value: `${vital.glycemia}`, unit: 'g/L' })
  }
  if (vital.weight != null) {
    entries.push({ label: 'Poids', value: `${vital.weight}`, unit: 'kg' })
  }
  if (vital.symptoms) {
    entries.push({ label: 'Symptômes', value: vital.symptoms, unit: '' })
  }
  if (vital.pain_intensity != null) {
    entries.push({ label: 'Intensité douleur', value: `${vital.pain_intensity}`, unit: '/10' })
  }
  if (vital.pain_location) {
    entries.push({ label: 'Localisation douleur', value: vital.pain_location, unit: '' })
  }
  if (vital.health_issues_history) {
    entries.push({ label: 'Antécédents', value: vital.health_issues_history, unit: '' })
  }
  if (vital.drug_allergies) {
    entries.push({ label: 'Allergies', value: vital.drug_allergies, unit: '' })
  }
  if (vital.family_health_issues) {
    entries.push({ label: 'Antécédents familiaux', value: vital.family_health_issues, unit: '' })
  }

  return {
    id: vital.uid,
    date: vital.recorded_at,
    dateKey: toDateKey(vital.recorded_at),
    type: 'Vitals',
    entries,
    notes: vital.notes,
    originalVital: vital,
  }
}

/**
 * Group display-formatted records by calendar day for the history page's
 * date containers. Most recent day first.
 */
export function groupRecordsByDate(records) {
  const byDate = new Map()
  for (const record of records || []) {
    const key = record.dateKey || 'Date inconnue'
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(record)
  }
  return Array.from(byDate.entries())
    .map(([date, dateRecords]) => ({ date, records: dateRecords }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
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
