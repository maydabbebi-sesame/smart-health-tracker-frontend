import { aiInsights, fakeAIAnalysisResponse } from '../mocks/aiAnalysis.mock'
import { resolveMock } from './mockApi'

export function getLatestAIAnalysis() {
  return resolveMock({
    analysis: fakeAIAnalysisResponse,
    insights: aiInsights,
  })
}
