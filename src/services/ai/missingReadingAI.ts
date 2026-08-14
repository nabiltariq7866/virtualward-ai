import type { CarePlan, Device, Observation, Patient } from '../../types/domain'
import { deriveExpectedReadings } from '../../utils/monitoring'

export function detectMissingReadings(patients: Patient[], carePlans: CarePlan[], observations: Observation[], devices: Device[]) {
  return deriveExpectedReadings(patients, carePlans, observations, devices).filter(reading => reading.status === 'Missing')
}
