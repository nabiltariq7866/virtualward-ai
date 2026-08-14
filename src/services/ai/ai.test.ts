import { describe, expect, it } from 'vitest'
import {
  calculateMonitoringRisk,
  detectAdherenceConcern,
  detectVitalTrend,
  generatePatientSummaryWithSources,
} from './index'
import { seedState } from '../../data/seed'
import type { Observation } from '../../types/domain'
import { detectMissingReadings } from './missingReadingAI'

describe('deterministic AI services', () => {
  const patient = seedState.patients.find(p => p.id === 'PT-20284')!

  it('detects the specified declining COPD sequence without diagnosing', () => {
    const readings = [97, 96, 95, 94, 92].map((value, index) => ({
      id: `x${index}`,
      patientId: patient.id,
      type: 'SpO2',
      value,
      unit: '%',
      timestamp: new Date(2026, 7, 14, 8 + index).toISOString(),
      source: 'test',
      status: value <= 92 ? 'High' : 'Normal',
    } as Observation))
    const trend = detectVitalTrend(readings)
    expect(trend.direction).toBe('Falling')
    expect(trend.flagged).toBe(true)
    const risk = calculateMonitoringRisk({ ...patient, symptoms: ['Increased breathlessness'] }, readings)
    expect(risk.risk).toBe('High Risk')
    expect(risk.reasons.join(' ')).toContain('SpO2')
    expect(risk.reasons.join(' ').toLowerCase()).not.toContain('respiratory failure')
  })

  it('only flags adherence after two missed confirmations', () => {
    expect(detectAdherenceConcern(1).flagged).toBe(false)
    expect(detectAdherenceConcern(2).flagged).toBe(true)
  })

  it('patient summary statements resolve to exact synthetic source records', () => {
    const readings = seedState.observations.filter(o => o.patientId === patient.id)
    const medications = seedState.medications.filter(m => m.patientId === patient.id)
    const reviews = seedState.reviews.filter(r => r.patientId === patient.id)
    const timeline = seedState.timeline.filter(e => e.patientId === patient.id)
    const plan = seedState.carePlans.find(c => c.patientId === patient.id)
    const statements = generatePatientSummaryWithSources(patient, readings, medications, reviews, timeline, plan)
    expect(statements.length).toBeGreaterThan(0)
    const observationCitation = statements.flatMap(s => s.sources).find(source => source.sourceType === 'Observation')
    expect(observationCitation).toBeTruthy()
    expect(readings.some(reading => reading.id === observationCitation?.sourceId)).toBe(true)
    const planCitation = statements.flatMap(s => s.sources).find(source => source.sourceType === 'Care Plan')
    expect(planCitation?.sourceId).toBe(patient.id)
  })


  it('trend summary cites the exact first and last observations used in the explanation', () => {
    const readings = [97, 96, 95, 94, 92].map((value, index) => ({
      id: `trend-${index}`,
      patientId: patient.id,
      type: 'SpO2',
      value,
      unit: '%',
      timestamp: new Date(2026, 7, 14, 8 + index).toISOString(),
      source: 'Pulse Oximeter',
      status: value <= 92 ? 'High' : value <= 94 ? 'Attention' : 'Normal',
    } as Observation))
    const plan = seedState.carePlans.find(c => c.patientId === patient.id)
    const statements = generatePatientSummaryWithSources(patient, readings, [], [], [], plan)
    const trend = statements.find(statement => statement.id === 'summary-reading-trend')
    expect(trend).toBeTruthy()
    expect(trend?.sources.map(source => source.sourceId)).toEqual(['trend-0', 'trend-4'])
    expect(trend?.text).toContain('97%')
    expect(trend?.text).toContain('92%')
  })

  it('missing-reading detection is derived from the active care-plan observation schedule', () => {
    const missing = detectMissingReadings(seedState.patients, seedState.carePlans, seedState.observations, seedState.devices)
    expect(missing.length).toBeGreaterThan(0)
    for (const row of missing) {
      const plan = seedState.carePlans.find(c => c.patientId === row.patientId && c.status === 'Active')
      expect(plan?.observations.some(item => item.type === row.type)).toBe(true)
      expect(row.status).toBe('Missing')
      expect(row.overdueMinutes).toBeGreaterThan(0)
    }
  })

})
