import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedState } from '../data/seed'
import { calculateMonitoringRisk } from '../services/ai'
import { deriveExpectedReadings, deterministicDeviceReading } from '../utils/monitoring'
import type {
  Alert,
  AuditEvent,
  CarePlan,
  Consultation,
  DischargeInput,
  DischargeRecord,
  EnrolPatientInput,
  Integration,
  Medication,
  Message,
  Observation,
  Patient,
  Review,
  Role,
  Task,
  TimelineEvent,
  VitalType,
} from '../types/domain'

export type Scenario =
  | 'Stable Monitoring'
  | 'COPD Deterioration'
  | 'Heart Failure Weight Change'
  | 'Missed Medication'
  | 'Device Disconnection'
  | 'Post-operative Monitoring'
  | 'Hypertension Trend'
  | 'Virtual Discharge'

export type PermissionAction =
  | 'enrol'
  | 'review'
  | 'escalate'
  | 'plan'
  | 'device'
  | 'discharge'
  | 'analytics'
  | 'admin'
  | 'communication'
  | 'medication'
  | 'task'
  | 'consultation'

export interface ActionResult { ok: boolean; error?: string }

type State = typeof seedState & {
  role: Role
  scenario: Scenario
  scenarioStep: number
  scenarioRunning: boolean
  setRole: (role: Role) => void
  resetDemo: () => void
  advanceScenario: () => void
  setScenario: (scenario: Scenario) => void
  setScenarioRunning: (value: boolean) => void
  enrolPatient: (data: EnrolPatientInput) => string
  addObservation: (patientId: string, type: VitalType, value: number, unit: string, source?: string, secondaryValue?: number, deviceId?: string) => boolean
  acknowledgeAlert: (id: string) => ActionResult
  contactPatient: (id: string, message?: string) => ActionResult
  resolveAlert: (id: string, reason: string) => ActionResult
  assignAlert: (id: string, person: string) => ActionResult
  dismissAlert: (id: string, reason: string) => ActionResult
  createReview: (patientId: string, reason: string, notes: string, disposition: string) => ActionResult
  createEscalation: (patientId: string, reason: string, notes: string) => ActionResult
  completeDoctorReview: (id: string, notes: string, disposition?: string) => ActionResult
  updateCarePlan: (patientId: string, notes: string, nextReview: string) => ActionResult
  updateObservationSchedule: (patientId: string, observations: CarePlan['observations']) => ActionResult
  updateTask: (id: string, status: Task['status']) => ActionResult
  recordMedication: (id: string, status: Medication['today']) => ActionResult
  disconnectDevice: (id: string) => ActionResult
  reconnectDevice: (id: string) => ActionResult
  assignDevice: (deviceId: string, patientId: string) => ActionResult
  replaceDevice: (id: string) => ActionResult
  addTask: (patientId: string, title: string, due: string, category: string) => ActionResult
  sendMessage: (patientId: string, body: string, channel: Message['channel']) => ActionResult
  createConsultation: (patientId: string) => ActionResult
  updateConsultationNotes: (id: string, notes: string) => ActionResult
  startConsultation: (id: string) => ActionResult
  completeConsultation: (id: string, notes: string) => ActionResult
  submitCheckIn: (patientId: string, symptom: string, severity: string, tookMedication: boolean, deviceProblem: boolean) => ActionResult
  dischargePatient: (patientId: string, input?: DischargeInput | string) => ActionResult
  refreshMissingReadingAlerts: () => void
  updateIntegration: (id: string, status: Integration['status']) => ActionResult
  simulateIntegrationSync: (id: string) => ActionResult
}

const cloneSeed = () => JSON.parse(JSON.stringify(seedState)) as typeof seedState
const stamp = () => new Date().toISOString()
let sequence = 0
const id = (prefix: string) => `${prefix}-${Date.now()}-${++sequence}`

const actorName = (role: Role) => ({
  'Virtual Ward Nurse': 'Rebecca Morgan',
  'Consultant Physician': 'Dr. James Howard',
  'Remote Care Coordinator': 'Remote Care Coordinator',
  Pharmacist: 'Clinical Pharmacist',
  'Operations Manager': 'Operations Manager',
  Administrator: 'Administrator',
  'Patient / Caregiver': 'Patient / Caregiver',
}[role])

const audit = (state: State, patientId: string | undefined, action: string, previousState: string, newState: string): AuditEvent => ({
  id: id('AUD'),
  time: stamp(),
  user: actorName(state.role),
  role: state.role,
  patientId,
  action,
  previousState,
  newState,
})

const event = (patientId: string, type: string, title: string, detail: string, actor = 'Rebecca Morgan'): TimelineEvent => ({
  id: id('EV'),
  patientId,
  time: stamp(),
  type,
  title,
  detail,
  actor,
})

const planObservations = (pathway: Patient['pathway'], increased = false): CarePlan['observations'] => {
  const base: Record<Patient['pathway'], CarePlan['observations']> = {
    COPD: [{ type: 'SpO2', frequency: '3 times daily' }, { type: 'Heart Rate', frequency: '3 times daily' }, { type: 'Temperature', frequency: 'Daily' }],
    'Heart Failure': [{ type: 'Weight', frequency: 'Daily' }, { type: 'Blood Pressure', frequency: 'Twice daily' }, { type: 'Heart Rate', frequency: 'Daily' }],
    Diabetes: [{ type: 'Glucose', frequency: '3 times daily' }],
    'Post-operative': [{ type: 'Temperature', frequency: 'Daily' }, { type: 'Pain', frequency: 'Daily' }, { type: 'Mobility', frequency: 'Daily' }],
    Hypertension: [{ type: 'Blood Pressure', frequency: 'Twice daily' }],
  }
  return base[pathway].map(item => ({ ...item, frequency: increased && item.frequency === 'Daily' ? 'Twice daily' : item.frequency }))
}

const severityForObservation = (type: VitalType, value: number): Observation['status'] => {
  const high = (type === 'SpO2' && value <= 92) || (type === 'Temperature' && value >= 38) || (type === 'Glucose' && value >= 14)
  const attention = (type === 'SpO2' && value <= 94) || (type === 'Blood Pressure' && value >= 150) || (type === 'Weight' && value >= 80) || (type === 'Glucose' && value >= 11)
  return high ? 'High' : attention ? 'Attention' : 'Normal'
}

const permissionError = (action: PermissionAction) => `Current role does not have permission to perform ${action.replace('-', ' ')} actions.`

