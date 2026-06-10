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
      error: response.data.error || 'Failed to analyze symptoms',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to analyze symptoms',
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
      error: error.message || 'Failed to fetch latest analysis',
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
      error: response.data.error || 'Failed to get recommendations',
    }
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Failed to get recommendations',
    }
  }
}
