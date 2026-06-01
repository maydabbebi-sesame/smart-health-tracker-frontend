import { patientProfile } from '../mocks/profile.mock'
import { resolveMock } from './mockApi'

export function getPatientProfile() {
  return resolveMock(patientProfile)
}
