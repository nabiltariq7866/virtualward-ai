import type { Alert, CarePlan, Medication, Observation, Patient, Review, SummaryStatement, TimelineEvent } from '../../types/domain'

export function detectVitalTrend(readings: Observation[]) {
  const sorted = [...readings].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  if (sorted.length < 3) return { direction: 'Stable', flagged: false, explanation: 'Insufficient change across recent readings.' }
  const vals = sorted.slice(-5).map(r => r.value)
  const falling = vals.every((v, i) => i === 0 || v <= vals[i - 1]) && vals.at(-1)! < vals[0]
  const rising = vals.every((v, i) => i === 0 || v >= vals[i - 1]) && vals.at(-1)! > vals[0]
  return {
    direction: falling ? 'Falling' : rising ? 'Rising' : 'Stable',
    flagged: falling || rising,
    explanation: `${sorted[0].type} changed from ${vals[0]} to ${vals.at(-1)} ${sorted[0].unit} across ${vals.length} readings.`,
  }
}

export function calculateMonitoringRisk(patient: Patient, readings: Observation[]) {
  const spo2 = readings.filter(r => r.type === 'SpO2').sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  if (spo2.at(-1)?.value! <= 92) return { risk: 'High Risk' as const, reasons: ['SpO2 declined across consecutive readings', ...patient.symptoms] }
  if (spo2.at(-1)?.value! <= 94 || readings.some(r => r.status === 'High' || r.status === 'Attention')) return { risk: 'Needs Review' as const, reasons: ['An observation crossed the demo review threshold', ...patient.symptoms.slice(-1)] }
  if (patient.symptoms.some(s => s.toLowerCase().includes('severe'))) return { risk: 'High Risk' as const, reasons: ['A severe patient-reported symptom requires clinical review'] }
  return { risk: 'Stable' as const, reasons: ['Recent observations remain within the demo baseline'] }
}

export function calculateReadmissionSignal(patient: Patient, unresolvedAlerts: number) {
  return {
    level: unresolvedAlerts > 1 || patient.adherence < 75 ? 'High' : unresolvedAlerts ? 'Moderate' : 'Low',
    factors: [
      patient.day < 4 ? 'Recent admission' : 'Ongoing monitoring episode',
      unresolvedAlerts ? `${unresolvedAlerts} unresolved alert event(s)` : 'No unresolved alerts',
      patient.adherence < 85 ? 'Adherence concern' : 'Adherence maintained',
    ],
    disclaimer: 'Demo risk model. Not validated for clinical use.',
  }
}

export function detectAdherenceConcern(missed: number) {
  return {
    flagged: missed >= 2,
    summary: missed >= 2 ? `${missed} scheduled doses were unconfirmed. Review adherence with the patient.` : 'No current adherence concern.',
  }
}

export function generatePatientSummary(patient: Patient, readings: Observation[]) {
  const latest = [...readings].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))[0]
  return `${patient.name} is on day ${patient.day} of ${patient.pathway} virtual monitoring. Current monitoring state is ${patient.risk.toLowerCase()}. ${latest ? `Latest ${latest.type} is ${latest.value}${latest.unit}.` : 'No recent readings.'} AI-assisted summary; clinician review required.`
}

