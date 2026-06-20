import { apiClient } from './apiClient'
import { AI_ENDPOINTS } from '../constants/apiEndpoints'

/**
 * AI Analysis Service - Real API Integration
 * Handles AI-powered health analysis
 */

/**
 * Analyze symptoms using AI
 */
export async function analyzeSymptoms(symptomData) {
  try {
    const response = await apiClient.post(
      AI_ENDPOINTS.ANALYZE_SYMPTOMS,
      symptomData,
    )

    if (response.data.success && response.data.data) {
      return {
        success: true,
        analysis: response.data.data,
      }
    }

    return {
      success: false,
      error: response.data.error || 'Impossible d\'analyser les symptômes',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'analyser les symptômes',
    }
  }
}

/**
 * Get latest AI analysis for the user
 */
export async function getLatestAIAnalysis() {
  try {
    // This would need a backend endpoint to fetch latest analysis
    // For now, we'll return a placeholder
    // In production, add GET /ai/latest-analysis endpoint to backend
    return {
      success: false,
      error: 'Latest AI analysis endpoint not yet implemented',
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Impossible de récupérer la dernière analyse',
    }
  }
}

/**
 * Get AI recommendations
 */
export async function getRecommendations(healthData) {
  try {
    const response = await apiClient.post(
      AI_ENDPOINTS.GET_RECOMMENDATIONS,
      healthData,
    )

    if (response.data.success && response.data.data) {
      return {
        success: true,
        recommendations: response.data.data,
      }
    }

    return {
      success: false,
      error: response.data.error || 'Impossible d\'obtenir des recommandations',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Impossible d\'obtenir des recommandations',
    }
  }
}
