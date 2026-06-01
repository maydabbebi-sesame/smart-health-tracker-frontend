import { fakeAIAnalysisResponse } from '../mocks/aiAnalysis.mock'
import { symptoms } from '../mocks/symptoms.mock'
import { rejectMock, resolveMock } from './mockApi'

export function getSymptomOptions() {
  return resolveMock(symptoms)
}

export function analyzeSymptoms(payload) {
  if (payload.description.toLowerCase().includes('error')) {
    return rejectMock('Something went wrong', 1400)
  }

  return resolveMock(
    {
      id: crypto.randomUUID(),
      analysis: fakeAIAnalysisResponse,
    },
    1400,
  )
}
