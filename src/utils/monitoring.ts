import type { CarePlan, Device, Observation, Patient, VitalType } from '../types/domain'

export type TimeRange = '6h' | '24h' | '3d' | '7d' | '14d'
export type ExpectedReadingStatus = 'Received' | 'Due' | 'Missing'

export interface ExpectedReadingRow {
  id: string
  patientId: string
  type: VitalType
  dueAt: string
  status: ExpectedReadingStatus
  deviceId?: string
  deviceStatus?: Device['status']
  overdueMinutes: number
}

const rangeMs: Record<TimeRange, number> = {
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
}

export function filterObservationsByRange(observations: Observation[], range: TimeRange) {
  if (!observations.length) return []
  const anchor = Math.max(...observations.map(o => +new Date(o.timestamp)))
  const cutoff = anchor - rangeMs[range]
  return observations.filter(o => +new Date(o.timestamp) >= cutoff)
}

export function frequencyToCount(frequency: string) {
  const normalized = frequency.toLowerCase()
  if (normalized.includes('3 time') || normalized.includes('three time')) return 3
  if (normalized.includes('twice') || normalized.includes('2 time') || normalized.includes('two time')) return 2
  return 1
}

function slotsForCount(count: number) {
  if (count >= 3) return [8, 14, 20]
  if (count === 2) return [9, 18]
  return [9]
}

function typeMatchesDevice(type: VitalType, device: Device) {
  const d = device.type.toLowerCase()
  if (type === 'SpO2' || type === 'Heart Rate') return d.includes('oximeter') || d.includes('wearable')
  if (type === 'Blood Pressure') return d.includes('bp')
  if (type === 'Temperature') return d.includes('thermometer')
  if (type === 'Weight') return d.includes('scale')
  if (type === 'Glucose') return d.includes('glucose')
  return d.includes('wearable')
}

export function deriveExpectedReadings(
  patients: Patient[],
  carePlans: CarePlan[],
  observations: Observation[],
  devices: Device[],
): ExpectedReadingRow[] {
  const anchorMs = observations.length
    ? Math.max(...observations.map(o => +new Date(o.timestamp)))
    : Date.now()
  const anchor = new Date(anchorMs)
  const dayStart = new Date(anchor)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = +dayStart + 24 * 60 * 60 * 1000

  const rows: ExpectedReadingRow[] = []
  for (const patient of patients.filter(p => p.monitoringStatus !== 'Completed')) {
    const plan = carePlans.find(c => c.patientId === patient.id && c.status === 'Active')
    if (!plan) continue
    const patientDevices = devices.filter(d => d.patientId === patient.id)
    for (const scheduled of plan.observations) {
      const count = frequencyToCount(scheduled.frequency)
      const slots = slotsForCount(count)
      const received = observations
        .filter(o => o.patientId === patient.id && o.type === scheduled.type)
        .filter(o => {
          const t = +new Date(o.timestamp)
          return t >= +dayStart && t < dayEnd
        })
        .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
      const device = patientDevices.find(d => typeMatchesDevice(scheduled.type, d)) ?? patientDevices[0]

      slots.forEach((hour, index) => {
        const due = new Date(dayStart)
        due.setHours(hour, 0, 0, 0)
        const dueMs = +due
        if (dueMs > anchorMs + 60 * 60 * 1000) return
        const hasReading = Boolean(received[index])
        const graceMs = 60 * 60 * 1000
        const status: ExpectedReadingStatus = hasReading
          ? 'Received'
          : anchorMs > dueMs + graceMs
            ? 'Missing'
            : 'Due'
        rows.push({
          id: `${patient.id}-${scheduled.type}-${hour}`,
          patientId: patient.id,
          type: scheduled.type,
          dueAt: due.toISOString(),
          status,
          deviceId: device?.id,
          deviceStatus: device?.status,
          overdueMinutes: status === 'Missing' ? Math.max(0, Math.floor((anchorMs - dueMs) / 60000)) : 0,
        })
      })
    }
  }
  return rows
}

export function deterministicDeviceReading(device: Device): { type: VitalType; value: number; secondaryValue?: number; unit: string } {
  const d = device.type.toLowerCase()
  if (d.includes('oximeter')) return { type: 'SpO2', value: 96, unit: '%' }
  if (d.includes('bp')) return { type: 'Blood Pressure', value: 138, secondaryValue: 86, unit: 'mmHg' }
  if (d.includes('thermometer')) return { type: 'Temperature', value: 37.1, unit: '°C' }
  if (d.includes('scale')) return { type: 'Weight', value: 79.0, unit: 'kg' }
  if (d.includes('glucose')) return { type: 'Glucose', value: 8.2, unit: 'mmol/L' }
  return { type: 'Heart Rate', value: 78, unit: 'bpm' }
}