export const can = (role: Role, action: PermissionAction) => ({
  enrol: ['Virtual Ward Nurse', 'Remote Care Coordinator', 'Administrator'],
  review: ['Virtual Ward Nurse', 'Consultant Physician', 'Pharmacist'],
  escalate: ['Virtual Ward Nurse'],
  plan: ['Consultant Physician'],
  device: ['Remote Care Coordinator', 'Administrator'],
  discharge: ['Consultant Physician'],
  analytics: ['Operations Manager', 'Administrator', 'Consultant Physician'],
  admin: ['Administrator'],
  communication: ['Virtual Ward Nurse', 'Consultant Physician', 'Remote Care Coordinator', 'Pharmacist'],
  medication: ['Virtual Ward Nurse', 'Pharmacist'],
  task: ['Virtual Ward Nurse', 'Consultant Physician', 'Remote Care Coordinator', 'Administrator', 'Patient / Caregiver'],
  consultation: ['Virtual Ward Nurse', 'Consultant Physician', 'Remote Care Coordinator'],
}[action] as Role[]).includes(role)

export const useVirtualWardStore = create<State>()(persist((set, get) => ({
  ...cloneSeed(),
  role: 'Virtual Ward Nurse',
  scenario: 'COPD Deterioration',
  scenarioStep: 0,
  scenarioRunning: false,

  setRole: role => set({ role }),
  resetDemo: () => set({ ...cloneSeed(), role: 'Virtual Ward Nurse', scenario: 'COPD Deterioration', scenarioStep: 0, scenarioRunning: false }),
  setScenario: scenario => set({ scenario, scenarioStep: 0, scenarioRunning: false }),
  setScenarioRunning: scenarioRunning => set({ scenarioRunning }),

  enrolPatient: data => {
    const state = get()
    if (!can(state.role, 'enrol')) throw new Error(permissionError('enrol'))
    if (state.patients.some(p => p.monitoringStatus !== 'Completed' && p.name.trim().toLowerCase() === data.name.trim().toLowerCase())) {
      throw new Error('An active Virtual Ward episode already exists for this patient.')
    }
    const selectedDevice = data.deviceId ? state.devices.find(d => d.id === data.deviceId) : undefined
    if (data.deviceId && (!selectedDevice || selectedDevice.patientId)) throw new Error('The selected demo device is no longer available.')

    const newId = `PT-${20500 + state.patients.length}`
    const episodeId = `VW-2026-${450 + state.patients.length}`
    const start = new Date(`${data.startDate}T09:00:00`)
    const expected = new Date(start.getTime() + data.duration * 86400000)
    const patient: Patient = {
      id: newId,
      episodeId,
      name: data.name,
      age: data.age,
      pathway: data.pathway,
      condition: data.condition,
      startDate: data.startDate,
      expectedEndDate: expected.toISOString().slice(0, 10),
      day: 1,
      risk: 'Stable',
      monitoringStatus: 'Active',
      nurse: data.nurse,
      consultant: data.consultant,
      lastContact: 'Not contacted',
      nextReview: 'Tomorrow, 09:00',
      adherence: 100,
      deviceIds: data.deviceId ? [data.deviceId] : [],
      symptoms: [],
      summary: 'Newly enrolled. Baseline monitoring is active.',
      patientContact: data.contact,
      emergencyContact: data.emergencyContact,
      monitoringPlanName: data.monitoringPlan,
    }
    const plan: CarePlan = {
      patientId: newId,
      pathway: data.pathway,
      goals: ['Establish baseline remote observations', 'Maintain contact with the Virtual Ward team'],
      observations: planObservations(data.pathway, data.monitoringPlan.includes('increased-frequency')),
      notes: `${data.monitoringPlan}. Synthetic demonstration plan; clinician decision required for all changes.`,
      nextReview: patient.nextReview,
      status: 'Active',
      medicationTasks: ['Confirm scheduled medication adherence'],
      checkIns: ['Daily patient check-in'],
      reviews: ['Nurse review as scheduled', 'Consultant review when escalated'],
      educationTasks: ['Remote monitoring education'],
      escalationInstructions: 'Review monitoring evidence, contact the patient and escalate to the assigned consultant when clinical review is required.',
      assignedTeam: { nurse: data.nurse, consultant: data.consultant },
      startDate: data.startDate,
      expectedEndDate: patient.expectedEndDate,
      planName: data.monitoringPlan,
    }

    set(s => ({
      ...s,
      patients: [patient, ...s.patients],
      carePlans: [plan, ...s.carePlans],
      devices: data.deviceId ? s.devices.map(d => d.id === data.deviceId ? { ...d, patientId: newId, status: 'Connected', lastSync: stamp(), connectionHistory: [...d.connectionHistory, { time: stamp(), event: `Assigned to ${data.name}` }] } : d) : s.devices,
      tasks: [
        { id: id('T'), patientId: newId, title: 'Complete baseline observations', due: 'Today', status: 'Due', required: true, category: 'Observation' },
        { id: id('T'), patientId: newId, title: 'Complete first patient check-in', due: 'Today', status: 'Due', required: true, category: 'Check-in' },
        ...s.tasks,
      ],
      timeline: [event(newId, 'Enrolment', 'Patient enrolled in Virtual Ward', `${data.monitoringPlan}; monitoring duration ${data.duration} days`, actorName(s.role)), ...s.timeline],
      audits: [audit(s, newId, 'Patient enrolled', 'Not enrolled', `Active episode ${episodeId}; start ${data.startDate}; duration ${data.duration} days`), ...s.audits],
    }))
    return newId
  },

  addObservation: (patientId, type, value, unit, source = 'Manual patient entry', secondaryValue, deviceId) => {
    const state = get()
    const patient = state.patients.find(p => p.id === patientId)
    if (!patient || patient.monitoringStatus === 'Completed' || !Number.isFinite(value) || value <= 0) return false
    const readingTime = new Date(Math.max(Date.now(), ...state.observations.map(o => +new Date(o.timestamp))) + 60000).toISOString()
    const reading: Observation = {
      id: id('OBS'), patientId, type, value, secondaryValue, unit, timestamp: readingTime, source, deviceId,
      status: severityForObservation(type, value),
    }
    const observations = [...state.observations, reading]
    const signal = calculateMonitoringRisk(patient, observations.filter(o => o.patientId === patientId))
    const existing = state.alerts.some(a => a.patientId === patientId && a.type === 'Vital Trend' && !['Resolved', 'Dismissed'].includes(a.status))
    const newAlert: Alert | undefined = signal.risk !== 'Stable' && !existing ? {
      id: id('ALT'), patientId, type: 'Vital Trend', priority: signal.risk === 'High Risk' ? 'Urgent Review' : 'High',
      trigger: `${type} observation requires clinician review`, evidence: [`${type} ${value}${unit}`, ...signal.reasons],
      createdAt: stamp(), assignedTo: patient.nurse, status: 'Needs Review',
    } : undefined
    set(s => ({
      ...s,
      observations,
      patients: s.patients.map(p => p.id === patientId ? { ...p, risk: signal.risk, monitoringStatus: signal.risk === 'Stable' ? 'Active' : 'Needs Attention' } : p),
      devices: deviceId ? s.devices.map(d => d.id === deviceId ? { ...d, lastSync: readingTime } : d) : s.devices,
      alerts: [
        ...(newAlert ? [newAlert] : []),
        ...s.alerts.map(a => a.patientId === patientId && a.type === 'Missing Reading' && !['Resolved', 'Dismissed'].includes(a.status) && a.evidence.some(e => e.includes(type))
          ? { ...a, status: 'Resolved' as const, resolvedAt: stamp(), resolution: `${type} reading received` }
          : a),
      ],
      timeline: [event(patientId, 'Observation', 'Reading received', `${type}: ${value}${secondaryValue ? `/${secondaryValue}` : ''}${unit}`, source), ...s.timeline],
      audits: [
        audit(s, patientId, 'Observation recorded', 'No new reading', `${type} ${value}${unit} from ${source}`),
        ...(signal.risk !== patient.risk ? [audit(s, patientId, 'AI-assisted risk signal changed', patient.risk, signal.risk)] : []),
        ...s.audits,
      ],
    }))
    return true
  },

  acknowledgeAlert: alertId => {
    const s = get()
    if (!can(s.role, 'review')) return { ok: false, error: permissionError('review') }
    const alert = s.alerts.find(a => a.id === alertId)
    if (!alert || alert.status !== 'Needs Review') return { ok: false, error: 'Alert is no longer awaiting acknowledgement.' }
    set(x => ({ ...x, alerts: x.alerts.map(a => a.id === alertId ? { ...a, status: 'Acknowledged', acknowledgedAt: stamp() } : a), audits: [audit(x, alert.patientId, 'Alert acknowledged', alert.status, 'Acknowledged'), ...x.audits] }))
    return { ok: true }
  },

  assignAlert: (alertId, person) => {
    const s = get()
    if (!can(s.role, 'review')) return { ok: false, error: permissionError('review') }
    const alert = s.alerts.find(a => a.id === alertId)
    if (!alert) return { ok: false, error: 'Alert unavailable.' }
    set(x => ({ ...x, alerts: x.alerts.map(a => a.id === alertId ? { ...a, assignedTo: person } : a), audits: [audit(x, alert.patientId, 'Alert assigned', alert.assignedTo, person), ...x.audits] }))
    return { ok: true }
  },

  contactPatient: (alertId, message = 'We are reviewing your recent monitoring information and would like to check in.') => {
    const s = get()
    if (!can(s.role, 'communication')) return { ok: false, error: permissionError('communication') }
    const alert = s.alerts.find(a => a.id === alertId)
    if (!alert) return { ok: false, error: 'Alert unavailable.' }
    set(x => ({
      ...x,
      alerts: x.alerts.map(a => a.id === alertId && !['Resolved', 'Dismissed'].includes(a.status) ? { ...a, status: 'Contacted' } : a),
      patients: x.patients.map(p => p.id === alert.patientId ? { ...p, lastContact: stamp() } : p),
      messages: [{ id: id('MSG'), patientId: alert.patientId, channel: 'App', sender: actorName(x.role), body: message, time: stamp(), status: 'Sent' }, ...x.messages],
      timeline: [event(alert.patientId, 'Communication', 'Patient contacted', message, actorName(x.role)), ...x.timeline],
      audits: [audit(x, alert.patientId, 'Patient contacted', alert.status, 'Contacted'), ...x.audits],
    }))
    return { ok: true }
  },

  resolveAlert: (alertId, reason) => {
    const s = get()
    if (!can(s.role, 'review')) return { ok: false, error: permissionError('review') }
    if (!reason.trim()) return { ok: false, error: 'A resolution reason is required.' }
    const alert = s.alerts.find(a => a.id === alertId)
    if (!alert || alert.status === 'Resolved') return { ok: false, error: 'Alert already resolved.' }
    set(x => ({ ...x, alerts: x.alerts.map(a => a.id === alertId ? { ...a, status: 'Resolved', resolvedAt: stamp(), resolution: reason } : a), timeline: [event(alert.patientId, 'Alert', 'Alert resolved', reason, actorName(x.role)), ...x.timeline], audits: [audit(x, alert.patientId, 'Alert resolved', alert.status, `Resolved: ${reason}`), ...x.audits] }))
    return { ok: true }
  },

  dismissAlert: (alertId, reason) => {
    const s = get()
    if (!can(s.role, 'review')) return { ok: false, error: permissionError('review') }
    if (!reason.trim()) return { ok: false, error: 'A dismissal reason is required.' }
    const alert = s.alerts.find(a => a.id === alertId)
    if (!alert || alert.status === 'Resolved' || alert.priority === 'Urgent Review') return { ok: false, error: alert?.priority === 'Urgent Review' ? 'Urgent Review alerts cannot be dismissed.' : 'Alert cannot be dismissed.' }
    set(x => ({ ...x, alerts: x.alerts.map(a => a.id === alertId ? { ...a, status: 'Dismissed', resolvedAt: stamp(), resolution: reason } : a), timeline: [event(alert.patientId, 'Alert', 'Alert dismissed', reason, actorName(x.role)), ...x.timeline], audits: [audit(x, alert.patientId, 'Alert dismissed', alert.status, `Dismissed: ${reason}`), ...x.audits] }))
    return { ok: true }
  },

  createReview: (patientId, reason, notes, disposition) => {
    const s = get()
    if (s.role !== 'Virtual Ward Nurse') return { ok: false, error: 'Virtual Ward Nurse permission required to complete a nurse review.' }
    if (!notes.trim()) return { ok: false, error: 'Review notes are required.' }
    set(x => ({ ...x, reviews: [{ id: id('REV'), patientId, type: 'Nurse', reason, notes, disposition, status: 'Completed', createdAt: stamp() }, ...x.reviews], timeline: [event(patientId, 'Clinical Review', 'Nurse review completed', `${disposition}: ${notes}`, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Nurse review completed', 'Open', disposition), ...x.audits] }))
    return { ok: true }
  },

  createEscalation: (patientId, reason, notes) => {
    const s = get()
    if (!can(s.role, 'escalate')) return { ok: false, error: permissionError('escalate') }
    set(x => ({ ...x, reviews: [{ id: id('ESC'), patientId, type: 'Doctor', reason, notes, disposition: 'Awaiting doctor review', status: 'Open', createdAt: stamp() }, ...x.reviews], alerts: x.alerts.map(a => a.patientId === patientId && !['Resolved', 'Dismissed'].includes(a.status) ? { ...a, status: 'Escalated' } : a), timeline: [event(patientId, 'Escalation', 'Doctor escalation created', reason, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Doctor escalation created', 'Nurse review', 'Awaiting doctor'), ...x.audits] }))
    return { ok: true }
  },

  completeDoctorReview: (reviewId, notes, disposition = 'Continue virtual care with increased review frequency') => {
    const s = get()
    if (s.role !== 'Consultant Physician') return { ok: false, error: 'Consultant Physician permission required.' }
    const review = s.reviews.find(r => r.id === reviewId)
    if (!review || review.status === 'Completed') return { ok: false, error: 'Review already completed or unavailable.' }
    set(x => ({ ...x, reviews: x.reviews.map(r => r.id === reviewId ? { ...r, status: 'Completed', notes, disposition } : r), timeline: [event(review.patientId, 'Clinical Review', 'Doctor review completed', notes, actorName(x.role)), ...x.timeline], audits: [audit(x, review.patientId, 'Doctor reviewed escalation', 'Open', `Completed · ${disposition}`), ...x.audits] }))
    return { ok: true }
  },

  updateCarePlan: (patientId, notes, nextReview) => {
    const s = get()
    if (!can(s.role, 'plan')) return { ok: false, error: permissionError('plan') }
    set(x => ({ ...x, carePlans: x.carePlans.map(p => p.patientId === patientId ? { ...p, notes, nextReview } : p), patients: x.patients.map(p => p.id === patientId ? { ...p, nextReview, risk: p.risk === 'High Risk' ? 'Needs Review' : p.risk, summary: p.risk === 'High Risk' ? 'Monitoring plan updated after clinician review; continued observation required.' : p.summary } : p), timeline: [event(patientId, 'Care Plan', 'Monitoring plan updated', notes, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Monitoring plan updated', 'Previous plan', notes), ...x.audits] }))
    return { ok: true }
  },

  updateObservationSchedule: (patientId, observations) => {
    const s = get()
    if (!can(s.role, 'plan')) return { ok: false, error: permissionError('plan') }
    if (!observations.length) return { ok: false, error: 'At least one observation type is required.' }
    set(x => ({ ...x, carePlans: x.carePlans.map(p => p.patientId === patientId ? { ...p, observations } : p), timeline: [event(patientId, 'Care Plan', 'Observation schedule updated', observations.map(o => `${o.type}: ${o.frequency}`).join('; '), actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Observation schedule updated', 'Previous schedule', `${observations.length} observation types`), ...x.audits] }))
    return { ok: true }
  },

  updateTask: (taskId, status) => {
    const s = get()
    if (!can(s.role, 'task')) return { ok: false, error: permissionError('task') }
    const task = s.tasks.find(t => t.id === taskId)
    if (!task) return { ok: false, error: 'Task unavailable.' }
    set(x => ({ ...x, tasks: x.tasks.map(t => t.id === taskId ? { ...t, status } : t), timeline: [event(task.patientId, 'Care Task', 'Task status updated', `${task.title}: ${task.status} → ${status}`, actorName(x.role)), ...x.timeline], audits: [audit(x, task.patientId, 'Task status updated', task.status, status), ...x.audits] }))
    return { ok: true }
  },

  recordMedication: (medicationId, today) => {
    const s = get()
    if (!can(s.role, 'medication')) return { ok: false, error: permissionError('medication') }
    const medication = s.medications.find(m => m.id === medicationId)
    if (!medication) return { ok: false, error: 'Medication record unavailable.' }
    const patient = s.patients.find(p => p.id === medication.patientId)
    set(x => ({ ...x, medications: x.medications.map(m => m.id === medicationId ? { ...m, today, history: [...m.history, today] } : m), patients: x.patients.map(p => p.id === medication.patientId ? { ...p, adherence: today === 'Taken' ? Math.min(100, p.adherence + 2) : Math.max(0, p.adherence - (today === 'Missed' ? 8 : 3)) } : p), timeline: [event(medication.patientId, 'Medication Adherence', 'Medication confirmation updated', `${medication.name}: ${today}`, actorName(x.role)), ...x.timeline], audits: [audit(x, medication.patientId, 'Medication adherence updated', medication.today, today), ...x.audits], alerts: today === 'Missed' && !x.alerts.some(a => a.patientId === medication.patientId && a.type === 'Medication Adherence' && !['Resolved', 'Dismissed'].includes(a.status)) ? [{ id: id('ALT'), patientId: medication.patientId, type: 'Medication Adherence', priority: 'Attention', trigger: 'Medication confirmation missed', evidence: [`${medication.name} marked missed`], createdAt: stamp(), assignedTo: patient?.nurse || 'Virtual Ward Nurse', status: 'Needs Review' }, ...x.alerts] : x.alerts }))
    return { ok: true }
  },

  disconnectDevice: deviceId => {
    const s = get()
    if (!can(s.role, 'device')) return { ok: false, error: permissionError('device') }
    const device = s.devices.find(d => d.id === deviceId)
    if (!device?.patientId) return { ok: false, error: 'Assigned device unavailable.' }
    const patient = s.patients.find(p => p.id === device.patientId)
    const alreadyOffline = device.status === 'Offline'
    const continuityTypes = ['Device Offline', 'Missing Reading']
    const newAlerts: Alert[] = alreadyOffline ? [] : continuityTypes.filter(type => !s.alerts.some(a => a.patientId === device.patientId && a.type === type && !['Resolved', 'Dismissed'].includes(a.status))).map(type => ({
      id: id('ALT'), patientId: device.patientId!, type, priority: 'Attention',
      trigger: type === 'Device Offline' ? 'Monitoring device offline' : 'Scheduled reading not received',
      evidence: type === 'Device Offline' ? [`Device ${deviceId} connection lost`] : [`${device.type} expected reading missing after demo grace period`],
      createdAt: stamp(), assignedTo: patient?.nurse || 'Remote Care Team', status: 'Needs Review',
    }))
    set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, status: 'Offline', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Connection lost' }] } : d), patients: x.patients.map(p => p.id === device.patientId && p.monitoringStatus !== 'Completed' ? { ...p, monitoringStatus: 'Needs Attention' } : p), alerts: [...newAlerts, ...x.alerts], timeline: [event(device.patientId!, 'Device', 'Device disconnected', `${device.type} ${deviceId} went offline`, actorName(x.role)), ...x.timeline], audits: [audit(x, device.patientId, 'Device disconnected', device.status, 'Offline'), ...x.audits] }))
    return { ok: true }
  },

  reconnectDevice: deviceId => {
    const s = get()
    if (!can(s.role, 'device')) return { ok: false, error: permissionError('device') }
    const device = s.devices.find(d => d.id === deviceId)
    if (!device?.patientId) return { ok: false, error: 'Assigned device unavailable.' }
    const patientId = device.patientId
    set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, status: 'Syncing', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Reconnect started' }] } : d), audits: [audit(x, patientId, 'Device reconnect started', device.status, 'Syncing'), ...x.audits] }))
    const reading = deterministicDeviceReading(device)
    const received = get().addObservation(patientId, reading.type, reading.value, reading.unit, `${device.type} demo sync`, reading.secondaryValue, deviceId)
    if (!received) return { ok: false, error: 'Unable to receive a demo observation from the device.' }
    set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, status: 'Connected', lastSync: stamp(), connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Device reconnected and reading received' }] } : d), alerts: x.alerts.map(a => a.patientId === patientId && (a.type === 'Device Offline' || a.type === 'Missing Reading') && !['Resolved', 'Dismissed'].includes(a.status) ? { ...a, status: 'Resolved', resolvedAt: stamp(), resolution: 'Device reconnected and new reading received' } : a), timeline: [event(patientId, 'Device', 'Device reconnected', `${deviceId} connected and a new observation was received`, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Device reconnected', 'Syncing', 'Connected with new reading'), ...x.audits] }))
    return { ok: true }
  },

  assignDevice: (deviceId, patientId) => {
    const s = get()
    if (!can(s.role, 'device') && !can(s.role, 'enrol')) return { ok: false, error: permissionError('device') }
    const device = s.devices.find(d => d.id === deviceId)
    const patient = s.patients.find(p => p.id === patientId)
    if (!device || !patient) return { ok: false, error: 'Device or patient unavailable.' }
    if (patient.monitoringStatus === 'Completed') return { ok: false, error: 'Cannot assign a device to a discharged patient.' }
    if (device.patientId && device.patientId !== patientId) return { ok: false, error: 'This physical demo device is already assigned to another active patient.' }
    set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, patientId, status: 'Connected', lastSync: stamp(), connectionHistory: [...d.connectionHistory, { time: stamp(), event: `Assigned to ${patient.name}` }] } : d), patients: x.patients.map(p => p.id === patientId ? { ...p, deviceIds: [...new Set([...p.deviceIds, deviceId])] } : p), timeline: [event(patientId, 'Device', 'Monitoring device assigned', `${device.type} ${deviceId}`, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Device assigned', device.patientId || 'Available', deviceId), ...x.audits] }))
    return { ok: true }
  },

  replaceDevice: deviceId => {
    const s = get()
    if (!can(s.role, 'device')) return { ok: false, error: permissionError('device') }
    const device = s.devices.find(d => d.id === deviceId)
    if (!device?.patientId) return { ok: false, error: 'Assigned device unavailable.' }
    set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, status: 'Needs Attention', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Replacement requested' }] } : d), tasks: [{ id: id('T'), patientId: device.patientId!, title: `Replace ${device.type} ${device.id}`, due: 'Today', status: 'Due', required: true, category: 'Device' }, ...x.tasks], timeline: [event(device.patientId!, 'Device', 'Device replacement requested', deviceId, actorName(x.role)), ...x.timeline], audits: [audit(x, device.patientId, 'Device replacement requested', device.status, 'Needs Attention'), ...x.audits] }))
    return { ok: true }
  },

  addTask: (patientId, title, due, category) => {
    const s = get()
    if (!can(s.role, 'task')) return { ok: false, error: permissionError('task') }
    set(x => ({ ...x, tasks: [{ id: id('T'), patientId, title, due, status: 'Due', category }, ...x.tasks], timeline: [event(patientId, 'Care Task', 'Care task added', title, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Care task added', 'No task', `${title} · ${due}`), ...x.audits] }))
    return { ok: true }
  },

  sendMessage: (patientId, body, channel) => {
    const s = get()
    if (!can(s.role, 'communication')) return { ok: false, error: permissionError('communication') }
    if (!body.trim()) return { ok: false, error: 'Message text is required.' }
    set(x => ({ ...x, messages: [{ id: id('MSG'), patientId, channel, sender: actorName(x.role), body, time: stamp(), status: 'Sent' }, ...x.messages], patients: x.patients.map(p => p.id === patientId ? { ...p, lastContact: stamp() } : p), timeline: [event(patientId, 'Communication', 'Message sent', `${channel}: ${body}`, actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Patient message sent', 'No new message', `${channel}: ${body}`), ...x.audits] }))
    return { ok: true }
  },

  createConsultation: patientId => {
    const s = get()
    if (!can(s.role, 'consultation')) return { ok: false, error: permissionError('consultation') }
    const patient = s.patients.find(p => p.id === patientId)
    if (!patient || patient.monitoringStatus === 'Completed') return { ok: false, error: 'Active patient unavailable.' }
    set(x => ({ ...x, consultations: [{ id: id('CON'), patientId, status: 'Scheduled', scheduledAt: new Date(Date.now() + 3600000).toISOString(), participants: [actorName(x.role), patient.name], notes: '' }, ...x.consultations], timeline: [event(patientId, 'Virtual Visit', 'Virtual consultation scheduled', 'Remote review scheduled for the care team', actorName(x.role)), ...x.timeline], audits: [audit(x, patientId, 'Virtual consultation scheduled', 'Not scheduled', 'Scheduled'), ...x.audits] }))
    return { ok: true }
  },

  updateConsultationNotes: (consultationId, notes) => {
    const s = get()
    if (!can(s.role, 'consultation')) return { ok: false, error: permissionError('consultation') }
    const consultation = s.consultations.find(c => c.id === consultationId)
    if (!consultation || consultation.status !== 'In progress') return { ok: false, error: 'Consultation must be in progress.' }
    set(x => ({ ...x, consultations: x.consultations.map(c => c.id === consultationId ? { ...c, notes } : c), audits: [audit(x, consultation.patientId, 'Consultation notes updated', consultation.notes || 'No notes', notes), ...x.audits] }))
    return { ok: true }
  },

  startConsultation: consultationId => {
    const s = get()
    if (!can(s.role, 'consultation')) return { ok: false, error: permissionError('consultation') }
    const consultation = s.consultations.find(c => c.id === consultationId)
    if (!consultation || consultation.status !== 'Scheduled') return { ok: false, error: 'Consultation is not available to start.' }
    set(x => ({ ...x, consultations: x.consultations.map(c => c.id === consultationId ? { ...c, status: 'In progress', startedAt: stamp() } : c), timeline: [event(consultation.patientId, 'Virtual Visit', 'Virtual consultation started', 'Simulated remote session started', actorName(x.role)), ...x.timeline], audits: [audit(x, consultation.patientId, 'Virtual consultation started', 'Scheduled', 'In progress'), ...x.audits] }))
    return { ok: true }
  },

  completeConsultation: (consultationId, notes) => {
    const s = get()
    if (!can(s.role, 'consultation')) return { ok: false, error: permissionError('consultation') }
    const consultation = s.consultations.find(c => c.id === consultationId)
    if (!consultation || consultation.status === 'Completed') return { ok: false, error: 'Consultation already completed or unavailable.' }
    if (consultation.status !== 'In progress') return { ok: false, error: 'Start the consultation before completing it.' }
    set(x => ({ ...x, consultations: x.consultations.map(c => c.id === consultationId ? { ...c, status: 'Completed', completedAt: stamp(), notes } : c), timeline: [event(consultation.patientId, 'Virtual Visit', 'Virtual consultation completed', notes, actorName(x.role)), ...x.timeline], audits: [audit(x, consultation.patientId, 'Virtual consultation completed', 'In progress', 'Completed'), ...x.audits] }))
    return { ok: true }
  },

  submitCheckIn: (patientId, symptom, severity, tookMedication, deviceProblem) => {
    const s = get()
    if (s.role !== 'Patient / Caregiver') return { ok: false, error: 'Patient / Caregiver demo mode is required to submit a patient check-in.' }
    const patient = s.patients.find(p => p.id === patientId)
    if (!patient || patient.monitoringStatus === 'Completed') return { ok: false, error: 'Active patient unavailable.' }
    const normalizedSymptom = symptom.trim() && symptom !== 'No new symptoms' ? symptom.trim() : ''
    const medication = s.medications.find(m => m.patientId === patientId)
    const assignedDevice = s.devices.find(d => d.patientId === patientId)
    const symptomAlertNeeded = severity === 'Severe' && !s.alerts.some(a => a.patientId === patientId && a.type === 'Patient-Reported Symptom' && !['Resolved', 'Dismissed'].includes(a.status))
    const medAlertNeeded = !tookMedication && !s.alerts.some(a => a.patientId === patientId && a.type === 'Medication Adherence' && !['Resolved', 'Dismissed'].includes(a.status))
    const deviceAlertNeeded = deviceProblem && !s.alerts.some(a => a.patientId === patientId && a.type === 'Device Offline' && !['Resolved', 'Dismissed'].includes(a.status))
    const alerts: Alert[] = []
    if (symptomAlertNeeded) alerts.push({ id: id('ALT'), patientId, type: 'Patient-Reported Symptom', priority: 'High', trigger: 'Severe patient-reported symptom requires review', evidence: [normalizedSymptom || 'Severe symptom reported'], createdAt: stamp(), assignedTo: patient.nurse, status: 'Needs Review' })
    if (medAlertNeeded) alerts.push({ id: id('ALT'), patientId, type: 'Medication Adherence', priority: 'Attention', trigger: 'Medication confirmation not received during patient check-in', evidence: ['Patient reported scheduled medication not taken/confirmed'], createdAt: stamp(), assignedTo: patient.nurse, status: 'Needs Review' })
    if (deviceAlertNeeded) alerts.push({ id: id('ALT'), patientId, type: 'Device Offline', priority: 'Attention', trigger: 'Patient reported a monitoring-device problem', evidence: [assignedDevice ? `${assignedDevice.type} ${assignedDevice.id}` : 'Assigned device not identified'], createdAt: stamp(), assignedTo: 'Remote Care Team', status: 'Needs Review' })

    set(x => ({
      ...x,
      patients: x.patients.map(p => p.id === patientId ? {
        ...p,
        symptoms: normalizedSymptom ? [...p.symptoms, `${severity} ${normalizedSymptom}`] : p.symptoms,
        risk: severity === 'Severe' ? 'High Risk' : p.risk,
        monitoringStatus: severity === 'Severe' || deviceProblem ? 'Needs Attention' : p.monitoringStatus,
        adherence: !tookMedication ? Math.max(0, p.adherence - 5) : p.adherence,
      } : p),
      medications: medication && !tookMedication ? x.medications.map(m => m.id === medication.id ? { ...m, today: 'Unconfirmed', history: [...m.history, 'Unconfirmed'] } : m) : x.medications,
      devices: assignedDevice && deviceProblem ? x.devices.map(d => d.id === assignedDevice.id ? { ...d, status: 'Needs Attention', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Patient reported device problem' }] } : d) : x.devices,
      alerts: [...alerts, ...x.alerts],
      timeline: [event(patientId, 'Patient Check-in', 'Daily check-in submitted', `${normalizedSymptom ? `${severity} ${normalizedSymptom}` : 'No new symptoms'}; medication ${tookMedication ? 'confirmed' : 'not confirmed'}; device ${deviceProblem ? 'problem reported' : 'working'}`, 'Patient / Caregiver'), ...x.timeline],
      audits: [audit(x, patientId, 'Patient check-in submitted', 'No new check-in', `Symptom: ${normalizedSymptom || 'none'}; medication: ${tookMedication ? 'confirmed' : 'not confirmed'}; device problem: ${deviceProblem ? 'yes' : 'no'}`), ...x.audits],
    }))
    return { ok: true }
  },

  dischargePatient: (patientId, input) => {
    const s = get()
    if (!can(s.role, 'discharge')) return { ok: false, error: 'Consultant Physician permission required to discharge a patient.' }
    const patient = s.patients.find(p => p.id === patientId)
    if (!patient || patient.monitoringStatus === 'Completed') return { ok: false, error: 'Patient is already discharged or unavailable.' }
    const normalized: DischargeInput = typeof input === 'string' ? {
      dischargeDate: stamp().slice(0, 10), outcome: 'Monitoring complete', finalReview: 'Consultant review complete', followUpRequired: 'Usual-care follow-up', deviceReturn: 'Return assigned devices', patientCommunication: 'Your Virtual Ward monitoring episode is complete. Please follow the care-team instructions provided.', overrideReason: input,
    } : input || {
      dischargeDate: stamp().slice(0, 10), outcome: 'Monitoring complete', finalReview: 'Consultant review complete', followUpRequired: 'Usual-care follow-up', deviceReturn: 'Return assigned devices', patientCommunication: 'Your Virtual Ward monitoring episode is complete. Please follow the care-team instructions provided.',
    }
    const blockingAlerts = s.alerts.filter(a => a.patientId === patientId && !['Resolved', 'Dismissed'].includes(a.status) && (a.priority === 'High' || a.priority === 'Urgent Review'))
    const openRequired = s.tasks.filter(t => t.patientId === patientId && t.required && !['Completed', 'Cancelled'].includes(t.status))
    const finalNurse = s.reviews.some(r => r.patientId === patientId && r.type === 'Nurse' && r.status === 'Completed')
    const finalDoctor = s.reviews.some(r => r.patientId === patientId && r.type === 'Doctor' && r.status === 'Completed')
    const blockers = [blockingAlerts.length ? `${blockingAlerts.length} unresolved high-priority alert(s)` : '', openRequired.length ? `${openRequired.length} required task(s)` : '', !finalNurse ? 'final nurse review incomplete' : '', !finalDoctor ? 'final consultant review incomplete' : ''].filter(Boolean)
    const override = normalized.overrideReason?.trim()
    if (blockers.length && !override) return { ok: false, error: `Resolve discharge requirements: ${blockers.join(', ')}; or provide an explicit consultant override reason.` }
    const record: DischargeRecord = { id: id('DIS'), patientId, dischargeDate: normalized.dischargeDate, outcome: normalized.outcome, finalReview: normalized.finalReview, followUpRequired: normalized.followUpRequired, deviceReturn: normalized.deviceReturn, patientCommunication: normalized.patientCommunication, overrideReason: override || undefined, approvedBy: actorName(s.role), approvedAt: stamp() }
    set(x => ({
      ...x,
      dischargeRecords: [record, ...x.dischargeRecords],
      patients: x.patients.map(p => p.id === patientId ? { ...p, monitoringStatus: 'Completed', risk: 'Stable', deviceIds: [] } : p),
      devices: x.devices.map(d => d.patientId === patientId ? { ...d, patientId: undefined, status: 'Not Assigned', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Released after Virtual Ward discharge' }] } : d),
      carePlans: x.carePlans.map(c => c.patientId === patientId ? { ...c, status: 'Completed' } : c),
      messages: [{ id: id('MSG'), patientId, channel: 'App', sender: 'Virtual Ward Team', body: normalized.patientCommunication, time: stamp(), status: 'Sent' }, ...x.messages],
      timeline: [event(patientId, 'Discharge', 'Discharged from Virtual Ward', `${normalized.outcome}. ${override ? `Consultant override: ${override}` : 'Required reviews and tasks complete.'}`, actorName(x.role)), ...x.timeline],
      audits: [audit(x, patientId, 'Patient discharged', 'Active', `Completed · ${normalized.outcome}${override ? ` · override: ${override}` : ''}`), ...x.audits],
    }))
    return { ok: true }
  },

  refreshMissingReadingAlerts: () => {
    const s = get()
    const rows = deriveExpectedReadings(s.patients, s.carePlans, s.observations, s.devices).filter(r => r.status === 'Missing')
    const additions: Alert[] = rows.filter(row => !s.alerts.some(a => a.patientId === row.patientId && a.type === 'Missing Reading' && !['Resolved', 'Dismissed'].includes(a.status) && a.evidence.some(e => e.includes(row.type)))).map(row => ({ id: id('ALT'), patientId: row.patientId, type: 'Missing Reading', priority: 'Attention', trigger: `${row.type} reading overdue`, evidence: [`${row.type} expected at ${new Date(row.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, row.deviceId ? `Device ${row.deviceId}` : 'No matching device'], createdAt: stamp(), assignedTo: s.patients.find(p => p.id === row.patientId)?.nurse || 'Remote Care Team', status: 'Needs Review' }))
    if (additions.length) set(x => ({ ...x, alerts: [...additions, ...x.alerts], audits: additions.reduce((acc, alert) => [audit(x, alert.patientId, 'Missing reading detected', 'Expected', alert.trigger), ...acc], x.audits) }))
  },

  updateIntegration: (integrationId, status) => {
    const s = get()
    if (!can(s.role, 'admin')) return { ok: false, error: 'Administrator permission required.' }
    const integration = s.integrations.find(i => i.id === integrationId)
    if (!integration) return { ok: false, error: 'Integration unavailable.' }
    set(x => ({ ...x, integrations: x.integrations.map(i => i.id === integrationId ? { ...i, status } : i), audits: [audit(x, undefined, 'Integration status changed', `${integration.name}: ${integration.status}`, `${integration.name}: ${status}`), ...x.audits] }))
    return { ok: true }
  },

  simulateIntegrationSync: integrationId => {
    const s = get()
    if (!can(s.role, 'admin')) return { ok: false, error: 'Administrator permission required.' }
    const integration = s.integrations.find(i => i.id === integrationId)
    if (!integration) return { ok: false, error: 'Integration unavailable.' }
    set(x => ({ ...x, integrations: x.integrations.map(i => i.id === integrationId ? { ...i, status: 'Demo Connected', lastSync: stamp() } : i), audits: [audit(x, undefined, 'Integration demo sync completed', integration.status, 'Demo Connected'), ...x.audits] }))
    return { ok: true }
  },

  advanceScenario: () => {
    const s = get()
    if (s.scenario === 'Virtual Discharge') {
      const patientId = 'PT-20425'
      const completedReviews: Review[] = [
        { id: id('REV'), patientId, type: 'Nurse', reason: 'Final Virtual Ward review', notes: 'Monitoring remained stable and episode goals are complete.', disposition: 'Ready for consultant discharge review', status: 'Completed', createdAt: stamp() },
        { id: id('REV'), patientId, type: 'Doctor', reason: 'Final discharge review', notes: 'Synthetic monitoring episode reviewed.', disposition: 'Approved for Virtual Ward discharge', status: 'Completed', createdAt: stamp() },
      ]
      set(x => ({ ...x, tasks: x.tasks.map(t => t.patientId === patientId ? { ...t, status: 'Completed' } : t), alerts: x.alerts.map(a => a.patientId === patientId ? { ...a, status: 'Resolved', resolvedAt: stamp(), resolution: 'Final review completed' } : a), reviews: [...completedReviews, ...x.reviews], scenarioStep: 1, scenarioRunning: false, timeline: [event(patientId, 'Clinical Review', 'Discharge readiness completed', 'Required tasks and final reviews completed', 'Demo scenario'), ...x.timeline], audits: [audit(x, patientId, 'Discharge readiness completed', 'Open episode', 'Ready for consultant discharge'), ...x.audits] }))
      return
    }
    if (s.scenario === 'Device Disconnection') {
      const deviceId = 'OX-40812'
      const device = s.devices.find(d => d.id === deviceId)!
      const patientId = 'PT-20284'
      const additions: Alert[] = ['Device Offline', 'Missing Reading'].filter(type => !s.alerts.some(a => a.patientId === patientId && a.type === type && !['Resolved', 'Dismissed'].includes(a.status))).map(type => ({ id: id('ALT'), patientId, type, priority: 'Attention', trigger: type === 'Device Offline' ? 'Monitoring device offline' : 'Scheduled reading not received', evidence: type === 'Device Offline' ? [`Device ${deviceId} connection lost`] : ['SpO2 expected reading passed demo grace period'], createdAt: stamp(), assignedTo: 'Remote Care Team', status: 'Needs Review' }))
      set(x => ({ ...x, devices: x.devices.map(d => d.id === deviceId ? { ...d, status: 'Offline', connectionHistory: [...d.connectionHistory, { time: stamp(), event: 'Connection lost' }] } : d), alerts: [...additions, ...x.alerts], patients: x.patients.map(p => p.id === patientId ? { ...p, monitoringStatus: 'Needs Attention' } : p), scenarioStep: x.scenarioStep + 1, timeline: [event(patientId, 'Device', 'Device disconnected', `${device.type} ${deviceId} went offline`, 'Demo scenario'), ...x.timeline], audits: [audit(x, patientId, 'Device disconnected by demo scenario', device.status, 'Offline'), ...x.audits] }))
      return
    }
    if (s.scenario === 'Missed Medication') {
      const patientId = 'PT-20301'
      const exists = s.alerts.some(a => a.patientId === patientId && a.type === 'Medication Adherence' && !['Resolved', 'Dismissed'].includes(a.status))
      set(x => ({ ...x, medications: x.medications.map(m => m.patientId === patientId ? { ...m, today: 'Missed', history: [...m.history, 'Missed'] } : m), patients: x.patients.map(p => p.id === patientId ? { ...p, adherence: Math.max(0, p.adherence - 8), monitoringStatus: 'Needs Attention' } : p), alerts: exists ? x.alerts : [{ id: id('ALT'), patientId, type: 'Medication Adherence', priority: 'Attention', trigger: 'Two medication confirmations missed', evidence: ['Scheduled doses unconfirmed'], createdAt: stamp(), assignedTo: 'Aisha Khan', status: 'Needs Review' }, ...x.alerts], scenarioStep: x.scenarioStep + 1, timeline: [event(patientId, 'Medication Adherence', 'Medication confirmation missed', 'Scheduled dose remains unconfirmed', 'Demo scenario'), ...x.timeline], audits: [audit(x, patientId, 'Medication adherence scenario advanced', 'Confirmed', 'Missed'), ...x.audits] }))
      return
    }

    const map: Record<Exclude<Scenario, 'Missed Medication' | 'Device Disconnection' | 'Virtual Discharge'>, { patientId: string; type: VitalType; values: number[]; unit: string; device?: string }> = {
      'COPD Deterioration': { patientId: 'PT-20284', type: 'SpO2', values: [96, 95, 94, 92], unit: '%', device: 'OX-40812' },
      'Heart Failure Weight Change': { patientId: 'PT-20162', type: 'Weight', values: [80], unit: 'kg', device: 'SC-30108' },
      'Stable Monitoring': { patientId: 'PT-20091', type: 'Blood Pressure', values: [137, 136, 138], unit: 'mmHg', device: 'BP-20920' },
      'Post-operative Monitoring': { patientId: 'PT-20412', type: 'Temperature', values: [38.2], unit: '°C', device: 'TH-10992' },
      'Hypertension Trend': { patientId: 'PT-20091', type: 'Blood Pressure', values: [142, 148, 154], unit: 'mmHg', device: 'BP-20920' },
    }
    const cfg = map[s.scenario as keyof typeof map]
    const step = Math.min(s.scenarioStep, cfg.values.length - 1)
    const value = cfg.values[step]
    const patient = s.patients.find(p => p.id === cfg.patientId)!
    const nextTime = new Date(Math.max(Date.now(), ...s.observations.map(o => +new Date(o.timestamp))) + 60000).toISOString()
    const reading: Observation = { id: id('OBS'), patientId: cfg.patientId, type: cfg.type, value, unit: cfg.unit, timestamp: nextTime, source: 'Simulated connected device', deviceId: cfg.device, status: severityForObservation(cfg.type, value) }
    const observations = [...s.observations, reading]
    let symptoms = patient.symptoms
    if (s.scenario === 'COPD Deterioration' && value === 92) symptoms = [...new Set([...symptoms, 'Increased breathlessness'])]
    if (s.scenario === 'Heart Failure Weight Change') symptoms = [...new Set([...symptoms, 'New swelling reported'])]
    const risk = calculateMonitoringRisk({ ...patient, symptoms }, observations.filter(o => o.patientId === cfg.patientId))
    const shouldAlert = risk.risk !== 'Stable' || s.scenario === 'Heart Failure Weight Change' || (s.scenario === 'Hypertension Trend' && value >= 148)
    const exists = s.alerts.some(a => a.patientId === cfg.patientId && a.type === 'Vital Trend' && !['Resolved', 'Dismissed'].includes(a.status))
    const trigger = s.scenario === 'Heart Failure Weight Change' ? 'Abnormal weight trend requiring review' : s.scenario === 'Hypertension Trend' ? 'Persistent elevated BP trend — clinician review recommended' : s.scenario === 'Post-operative Monitoring' ? 'Temperature and symptom trend — clinician review recommended' : 'Declining oxygen saturation trend detected'
    const newAlert: Alert | undefined = shouldAlert && !exists ? { id: id('ALT'), patientId: cfg.patientId, type: 'Vital Trend', priority: risk.risk === 'High Risk' ? 'Urgent Review' : 'High', trigger, evidence: [...risk.reasons, `${cfg.type} ${value}${cfg.unit}`], createdAt: stamp(), assignedTo: patient.nurse, status: 'Needs Review' } : undefined
    set(x => ({ ...x, observations, patients: x.patients.map(p => p.id === cfg.patientId ? { ...p, symptoms, risk: risk.risk, monitoringStatus: risk.risk === 'Stable' ? 'Active' : 'Needs Attention', summary: risk.reasons.join('. ') } : p), alerts: newAlert ? [newAlert, ...x.alerts] : x.alerts, scenarioStep: x.scenarioStep + 1, timeline: [event(cfg.patientId, 'Observation', `${cfg.type} reading received`, `${value}${cfg.unit} from ${cfg.device}`, 'Connected device'), ...x.timeline], audits: risk.risk !== patient.risk ? [audit(x, cfg.patientId, 'AI-assisted risk signal changed', patient.risk, risk.risk), ...x.audits] : x.audits }))
  },
}), { name: 'virtualward-ai-demo-v3' }))
