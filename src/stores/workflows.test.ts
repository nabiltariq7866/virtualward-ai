import { beforeEach, describe, expect, it } from 'vitest'
import { can, useVirtualWardStore } from './useVirtualWardStore'
import type { EnrolPatientInput } from '../types/domain'

const enrolment: EnrolPatientInput = {
  name: 'Test Patient',
  age: 61,
  pathway: 'COPD',
  condition: 'Demo COPD recovery',
  startDate: '2026-08-14',
  duration: 10,
  nurse: 'Rebecca Morgan',
  consultant: 'Dr. James Howard',
  contact: 'test.patient@example.test',
  emergencyContact: 'Alex Test · 07000 111222',
  monitoringPlan: 'COPD Enhanced Demo Plan',
  deviceId: 'OX-40900',
}

describe('connected Virtual Ward workflows', () => {
  beforeEach(() => {
    localStorage.clear()
    useVirtualWardStore.getState().resetDemo()
  })

  it('enrols a patient and persists every enrolment field into shared state', () => {
    const before = useVirtualWardStore.getState().patients.length
    const patientId = useVirtualWardStore.getState().enrolPatient(enrolment)
    const state = useVirtualWardStore.getState()
    const patient = state.patients.find(p => p.id === patientId)!
    const plan = state.carePlans.find(p => p.patientId === patientId)!
    expect(state.patients).toHaveLength(before + 1)
    expect(patient.startDate).toBe('2026-08-14')
    expect(patient.expectedEndDate).toBe('2026-08-24')
    expect(patient.patientContact).toBe(enrolment.contact)
    expect(patient.emergencyContact).toBe(enrolment.emergencyContact)
    expect(patient.monitoringPlanName).toBe(enrolment.monitoringPlan)
    expect(patient.deviceIds).toContain('OX-40900')
    expect(plan.planName).toBe(enrolment.monitoringPlan)
    expect(plan.startDate).toBe(enrolment.startDate)
    expect(state.devices.find(d => d.id === 'OX-40900')?.patientId).toBe(patientId)
    expect(state.tasks.some(t => t.patientId === patientId)).toBe(true)
    expect(state.timeline.some(e => e.patientId === patientId && e.type === 'Enrolment')).toBe(true)
    expect(state.audits.some(e => e.patientId === patientId && e.action === 'Patient enrolled')).toBe(true)
  })

  it('runs COPD observations into a traceable high-risk alert', () => {
    const api = useVirtualWardStore.getState()
    api.setScenario('COPD Deterioration')
    for (let i = 0; i < 4; i++) useVirtualWardStore.getState().advanceScenario()
    const state = useVirtualWardStore.getState()
    expect(state.patients.find(p => p.id === 'PT-20284')?.risk).toBe('High Risk')
    expect(state.alerts.some(a => a.patientId === 'PT-20284' && a.type === 'Vital Trend' && a.status === 'Needs Review')).toBe(true)
    expect(state.audits.some(a => a.patientId === 'PT-20284' && a.action.includes('risk'))).toBe(true)
  })

  it('preserves alert until a reasoned resolution', () => {
    const id = 'ALT-1001'
    expect(useVirtualWardStore.getState().acknowledgeAlert(id).ok).toBe(true)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === id)?.status).toBe('Acknowledged')
    expect(useVirtualWardStore.getState().resolveAlert(id, '').ok).toBe(false)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === id)?.status).toBe('Acknowledged')
    expect(useVirtualWardStore.getState().resolveAlert(id, 'Clinical review complete').ok).toBe(true)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === id)?.status).toBe('Resolved')
  })

  it('creates nurse review and doctor escalation', () => {
    const api = useVirtualWardStore.getState()
    expect(api.createReview('PT-20284', 'Trend review', 'Patient contacted', 'Escalate to Doctor').ok).toBe(true)
    expect(api.createEscalation('PT-20284', 'Declining trend', 'Supporting readings reviewed').ok).toBe(true)
    const state = useVirtualWardStore.getState()
    expect(state.reviews.some(r => r.patientId === 'PT-20284' && r.type === 'Nurse' && r.status === 'Completed')).toBe(true)
    expect(state.reviews.some(r => r.patientId === 'PT-20284' && r.type === 'Doctor' && r.status === 'Open')).toBe(true)
  })

  it('manual device disconnect creates continuity alerts and reconnect adds a reading before resolving them', () => {
    useVirtualWardStore.getState().setRole('Remote Care Coordinator')
    const before = useVirtualWardStore.getState().observations.length
    const disconnected = useVirtualWardStore.getState().disconnectDevice('OX-40812')
    expect(disconnected.ok).toBe(true)
    let state = useVirtualWardStore.getState()
    expect(state.devices.find(d => d.id === 'OX-40812')?.status).toBe('Offline')
    expect(state.alerts.some(a => a.patientId === 'PT-20284' && a.type === 'Device Offline' && a.status === 'Needs Review')).toBe(true)
    expect(state.alerts.some(a => a.patientId === 'PT-20284' && a.type === 'Missing Reading' && a.status === 'Needs Review')).toBe(true)

    const reconnected = useVirtualWardStore.getState().reconnectDevice('OX-40812')
    expect(reconnected.ok).toBe(true)
    state = useVirtualWardStore.getState()
    expect(state.observations).toHaveLength(before + 1)
    expect(state.observations.some(o => o.deviceId === 'OX-40812' && o.type === 'SpO2')).toBe(true)
    expect(state.devices.find(d => d.id === 'OX-40812')?.status).toBe('Connected')
    expect(state.alerts.filter(a => a.patientId === 'PT-20284' && ['Device Offline', 'Missing Reading'].includes(a.type)).every(a => a.status === 'Resolved')).toBe(true)
    expect(state.audits.some(a => a.patientId === 'PT-20284' && a.action === 'Device reconnected')).toBe(true)
  })

  it('blocks discharge until ready and persists a complete consultant override record', () => {
    useVirtualWardStore.getState().setRole('Consultant Physician')
    let result = useVirtualWardStore.getState().dischargePatient('PT-20412')
    expect(result.ok).toBe(false)

    result = useVirtualWardStore.getState().dischargePatient('PT-20412', {
      dischargeDate: '2026-08-14',
      outcome: 'Transition to external assessment',
      finalReview: 'Consultant-directed exception review',
      followUpRequired: 'Follow up with usual care tomorrow',
      deviceReturn: 'Return devices within 48 hours',
      patientCommunication: 'Your Virtual Ward episode is complete and an external assessment has been recommended.',
      overrideReason: 'Consultant reviewed the remaining blocker and documented a safe demo transition.',
    })
    expect(result.ok).toBe(true)
    const state = useVirtualWardStore.getState()
    const patient = state.patients.find(p => p.id === 'PT-20412')
    const discharge = state.dischargeRecords.find(r => r.patientId === 'PT-20412')
    expect(patient?.monitoringStatus).toBe('Completed')
    expect(patient?.deviceIds).toHaveLength(0)
    expect(state.devices.some(d => d.patientId === 'PT-20412')).toBe(false)
    expect(discharge?.outcome).toBe('Transition to external assessment')
    expect(discharge?.overrideReason).toContain('Consultant reviewed')
    expect(state.messages.some(m => m.patientId === 'PT-20412' && m.body.includes('external assessment'))).toBe(true)
    expect(state.timeline.some(e => e.patientId === 'PT-20412' && e.type === 'Discharge')).toBe(true)
  })

  it('enforces permission mapping and store-level guards', () => {
    expect(can('Virtual Ward Nurse', 'escalate')).toBe(true)
    expect(can('Virtual Ward Nurse', 'discharge')).toBe(false)
    expect(can('Consultant Physician', 'discharge')).toBe(true)
    useVirtualWardStore.getState().setRole('Operations Manager')
    expect(useVirtualWardStore.getState().recordMedication('M1', 'Missed').ok).toBe(false)
    expect(useVirtualWardStore.getState().disconnectDevice('OX-40812').ok).toBe(false)
    expect(useVirtualWardStore.getState().createConsultation('PT-20284').ok).toBe(false)
  })

  it('resets all mutated demo state', () => {
    const seedCount = useVirtualWardStore.getState().patients.length
    useVirtualWardStore.getState().setScenario('COPD Deterioration')
    useVirtualWardStore.getState().advanceScenario()
    useVirtualWardStore.getState().resetDemo()
    expect(useVirtualWardStore.getState().patients.length).toBe(seedCount)
    expect(useVirtualWardStore.getState().scenarioStep).toBe(0)
    expect(useVirtualWardStore.getState().role).toBe('Virtual Ward Nurse')
  })
})