export function generatePatientSummaryWithSources(
  patient: Patient,
  readings: Observation[],
  medications: Medication[],
  reviews: Review[],
  timeline: TimelineEvent[],
  plan?: CarePlan,
): SummaryStatement[] {
  const sorted = [...readings].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
  const latest = sorted[0]
  const recentReview = [...reviews].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]
  const checkin = [...timeline].filter(e => e.type === 'Patient Check-in').sort((a, b) => +new Date(b.time) - +new Date(a.time))[0]
  const concernMeds = medications.filter(m => ['Missed', 'Late', 'Unconfirmed'].includes(m.today))
  const statements: SummaryStatement[] = []

  if (plan) {
    statements.push({
      id: 'summary-episode',
      text: `${patient.name} is on day ${patient.day} of ${patient.pathway} virtual monitoring under the ${plan.planName || `${patient.pathway} demo plan`}.`,
      sources: [{ id: `src-plan-${patient.id}`, sourceType: 'Care Plan', sourceId: patient.id, label: plan.planName || 'Care plan' }],
    })
  }
  if (latest) {
    statements.push({
      id: 'summary-latest-reading',
      text: `The latest ${latest.type} reading is ${latest.value}${latest.secondaryValue ? `/${latest.secondaryValue}` : ''}${latest.unit} and is marked ${latest.status.toLowerCase()} in this demo.`,
      sources: [{ id: `src-${latest.id}`, sourceType: 'Observation', sourceId: latest.id, label: `${latest.type} · ${new Date(latest.timestamp).toLocaleString()}`, timestamp: latest.timestamp }],
    })
  }
  const latestTypeReadings = latest ? sorted.filter(reading => reading.type === latest.type).sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)).slice(-5) : []
  if (latestTypeReadings.length >= 3) {
    const trend = detectVitalTrend(latestTypeReadings)
    if (trend.flagged) {
      const first = latestTypeReadings[0]
      const last = latestTypeReadings.at(-1)!
      statements.push({
        id: 'summary-reading-trend',
        text: `${latest!.type} shows a ${trend.direction.toLowerCase()} synthetic monitoring trend from ${first.value}${first.unit} to ${last.value}${last.unit}; clinical review may be appropriate.`,
        sources: [first, last].map(reading => ({ id: `src-${reading.id}`, sourceType: 'Observation' as const, sourceId: reading.id, label: `${reading.type} · ${reading.value}${reading.unit} · ${new Date(reading.timestamp).toLocaleString()}`, timestamp: reading.timestamp })),
      })
    }
  }
  if (concernMeds.length) {
    statements.push({
      id: 'summary-adherence',
      text: `${concernMeds.length} medication record(s) currently show missed, late or unconfirmed adherence and require review with the patient.`,
      sources: concernMeds.map(m => ({ id: `src-${m.id}`, sourceType: 'Medication', sourceId: m.id, label: `${m.name} · ${m.today}` })),
    })
  }
  if (checkin) {
    statements.push({
      id: 'summary-checkin',
      text: 'A recent patient check-in is available for clinical review.',
      sources: [{ id: `src-${checkin.id}`, sourceType: 'Patient Check-in', sourceId: checkin.id, label: `Check-in · ${new Date(checkin.time).toLocaleString()}`, timestamp: checkin.time }],
    })
  }
  const deviceEvent = [...timeline].filter(e => e.type === 'Device').sort((a, b) => +new Date(b.time) - +new Date(a.time))[0]
  if (deviceEvent) {
    statements.push({
      id: 'summary-device-event',
      text: `A recent monitoring-device event is recorded: ${deviceEvent.title}.`,
      sources: [{ id: `src-${deviceEvent.id}`, sourceType: 'Device Event', sourceId: deviceEvent.id, label: `${deviceEvent.title} · ${new Date(deviceEvent.time).toLocaleString()}`, timestamp: deviceEvent.time }],
    })
  }
  if (recentReview) {
    statements.push({
      id: 'summary-review',
      text: `The latest ${recentReview.type.toLowerCase()} review is ${recentReview.status.toLowerCase()} with disposition: ${recentReview.disposition}.`,
      sources: [{ id: `src-${recentReview.id}`, sourceType: 'Clinical Review', sourceId: recentReview.id, label: `${recentReview.type} review · ${recentReview.status}`, timestamp: recentReview.createdAt }],
    })
  }
  if (!statements.length) {
    statements.push({ id: 'summary-none', text: 'No supporting record was found in the current synthetic data.', sources: [] })
  }
  return statements
}

export function explainRiskSignal(patient: Patient, readings: Observation[]) {
  const result = calculateMonitoringRisk(patient, readings)
  const recent = [...readings].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 5)
  return {
    label: result.risk,
    reasons: result.reasons,
    window: 'Most recent 5 observations',
    sources: recent.map(r => ({ id: r.id, label: `${r.type} ${r.value}${r.unit}`, timestamp: r.timestamp })),
    disclaimer: 'AI-assisted risk prioritization. Requires clinician review.',
  }
}

export function generateMonitoringInsights(patients: Patient[], alerts: Alert[], observations: Observation[]) {
  const open = alerts.filter(a => !['Resolved', 'Dismissed'].includes(a.status))
  const high = patients.filter(p => p.risk === 'High Risk')
  const missing = open.filter(a => a.type === 'Missing Reading')
  const device = open.filter(a => a.type === 'Device Offline')
  return [
    {
      id: 'insight-risk',
      observation: `${high.length} patient(s) currently have a high-priority monitoring signal.`,
      patientIds: high.map(p => p.id),
      evidence: open.filter(a => high.some(p => p.id === a.patientId)).flatMap(a => a.evidence).slice(0, 5),
      why: 'These patients should be prioritized in the next clinical review cycle.',
      action: 'Review supporting observations and current alerts.',
    },
    {
      id: 'insight-missing',
      observation: `${missing.length} unresolved missing-reading alert(s) are present.`,
      patientIds: [...new Set(missing.map(a => a.patientId))],
      evidence: missing.map(a => a.trigger),
      why: 'Monitoring continuity can be affected when expected readings are not received.',
      action: 'Check device connectivity and contact the patient where appropriate.',
    },
    {
      id: 'insight-device',
      observation: `${device.length} device continuity alert(s) require attention.`,
      patientIds: [...new Set(device.map(a => a.patientId))],
      evidence: device.map(a => a.trigger),
      why: 'Offline or unavailable monitoring devices can interrupt the remote-care workflow.',
      action: 'Review the device timeline and simulate reconnect or replacement.',
    },
    {
      id: 'insight-trends',
      observation: `${observations.filter(o => o.status !== 'Normal').length} recent synthetic observations are marked for attention or high review.`,
      patientIds: [...new Set(observations.filter(o => o.status !== 'Normal').map(o => o.patientId))],
      evidence: observations.filter(o => o.status !== 'Normal').slice(-5).map(o => `${o.type} ${o.value}${o.unit}`),
      why: 'Repeated non-normal observations can help the team prioritize manual review.',
      action: 'Open the relevant patient trend and inspect exact evidence.',
    },
  ]
}
