export type Risk = 'Stable' | 'Needs Review' | 'High Risk'
export type Pathway = 'COPD' | 'Heart Failure' | 'Diabetes' | 'Post-operative' | 'Hypertension'
export type Role = 'Virtual Ward Nurse' | 'Consultant Physician' | 'Remote Care Coordinator' | 'Pharmacist' | 'Operations Manager' | 'Administrator' | 'Patient / Caregiver'
export type VitalType = 'SpO2' | 'Heart Rate' | 'Blood Pressure' | 'Temperature' | 'Weight' | 'Glucose' | 'Pain' | 'Mobility'
export type AlertStatus = 'Needs Review' | 'Acknowledged' | 'Contacted' | 'Escalated' | 'Resolved' | 'Dismissed'
export type AlertPriority = 'Informational' | 'Attention' | 'High' | 'Urgent Review'

export interface Observation {
  id: string
  patientId: string
  type: VitalType
  value: number
  secondaryValue?: number
  unit: string
  timestamp: string
  source: string
  deviceId?: string
  status: 'Normal' | 'Attention' | 'High'
}

export interface Patient {
  id: string
  episodeId: string
  name: string
  age: number
  pathway: Pathway
  condition: string
  startDate: string
  expectedEndDate: string
  day: number
  risk: Risk
  monitoringStatus: 'Active' | 'Needs Attention' | 'Completed'
  nurse: string
  consultant: string
  lastContact: string
  nextReview: string
  adherence: number
  deviceIds: string[]
  symptoms: string[]
  summary: string
  patientContact?: string
  emergencyContact?: string
  monitoringPlanName?: string
}

export interface Alert {
  id: string
  patientId: string
  type: string
  priority: AlertPriority
  trigger: string
  evidence: string[]
  createdAt: string
  assignedTo: string
  status: AlertStatus
  acknowledgedAt?: string
  resolvedAt?: string
  resolution?: string
}

export interface Device {
  id: string
  type: string
  patientId?: string
  status: 'Connected' | 'Syncing' | 'Offline' | 'Low Battery' | 'Not Assigned' | 'Needs Attention'
  battery: number
  lastSync: string
  serialDemoId: string
  connectionHistory: { time: string; event: string }[]
}

export interface Task {
  id: string
  patientId: string
  title: string
  due: string
  status: 'Upcoming' | 'Due' | 'Completed' | 'Missed' | 'Overdue' | 'Cancelled'
  required?: boolean
  category: string
}

export interface Medication {
  id: string
  patientId: string
  name: string
  schedule: string
  today: 'Taken' | 'Missed' | 'Late' | 'Unconfirmed'
  history: ('Taken' | 'Missed' | 'Late' | 'Unconfirmed')[]
}

export interface TimelineEvent {
  id: string
  patientId: string
  time: string
  type: string
  title: string
  detail: string
  actor: string
}

export interface Review {
  id: string
  patientId: string
  type: 'Nurse' | 'Doctor'
  reason: string
  notes: string
  disposition: string
  status: 'Open' | 'Completed'
  createdAt: string
}

export interface Consultation {
  id: string
  patientId: string
  status: 'Scheduled' | 'In progress' | 'Completed'
  scheduledAt: string
  participants: string[]
  notes: string
  startedAt?: string
  completedAt?: string
}

export interface Message {
  id: string
  patientId: string
  channel: 'App' | 'SMS Demo' | 'Email Demo'
  sender: string
  body: string
  time: string
  status: 'Sent' | 'Read'
  response?: string
}

export interface AuditEvent {
  id: string
  time: string
  user: string
  role: Role
  patientId?: string
  action: string
  previousState: string
  newState: string
}

export interface CarePlan {
  patientId: string
  pathway: Pathway
  goals: string[]
  observations: { type: VitalType; frequency: string }[]
  notes: string
  nextReview: string
  status: 'Active' | 'Completed'
  medicationTasks?: string[]
  checkIns?: string[]
  reviews?: string[]
  educationTasks?: string[]
  escalationInstructions?: string
  assignedTeam?: { nurse: string; consultant: string }
  startDate?: string
  expectedEndDate?: string
  planName?: string
}

export interface DischargeRecord {
  id: string
  patientId: string
  dischargeDate: string
  outcome: string
  finalReview: string
  followUpRequired: string
  deviceReturn: string
  patientCommunication: string
  overrideReason?: string
  approvedBy: string
  approvedAt: string
}


export interface ThresholdConfig {
  id: string
  pathway: Pathway
  type: VitalType
  attentionRule: string
  highRule: string
  note: string
}

export interface CareTeamMember {
  id: string
  name: string
  role: Role
  specialty: string
  status: 'Available' | 'On duty' | 'Demo only'
}

export interface Integration {
  id: string
  name: string
  type: string
  status: 'Demo Connected' | 'Simulation' | 'Offline' | 'Attention Required'
  protocol: string
  lastSync: string
  domains: string[]
}

export interface DocumentRecord {
  id: string
  patientId: string
  title: string
  type: string
  author: string
  createdAt: string
  source: string
  summary: string
}

export type SourceType = 'Observation' | 'Medication' | 'Clinical Review' | 'Device Event' | 'Care Plan' | 'Patient Check-in' | 'Timeline'
export interface SourceCitation {
  id: string
  sourceType: SourceType
  sourceId: string
  label: string
  timestamp?: string
}
export interface SummaryStatement {
  id: string
  text: string
  sources: SourceCitation[]
}

export interface EnrolPatientInput {
  name: string
  age: number
  pathway: Pathway
  condition: string
  startDate: string
  duration: number
  nurse: string
  consultant: string
  contact: string
  emergencyContact: string
  monitoringPlan: string
  deviceId?: string
}

export interface DischargeInput {
  dischargeDate: string
  outcome: string
  finalReview: string
  followUpRequired: string
  deviceReturn: string
  patientCommunication: string
  overrideReason?: string
}
