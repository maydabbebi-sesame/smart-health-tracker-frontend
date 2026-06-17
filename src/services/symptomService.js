import { submitForm } from './formsService'

/**
 * Saves the symptom form to the `forms` table.
 * The actual AI analysis is triggered separately by MediAssistChat on mount.
 */
export async function submitSymptomAnalysis(payload) {
  return submitForm('symptom_assessment', payload)
}

/**
 * Get symptom options (static data)
 */
export async function getSymptomOptions() {
  // Return static symptom options
  return {
    success: true,
    data: {
      symptoms: [
        'fever',
        'cough',
        'fatigue',
        'headache',
        'body_aches',
        'sore_throat',
        'shortness_of_breath',
        'nausea',
        'vomiting',
        'diarrhea',
        'chest_pain',
        'dizziness',
      ],
    },
  }
}
