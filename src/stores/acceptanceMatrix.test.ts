import { beforeEach, describe, expect, it } from 'vitest'
import { useVirtualWardStore } from './useVirtualWardStore'
import { deriveExpectedReadings, filterObservationsByRange } from '../utils/monitoring'
import type { EnrolPatientInput, Observation } from '../types/domain'

const duplicateInput: EnrolPatientInput = {
  name: 'Margaret Ellis',
  age: 72,
  pathway: 'COPD',
  condition: 'COPD',
  startDate: '2026-08-14',
  duration: 7,
  nurse: 'Rebecca Morgan',
  consultant: 'Dr. James Howard',
  contact: 'margaret@example.test',
  emergencyContact: 'Family contact',
  monitoringPlan: 'COPD Standard Demo Plan',
}

describe('master prompt workflow acceptance matrix', () => {
  beforeEach(() => {
    localStorage.clear()
    useVirtualWardStore.getState().resetDemo()
  })

  it('prevents duplicate active Virtual Ward episodes', () => {
    expect(() => useVirtualWardStore.getState().enrolPatient(duplicateInput)).toThrow(/active Virtual Ward episode/)
  })

  it('assigns one physical demo device to only one active patient', () => {
    const first = useVirtualWardStore.getState().assignDevice('OX-40900', 'PT-20284')
    expect(first.ok).toBe(true)
    const second = useVirtualWardStore.getState().assignDevice('OX-40900', 'PT-20162')
    expect(second.ok).toBe(false)
    expect(second.error).toMatch(/already assigned/)
  })

  it('rejects device assignment to a discharged patient', () => {
    useVirtualWardStore.getState().setRole('Consultant Physician')
    expect(useVirtualWardStore.getState().dischargePatient('PT-20425', 'Test override').ok).toBe(true)
    useVirtualWardStore.getState().setRole('Remote Care Coordinator')
    const result = useVirtualWardStore.getState().assignDevice('OX-40900', 'PT-20425')
    expect(result.ok).toBe(false)
  })

  it('patient reading is shared, recalculates risk, alerts and timeline', () => {
    const before = useVirtualWardStore.getState().observations.length
    expect(useVirtualWardStore.getState().addObservation('PT-20091', 'Blood Pressure', 158, 'mmHg', 'Patient manual entry')).toBe(true)
    const state = useVirtualWardStore.getState()
    expect(state.observations).toHaveLength(before + 1)
    expect(state.patients.find(p => p.id === 'PT-20091')?.risk).toBe('Needs Review')
    expect(state.alerts.some(a => a.patientId === 'PT-20091' && a.type === 'Vital Trend')).toBe(true)
    expect(state.timeline.some(e => e.patientId === 'PT-20091' && e.title === 'Reading received')).toBe(true)
  })

  it('invalid readings are rejected', () => {
    const before = useVirtualWardStore.getState().observations.length
    expect(useVirtualWardStore.getState().addObservation('PT-20284', 'SpO2', -1, '%')).toBe(false)
    expect(useVirtualWardStore.getState().observations).toHaveLength(before)
  })

  it('time-range filtering actually changes the chart dataset', () => {
    const base = new Date('2026-08-14T12:00:00Z').getTime()
    const readings = [
      { id: 'a', timestamp: new Date(base - 2 * 3600000).toISOString() },
      { id: 'b', timestamp: new Date(base - 10 * 3600000).toISOString() },
      { id: 'c', timestamp: new Date(base - 48 * 3600000).toISOString() },
      { id: 'd', timestamp: new Date(base - 10 * 86400000).toISOString() },
    ].map((item, index) => ({ ...item, patientId: 'PT-X', type: 'SpO2', value: 97 - index, unit: '%', source: 'test', status: 'Normal' } as Observation))
    expect(filterObservationsByRange(readings, '6h').map(r => r.id)).toEqual(['a'])
    expect(filterObservationsByRange(readings, '24h').map(r => r.id).sort()).toEqual(['a', 'b'])
    expect(filterObservationsByRange(readings, '3d')).toHaveLength(3)
    expect(filterObservationsByRange(readings, '14d')).toHaveLength(4)
  })

  it('derives missing readings from the active care-plan schedule', () => {
    const state = useVirtualWardStore.getState()
    const rows = deriveExpectedReadings(state.patients, state.carePlans, state.observations, state.devices)
    expect(rows.some(row => row.patientId === 'PT-20284' && row.type === 'SpO2')).toBe(true)
    expect(rows.every(row => ['Received', 'Due', 'Missing'].includes(row.status))).toBe(true)
  })

  it('urgent review alerts cannot be dismissed', () => {
    const result = useVirtualWardStore.getState().dismissAlert('ALT-1001', 'Not clinically relevant')
    expect(result.ok).toBe(false)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === 'ALT-1001')?.status).toBe('Needs Review')
  })

  it('attention alerts can be dismissed only with a reason', () => {
    expect(useVirtualWardStore.getState().dismissAlert('ALT-1002', '').ok).toBe(false)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === 'ALT-1002')?.status).toBe('Acknowledged')
    expect(useVirtualWardStore.getState().dismissAlert('ALT-1002', 'Duplicate administrative signal').ok).toBe(true)
    expect(useVirtualWardStore.getState().alerts.find(a => a.id === 'ALT-1002')?.status).toBe('Dismissed')
  })

  it('device replacement creates a required care task, timeline and audit event', () => {
    useVirtualWardStore.getState().setRole('Remote Care Coordinator')
    expect(useVirtualWardStore.getState().replaceDevice('WR-70018').ok).toBe(true)
    const state = useVirtualWardStore.getState()
    expect(state.tasks.some(t => t.patientId === 'PT-20412' && t.category === 'Device' && t.required)).toBe(true)
    expect(state.timeline.some(e => e.patientId === 'PT-20412' && e.title === 'Device replacement requested')).toBe(true)
    expect(state.audits.some(e => e.patientId === 'PT-20412' && e.action === 'Device replacement requested')).toBe(true)
  })

  it('consultation starts once, saves notes, creates a task and completes once with audit', () => {
    const api = useVirtualWardStore.getState()
    expect(api.startConsultation('CON-1').ok).toBe(true)
    expect(useVirtualWardStore.getState().consultations.find(c => c.id === 'CON-1')?.status).toBe('In progress')
    expect(api.updateConsultationNotes('CON-1', 'Remote observations reviewed.').ok).toBe(true)
    expect(api.addTask('PT-20162', 'Virtual visit follow-up', 'Tomorrow', 'Clinical').ok).toBe(true)
    expect(api.completeConsultation('CON-1', 'Session notes recorded').ok).toBe(true)
    const completed = useVirtualWardStore.getState().consultations.find(c => c.id === 'CON-1')!
    const completedAt = completed.completedAt
    expect(completed.status).toBe('Completed')
    expect(api.completeConsultation('CON-1', 'Second completion').ok).toBe(false)
    expect(useVirtualWardStore.getState().consultations.find(c => c.id === 'CON-1')?.completedAt).toBe(completedAt)
    expect(useVirtualWardStore.getState().audits.some(a => a.action === 'Virtual consultation completed')).toBe(true)
  })

  it('monitoring-plan update reduces high risk after consultant intervention', () => {
    useVirtualWardStore.getState().setRole('Consultant Physician')
    useVirtualWardStore.setState(state => ({ ...state, patients: state.patients.map(p => p.id === 'PT-20284' ? { ...p, risk: 'High Risk' } : p) }))
    expect(useVirtualWardStore.getState().updateCarePlan('PT-20284', 'Increase SpO2 review frequency', 'Today, 16:00').ok).toBe(true)
    expect(useVirtualWardStore.getState().patients.find(p => p.id === 'PT-20284')?.risk).toBe('Needs Review')
    expect(useVirtualWardStore.getState().audits.some(a => a.patientId === 'PT-20284' && a.action === 'Monitoring plan updated')).toBe(true)
  })

  it('heart failure sequence creates abnormal weight alert and symptom', () => {
    useVirtualWardStore.getState().setScenario('Heart Failure Weight Change')
    useVirtualWardStore.getState().advanceScenario()
    const state = useVirtualWardStore.getState()
    expect(state.patients.find(p => p.id === 'PT-20162')?.symptoms).toContain('New swelling reported')
    expect(state.alerts.some(a => a.patientId === 'PT-20162' && a.trigger.includes('weight'))).toBe(true)
  })

  it('hypertension sequence creates clinician-review signal', () => {
    useVirtualWardStore.getState().setScenario('Hypertension Trend')
    for (let i = 0; i < 3; i++) useVirtualWardStore.getState().advanceScenario()
    const state = useVirtualWardStore.getState()
    expect(state.patients.find(p => p.id === 'PT-20091')?.risk).toBe('Needs Review')
    expect(state.alerts.some(a => a.patientId === 'PT-20091' && a.trigger.includes('elevated BP'))).toBe(true)
  })

  it('post-operative sequence records deterministic high temperature', () => {
    useVirtualWardStore.getState().setScenario('Post-operative Monitoring')
    useVirtualWardStore.getState().advanceScenario()
    expect(useVirtualWardStore.getState().observations.some(o => o.patientId === 'PT-20412' && o.type === 'Temperature' && o.value === 38.2)).toBe(true)
  })

  it('medication workflow is audited and patient communication is preserved', () => {
    useVirtualWardStore.getState().setScenario('Missed Medication')
    useVirtualWardStore.getState().advanceScenario()
    let state = useVirtualWardStore.getState()
    const alert = state.alerts.find(a => a.patientId === 'PT-20301' && a.type === 'Medication Adherence')!
    expect(state.medications.find(m => m.patientId === 'PT-20301')?.today).toBe('Missed')
    expect(useVirtualWardStore.getState().contactPatient(alert.id).ok).toBe(true)
    state = useVirtualWardStore.getState()
    expect(state.messages.some(m => m.patientId === 'PT-20301')).toBe(true)
    expect(state.timeline.some(e => e.patientId === 'PT-20301' && e.type === 'Communication')).toBe(true)
    expect(state.audits.some(a => a.patientId === 'PT-20301' && a.action === 'Patient contacted')).toBe(true)
  })

  it('patient check-in normalizes no symptom and updates adherence/device concern state', () => {
    useVirtualWardStore.getState().setRole('Patient / Caregiver')
    const beforeSymptoms = useVirtualWardStore.getState().patients.find(p => p.id === 'PT-20284')!.symptoms.length
    expect(useVirtualWardStore.getState().submitCheckIn('PT-20284', 'No new symptoms', 'Mild', false, true).ok).toBe(true)
    const state = useVirtualWardStore.getState()
    const patient = state.patients.find(p => p.id === 'PT-20284')!
    expect(patient.symptoms).toHaveLength(beforeSymptoms)
    expect(patient.symptoms.join(' ')).not.toContain('No new symptoms')
    expect(state.medications.find(m => m.patientId === 'PT-20284')?.today).toBe('Unconfirmed')
    expect(state.devices.some(d => d.patientId === 'PT-20284' && d.status === 'Needs Attention')).toBe(true)
    expect(state.alerts.some(a => a.patientId === 'PT-20284' && a.type === 'Device Offline')).toBe(true)
    expect(state.audits.some(a => a.patientId === 'PT-20284' && a.action === 'Patient check-in submitted')).toBe(true)
  })

  it('virtual discharge scenario completes mandatory readiness but not autonomous discharge', () => {
    useVirtualWardStore.getState().setScenario('Virtual Discharge')
    useVirtualWardStore.getState().advanceScenario()
    const state = useVirtualWardStore.getState()
    expect(state.tasks.filter(t => t.patientId === 'PT-20425').every(t => t.status === 'Completed')).toBe(true)
    expect(state.reviews.filter(r => r.patientId === 'PT-20425').some(r => r.type === 'Doctor' && r.status === 'Completed')).toBe(true)
    expect(state.patients.find(p => p.id === 'PT-20425')?.monitoringStatus).toBe('Active')
  })
})
