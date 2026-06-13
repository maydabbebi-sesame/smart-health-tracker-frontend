import { submitForm } from './formsService'
import { analyzeSymptoms } from './aiAnalysisService'

/**
 * Symptom Service
 * Integrates form submission with AI analysis
 */

/**
 * Submit symptom analysis (combines form submission and AI analysis)
 */
export async function submitSymptomAnalysis(payload) {
  try {
    // Step 1: Submit the form
    const formResult = await submitForm('symptom_assessment', payload)

    if (!formResult.success) {
      return formResult
    }

    // Step 2: Get AI analysis
    const analysisResult = await analyzeSymptoms({
      symptoms: payload.mainSymptoms || [],
      duration: payload.symptomDuration || '',
      severity: payload.symptomSeverity || 'moderate',
      otherData: payload,
    })

    return {
      success: true,
      data: {
        formId: formResult.data?.id,
        analysis: analysisResult.analysis || null,
        formData: formResult.data,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to submit symptom analysis',
    }
  }
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
