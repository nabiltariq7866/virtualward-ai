import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MonitorSmartphone,
  Phone,
  Radio,
  ShieldAlert,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Wifi,
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { can, useVirtualWardStore } from '../stores/useVirtualWardStore'
import {
  calculateReadmissionSignal,
  explainRiskSignal,
  generatePatientSummaryWithSources,
} from '../services/ai'
import { filterObservationsByRange, type TimeRange } from '../utils/monitoring'
import type {
  CarePlan,
  Medication,
  Observation,
  SourceCitation,
  VitalType,
} from '../types/domain'
import {
  Badge,
  Card,
  CustomSelect,
  Empty,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  PageHeader,
  Segmented,
  riskText,
} from '../components/UI'

const tabs = ['Overview', 'Live Monitoring', 'Trends', 'Care Plan', 'Medications', 'Alerts', 'Reviews', 'Virtual Visits', 'Timeline', 'Documents']
const ranges: TimeRange[] = ['6h', '24h', '3d', '7d', '14d']

export default function PatientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useVirtualWardStore()
  const p = s.patients.find(patient => patient.id === id)
  const [tab, setTab] = useState('Overview')
  const [range, setRange] = useState<TimeRange>('24h')
  const [action, setAction] = useState<string>()
  const [selectedSource, setSelectedSource] = useState<SourceCitation>()
  const [trendLoading, setTrendLoading] = useState(false)
  const prevTab = useRef('Overview')

  useEffect(() => {
    if (prevTab.current === 'Overview' && tab === 'Trends') {
      setTrendLoading(true)
      const timer = setTimeout(() => setTrendLoading(false), 350)
      prevTab.current = tab
      return () => clearTimeout(timer)
    }
    prevTab.current = tab
  }, [tab])

  if (!p) return <ErrorState kind="missing-patient" onRetry={() => nav('/patients')} retryLabel="Return to active patients" />

  const obs = s.observations.filter(o => o.patientId === p.id)
  const alerts = s.alerts.filter(a => a.patientId === p.id)
  const devices = s.devices.filter(d => d.patientId === p.id)
  const tasks = s.tasks.filter(t => t.patientId === p.id)
  const meds = s.medications.filter(m => m.patientId === p.id)
  const plan = s.carePlans.find(c => c.patientId === p.id)
  const patientReviews = s.reviews.filter(r => r.patientId === p.id)
  const patientTimeline = s.timeline.filter(e => e.patientId === p.id)
  const documents = s.documents.filter(d => d.patientId === p.id)
  const risk = explainRiskSignal(p, obs)
  const readmission = calculateReadmissionSignal(p, alerts.filter(a => !['Resolved', 'Dismissed'].includes(a.status)).length)
  const latestTypes = [...new Set(obs.map(o => o.type))]
  const summaryStatements = generatePatientSummaryWithSources(p, obs, meds, patientReviews, patientTimeline, plan)
  const riskHistory = [
    { time: p.startDate, label: 'Stable', detail: 'Baseline monitoring started' },
    ...s.audits
      .filter(a => a.patientId === p.id && a.action.toLowerCase().includes('risk'))
      .map(a => ({ time: a.time, label: a.newState.includes('High') ? 'High Risk' : 'Needs Review', detail: a.newState })),
  ]
  const nurseReview = patientReviews.find(r => r.type === 'Nurse')
  const doctorReview = patientReviews.find(r => r.type === 'Doctor')

  return (
    <>
      <button className="back" onClick={() => nav('/patients')}><ArrowLeft /> Active patients</button>
      <PageHeader
        eyebrow={`${p.episodeId} · ${p.id}`}
        title={p.name}
        description={`${p.age} years · ${p.pathway} Virtual Ward · Day ${p.day}`}
        actions={
          <>
            <Badge>{p.risk}</Badge>
            <button
              className="btn"
              disabled={!can(s.role, 'communication')}
              title={!can(s.role, 'communication') ? 'Current role cannot contact patients.' : ''}
              onClick={() => setAction('message')}
            ><Phone /> Contact patient</button>
            <button
              className="btn primary"
              disabled={!can(s.role, 'review')}
              title={!can(s.role, 'review') ? 'Nurse, doctor or pharmacist permission required' : ''}
              onClick={() => setAction('review')}
            ><Stethoscope /> Start review</button>
            <button
              className="btn"
              disabled={!can(s.role, 'discharge') || p.monitoringStatus === 'Completed'}
              title={!can(s.role, 'discharge') ? 'Consultant Physician permission required' : 'Open discharge workflow'}
              onClick={() => nav(`/discharge/${p.id}`)}
            >Discharge</button>
          </>
        }
      />

      <div className="patient-meta">
        <span><b>Assigned nurse</b>{p.nurse}</span>
        <span><b>Consultant</b>{p.consultant}</span>
        <span><b>Next review</b>{p.nextReview}</span>
        <span><b>Monitoring status</b><i className="live-dot" /> {p.monitoringStatus}</span>
        <span><b>Patient contact</b>{p.patientContact || 'Not recorded'}</span>
      </div>

      <div className="tabs" role="tablist" aria-label="Patient workspace sections">
        {tabs.map(item => (
          <button role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="patient-grid">
          <Card className="status-overview">
            <div className="status-title">
              <span className={`risk-orb ${p.risk === 'High Risk' ? 'high' : p.risk === 'Needs Review' ? 'review' : ''}`}><HeartPulse /></span>
              <div><small>CURRENT MONITORING STATUS</small><h2>{p.risk}</h2><p>{riskText(p.risk)}</p></div>
            </div>
            <div className="status-facts">
              <span><b>Monitoring day</b>Day {p.day}</span>
              <span><b>Last contact</b>{p.lastContact.startsWith('20') ? new Date(p.lastContact).toLocaleString() : p.lastContact}</span>
              <span><b>Open alerts</b>{alerts.filter(a => !['Resolved', 'Dismissed'].includes(a.status)).length}</span>
            </div>
          </Card>

          <Card className="ai-risk">
            <div className="ai-head"><span><BrainCircuit /></span><div><small>AI-ASSISTED RISK PRIORITIZATION</small><h2>{risk.label}</h2></div></div>
            <h3>Why flagged?</h3>
            <ul>{risk.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
            <p><b>Trend window:</b> {risk.window}</p>
            <p><b>Symptoms:</b> {p.symptoms.length ? p.symptoms.join(', ') : 'No current patient-reported symptom in the synthetic record.'}</p>
            <p><b>Missing data:</b> {alerts.filter(a => a.type === 'Missing Reading' && !['Resolved', 'Dismissed'].includes(a.status)).length} unresolved missing-reading signal(s).</p>
            <button className="text-btn" onClick={() => setAction('evidence')}>View supporting evidence <ArrowRight /></button>
            <small className="disclaimer">{risk.disclaimer}</small>
          </Card>

          <Card title="Latest observations" className="vitals-section" action={<button className="text-btn" onClick={() => setTab('Live Monitoring')}>Open live monitoring <ArrowRight /></button>}>
            <div className="vital-grid">
              {latestTypes.slice(0, 6).map(type => {
                const readings = obs.filter(o => o.type === type).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
                const current = readings[0]
                const previous = readings[1]
                const trend = previous ? (current.value > previous.value ? 'Rising' : current.value < previous.value ? 'Falling' : 'Stable') : 'Stable'
                return (
                  <div className="vital-card" key={type}>
                    <div><span>{type}</span><Badge>{current.status}</Badge></div>
                    <strong>{current.value}{current.secondaryValue ? `/${current.secondaryValue}` : ''}<small>{current.unit}</small></strong>
                    <p className={trend === 'Rising' ? 'up' : trend === 'Falling' ? 'down' : ''}>
                      {trend === 'Rising' ? <TrendingUp /> : trend === 'Falling' ? <TrendingDown /> : <Activity />}{trend} · {new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <small>{current.source}</small>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title="Care coordination">
            <div className="care-summary">
              <div><Calendar /><span><b>Next review</b>{p.nextReview}</span></div>
              <div><ClipboardCheck /><span><b>Open tasks</b>{tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length} remaining</span></div>
              <div><ShieldAlert /><span><b>Medication adherence</b>{p.adherence}% confirmed</span></div>
              <div><Wifi /><span><b>Devices</b>{devices.filter(d => d.status === 'Connected').length}/{devices.length} connected</span></div>
            </div>
          </Card>

          <Card className="summary-card">
            <div className="ai-head"><span><BrainCircuit /></span><div><small>AI PATIENT SUMMARY</small><h2>Remote care summary</h2></div></div>
            <div className="summary-statements">
              {summaryStatements.map(statement => (
                <div key={statement.id} className="summary-statement">
                  <p>{statement.text}</p>
                  {statement.sources.length > 0 && (
                    <div className="source-row">
                      <b>Evidence</b>
                      {statement.sources.map(source => (
                        <button type="button" key={source.id} onClick={() => setSelectedSource(source)}>{source.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <small className="disclaimer">AI-generated summary of current synthetic state. Every factual statement above is source-grounded; clinician review required.</small>
          </Card>

          <Card title="Readmission risk signal">
            <div className="readmission">
              <Badge tone={readmission.level === 'High' ? 'danger' : readmission.level === 'Moderate' ? 'warning' : 'success'}>{readmission.level}</Badge>
              <ul>{readmission.factors.map(factor => <li key={factor}>{factor}</li>)}</ul>
              <small>{readmission.disclaimer}</small>
            </div>
          </Card>

          <Card title="Risk history" className="vitals-section">
            <div className="risk-history">
              {riskHistory.map((item, index) => (
                <div key={`${item.time}-${index}`} className={item.label === 'High Risk' ? 'high' : item.label === 'Needs Review' ? 'review' : ''}>
                  <time>{new Date(item.time).toLocaleString()}</time><b>{item.label}</b><small>{item.detail}</small>
                </div>
              ))}
            </div>
            <small className="disclaimer">Each change preserves the contributing event and clinician review state.</small>
          </Card>

          <Card title="Human review status" className="vitals-section">
            <div className="human-review-grid">
              <div><small>AI MONITORING SIGNAL</small><Badge>{p.risk}</Badge><p>{risk.reasons[0]}</p></div>
              <div><small>NURSE REVIEW</small><Badge>{nurseReview?.status || 'Awaiting review'}</Badge><p>{nurseReview?.disposition || 'Clinician review not yet recorded.'}</p></div>
              <div><small>DOCTOR DECISION</small><Badge>{doctorReview?.status || 'Not required'}</Badge><p>{doctorReview?.disposition || 'No consultant decision recorded.'}</p></div>
            </div>
            <small className="disclaimer">AI helps prioritize. Clinicians remain responsible for every care decision.</small>
          </Card>
        </div>
      )}

      {tab === 'Live Monitoring' && <MonitoringTab patientId={p.id} obs={obs} range={range} setRange={setRange} />}
      {tab === 'Trends' && (trendLoading ? <Card><LoadingState kind="trend" /></Card> : <MonitoringTab patientId={p.id} obs={obs} range={range} setRange={setRange} />)}
      {tab === 'Care Plan' && <CarePlanTab patientId={p.id} plan={plan} />}
      {tab === 'Medications' && <MedicationTab meds={meds} />}
      {tab === 'Alerts' && <AlertTab alerts={alerts} open={alertId => nav(`/alerts?open=${alertId}`)} />}
      {tab === 'Reviews' && <ReviewsTab patientId={p.id} />}
      {tab === 'Virtual Visits' && <VisitsTab patientId={p.id} />}
      {tab === 'Timeline' && <TimelineTab patientId={p.id} />}
      {tab === 'Documents' && <DocumentsTab documents={documents} />}

      {action === 'message' && <MessageModal patientId={p.id} close={() => setAction(undefined)} />}
      {action === 'review' && <ReviewModal patientId={p.id} close={() => setAction(undefined)} />}
      {action === 'evidence' && <EvidenceModal obs={obs.filter(o => risk.sources.some(source => source.id === o.id))} close={() => setAction(undefined)} />}
      {selectedSource && <SourceEvidenceModal source={selectedSource} close={() => setSelectedSource(undefined)} />}
    </>
  )
}

function MonitoringTab({ patientId, obs, range, setRange }: { patientId: string; obs: Observation[]; range: TimeRange; setRange: (value: TimeRange) => void }) {
  const s = useVirtualWardStore()
  const [type, setType] = useState<VitalType>(obs[0]?.type || 'SpO2')
  const filtered = useMemo(() => filterObservationsByRange(obs, range), [obs, range])
  const availableTypes = [...new Set(obs.map(o => o.type))]
  const typeReadings = filtered.filter(o => o.type === type).sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  const data = typeReadings.map(o => ({
    time: new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: o.value,
  }))
  const latestForType = [...obs].filter(o => o.type === type).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))[0]
  const matchingDevice = s.devices.find(device => device.patientId === patientId && deviceTypeSupports(device.type, type))

  if (obs.length === 0) return <Card><ErrorState kind="no-readings" /></Card>

  const syncReading = () => {
    const ok = s.addObservation(
      patientId,
      type,
      latestForType?.value ?? 97,
      latestForType?.unit || unitFor(type),
      matchingDevice ? `${matchingDevice.type} demo sync` : 'Synthetic device sync',
      latestForType?.secondaryValue,
      matchingDevice?.id,
    )
    ok ? toast.success('Reading received') : toast.error('Unable to simulate reading in the current state.')
  }

  return (
    <div className="monitor-grid">
      <Card className="monitor-toolbar">
        <div><b>Live observation stream</b><small><Radio /> Receiving synthetic device data</small></div>
        <Segmented items={ranges} value={range} onChange={value => setRange(value as TimeRange)} />
        <button className="btn primary" onClick={syncReading}><Radio /> Sync device reading</button>
      </Card>
      <Card className="trend-card">
        <div className="trend-head">
          <div><small>OBSERVATION TREND · {range}</small><h2>{type}</h2></div>
          <CustomSelect ariaLabel="Observation type" value={type} onChange={value => setType(value as VitalType)} options={availableTypes.map(value=>({value,label:value}))}/>
        </div>
        {data.length ? (
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={data}>
              <XAxis dataKey="time" axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#43B99F" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <Empty title={`No ${type} readings in ${range}`} detail="Choose a longer time range or sync a new synthetic reading." icon="reading" />}
        <small className="disclaimer">Synthetic observations for product demonstration. Thresholds are not validated clinical protocols.</small>
      </Card>
      <Card title={`Recent readings · ${range}`}>
        {filtered.length ? (
          <div className="reading-list">
            {[...filtered].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 8).map(o => (
              <div key={o.id}>
                <span className="reading-icon"><Activity /></span>
                <span><b>{o.type}</b><small>{o.source} · {o.deviceId || 'Manual entry'}</small></span>
                <strong>{o.value}{o.secondaryValue ? `/${o.secondaryValue}` : ''} <small>{o.unit}</small></strong>
                <Badge>{o.status}</Badge>
                <time>{new Date(o.timestamp).toLocaleString()}</time>
              </div>
            ))}
          </div>
        ) : <Empty title="No readings in selected range" icon="reading" />}
      </Card>
    </div>
  )
}

function CarePlanTab({ patientId, plan }: { patientId: string; plan?: CarePlan }) {
  const s = useVirtualWardStore()
  const [edit, setEdit] = useState(false)
  const [notes, setNotes] = useState(plan?.notes || '')
  const [review, setReview] = useState(plan?.nextReview || '')
  const [schedule, setSchedule] = useState<CarePlan['observations']>(plan?.observations || [])
  const [newType, setNewType] = useState<VitalType>('Heart Rate')

  useEffect(() => {
    setNotes(plan?.notes || '')
    setReview(plan?.nextReview || '')
    setSchedule(plan?.observations || [])
  }, [plan])

  if (!plan) return <Card><ErrorState kind="no-plan" title="Assign monitoring plan first" /></Card>

  const patientTasks = s.tasks.filter(t => t.patientId === patientId)
  const patientMeds = s.medications.filter(m => m.patientId === patientId)
  const available = (['SpO2', 'Heart Rate', 'Blood Pressure', 'Temperature', 'Weight', 'Glucose', 'Pain', 'Mobility'] as VitalType[])
    .filter(type => !schedule.some(item => item.type === type))

  const save = () => {
    const careResult = s.updateCarePlan(patientId, notes, review)
    if (!careResult.ok) return toast.error(careResult.error)
    const scheduleResult = s.updateObservationSchedule(patientId, schedule)
    if (!scheduleResult.ok) return toast.error(scheduleResult.error)
    toast.success('Monitoring plan updated')
    setEdit(false)
  }

  return (
    <div className="two-col care-plan-workspace">
      <Card title={`${plan.pathway} monitoring plan`} action={<button className="btn" disabled={!can(s.role, 'plan')} title={!can(s.role, 'plan') ? 'Consultant Physician permission required' : ''} onClick={() => setEdit(true)}>Edit plan</button>}>
        <h3>Monitoring goals</h3>
        <ul className="check-list">{plan.goals.map(goal => <li key={goal}><CheckCircle2 />{goal}</li>)}</ul>
        <h3>Observation schedule</h3>
        <div className="schedule-list">{plan.observations.map(item => <div key={item.type}><Activity /><span><b>{item.type}</b><small>{item.frequency}</small></span></div>)}</div>
        <h3>Medication tasks</h3>
        {patientMeds.length ? patientMeds.map(med => <p key={med.id}>{med.name} · {med.schedule}</p>) : <small>No pathway medication tasks assigned.</small>}
        <h3>Patient check-ins & education</h3>
        {patientTasks.filter(task => ['Check-in', 'Education'].includes(task.category)).map(task => <p key={task.id}>{task.title} · {task.due} · {task.status}</p>)}
      </Card>
      <Card title="Clinical reviews and escalation">
        <p>{plan.notes}</p><hr />
        <b>Next clinical review</b><p>{plan.nextReview}</p><hr />
        <b>Assigned team</b><p>{plan.assignedTeam?.nurse || 'Nurse not assigned'} · {plan.assignedTeam?.consultant || 'Consultant not assigned'}</p><hr />
        <b>Escalation instructions</b><p>{plan.escalationInstructions || 'Review monitoring evidence, contact the patient and escalate when clinical review is required.'}</p>
        <small className="disclaimer">Demo care plan only. No autonomous clinical decision.</small>
      </Card>

      {edit && (
        <Modal title="Update monitoring plan" wide onClose={() => setEdit(false)}>
          <Field label="Care notes"><textarea value={notes} onChange={event => setNotes(event.target.value)} /></Field>
          <Field label="Next review"><input value={review} onChange={event => setReview(event.target.value)} /></Field>
          <h3>Observation schedule</h3>
          {schedule.map((item, index) => (
            <div className="schedule-editor" key={item.type}>
              <b>{item.type}</b>
              <input aria-label={`${item.type} frequency`} value={item.frequency} onChange={event => setSchedule(current => current.map((value, i) => i === index ? { ...value, frequency: event.target.value } : value))} />
              <button className="btn" disabled={schedule.length === 1} onClick={() => setSchedule(current => current.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
          <div className="schedule-editor">
            <CustomSelect ariaLabel="Observation to add" value={newType} onChange={value => setNewType(value as VitalType)} disabled={!available.length} options={available.map(value=>({value,label:value}))}/>
            <button className="btn" disabled={!available.length || schedule.some(item => item.type === newType)} onClick={() => setSchedule(current => [...current, { type: newType, frequency: 'Daily' }])}>Add observation</button>
            <button className="btn" disabled={!can(s.role, 'task')} onClick={() => {
              const result = s.addTask(patientId, 'Patient education follow-up', 'Tomorrow', 'Education')
              result.ok ? toast.success('Education task created') : toast.error(result.error)
            }}>Add education task</button>
          </div>
          <div className="modal-actions"><button className="btn" onClick={() => setEdit(false)}>Cancel</button><button className="btn primary" onClick={save}>Save plan</button></div>
        </Modal>
      )}
    </div>
  )
}

function MedicationTab({ meds }: { meds: Medication[] }) {
  const s = useVirtualWardStore()
  const statuses: Medication['today'][] = ['Taken', 'Missed', 'Late', 'Unconfirmed']
  return (
    <Card title="Medication adherence">
      <div className="adherence-metrics">{statuses.map(status => <div key={status}><span>{status}</span><b>{meds.filter(m => m.today === status).length}</b></div>)}</div>
      {meds.length ? (
        <div className="med-list">
          {meds.map(med => (
            <div key={med.id}>
              <span><b>{med.name}</b><small>{med.schedule} · Patient reported</small></span>
              <Badge>{med.today}</Badge>
              <CustomSelect ariaLabel={`Adherence status for ${med.name}`} disabled={!can(s.role, 'medication')} value={med.today} onChange={value => { const result = s.recordMedication(med.id, value as Medication['today']); result.ok ? toast.success('Medication adherence updated') : toast.error(result.error) }} options={statuses.map(value=>({value,label:value}))}/>
            </div>
          ))}
        </div>
      ) : <Empty title="No medication schedule" icon="medication" />}
      <div className="ai-inline"><BrainCircuit /><span><b>Adherence insight</b>{meds.some(m => ['Missed', 'Late', 'Unconfirmed'].includes(m.today)) ? 'Unconfirmed, missed or late doses require a patient adherence review.' : 'No current adherence concern.'}<small>Suggested review only. Do not change medication automatically.</small></span></div>
    </Card>
  )
}

function AlertTab({ alerts, open }: { alerts: ReturnType<typeof useVirtualWardStore.getState>['alerts']; open: (id: string) => void }) {
  return (
    <Card title="Patient alerts">
      {alerts.length ? (
        <div className="alert-list">{alerts.map(alert => (
          <button key={alert.id} onClick={() => open(alert.id)}>
            <ShieldAlert /><span><b>{alert.trigger}</b><small>{alert.type} · {new Date(alert.createdAt).toLocaleString()}</small></span><Badge>{alert.priority}</Badge><Badge>{alert.status}</Badge><ArrowRight />
          </button>
        ))}</div>
      ) : <Empty title="No clinical alerts" icon="alert" />}
    </Card>
  )
}

function ReviewsTab({ patientId }: { patientId: string }) {
  const reviews = useVirtualWardStore(state => state.reviews).filter(review => review.patientId === patientId)
  return (
    <Card title="Clinical reviews">
      {reviews.length ? <div className="review-list">{reviews.map(review => (
        <div key={review.id}><span className="review-icon"><Stethoscope /></span><span><b>{review.type} review · {review.reason}</b><small>{review.notes}</small><small>{review.disposition}</small></span><Badge>{review.status}</Badge></div>
      ))}</div> : <Empty title="No reviews recorded" />}
    </Card>
  )
}

function VisitsTab({ patientId }: { patientId: string }) {
  const s = useVirtualWardStore()
  const visits = s.consultations.filter(c => c.patientId === patientId)
  const handle = (result: { ok: boolean; error?: string }, success: string) => result.ok ? toast.success(success) : toast.error(result.error)
  return (
    <Card title="Virtual consultations" action={<button className="btn primary" disabled={!can(s.role, 'consultation')} onClick={() => handle(s.createConsultation(patientId), 'Consultation scheduled')}>Schedule consultation</button>}>
      {visits.length ? (
        <div className="visit-list">{visits.map(consultation => (
          <div key={consultation.id}>
            <MonitorSmartphone />
            <span><b>{new Date(consultation.scheduledAt).toLocaleString()}</b><small>{consultation.participants.join(' · ')}</small>{consultation.notes && <small>{consultation.notes}</small>}</span>
            <Badge>{consultation.status}</Badge>
            {consultation.status === 'Scheduled' && <button className="btn" disabled={!can(s.role, 'consultation')} onClick={() => handle(s.startConsultation(consultation.id), 'Virtual consultation started')}>Start session</button>}
            {consultation.status === 'In progress' && <button className="btn primary" disabled={!can(s.role, 'consultation')} onClick={() => handle(s.completeConsultation(consultation.id, 'Patient reviewed remotely. Continue monitoring.'), 'Virtual consultation completed')}>Complete session</button>}
          </div>
        ))}</div>
      ) : <Empty title="No virtual visits" />}
    </Card>
  )
}

function TimelineTab({ patientId }: { patientId: string }) {
  const events = useVirtualWardStore(state => state.timeline).filter(e => e.patientId === patientId).sort((a, b) => +new Date(b.time) - +new Date(a.time))
  return (
    <Card title="Virtual Ward timeline">
      {events.length ? <div className="timeline">{events.map(event => (
        <div key={event.id}><span className="timeline-dot" /><time>{new Date(event.time).toLocaleString()}</time><section><Badge tone="info">{event.type}</Badge><h3>{event.title}</h3><p>{event.detail}</p><small>{event.actor}</small></section></div>
      ))}</div> : <Empty title="No timeline events" />}
    </Card>
  )
}

function DocumentsTab({ documents }: { documents: ReturnType<typeof useVirtualWardStore.getState>['documents'] }) {
  return (
    <Card title="Documents">
      {documents.length ? (
        <div className="document-list">{documents.map(document => (
          <div key={document.id} className="document-row">
            <FileText />
            <span><b>{document.title}</b><small>{document.type} · {document.author} · {new Date(document.createdAt).toLocaleString()}</small><p>{document.summary}</p></span>
            <Badge>{document.source}</Badge>
          </div>
        ))}</div>
      ) : <Empty title="No documents for this patient" detail="No synthetic document record is attached to this Virtual Ward episode." />}
    </Card>
  )
}

function MessageModal({ patientId, close }: { patientId: string; close: () => void }) {
  const s = useVirtualWardStore()
  const [body, setBody] = useState('We are reviewing your recent monitoring information. Please complete your scheduled check-in.')
  const [channel, setChannel] = useState<'App' | 'SMS Demo' | 'Email Demo'>('App')
  const submit = () => {
    const result = s.sendMessage(patientId, body, channel)
    if (!result.ok) return toast.error(result.error)
    toast.success('Patient contacted')
    close()
  }
  return (
    <Modal title="Contact patient" onClose={close}>
      <Field label="Channel"><CustomSelect ariaLabel="Message channel" value={channel} onChange={value => setChannel(value as typeof channel)} options={['App','SMS Demo','Email Demo'].map(value=>({value,label:value}))}/></Field>
      <Field label="Message"><textarea value={body} onChange={event => setBody(event.target.value)} /></Field>
      <small className="disclaimer">Demo only. No real message will be sent.</small>
      <div className="modal-actions"><button className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={!body.trim() || !can(s.role, 'communication')} onClick={submit}>Send demo message</button></div>
    </Modal>
  )
}

function ReviewModal({ patientId, close }: { patientId: string; close: () => void }) {
  const s = useVirtualWardStore()
  const [reason, setReason] = useState('Monitoring signal review')
  const [notes, setNotes] = useState('')
  const [disposition, setDisposition] = useState('Continue Monitoring')
  const submit = () => {
    const result = s.createReview(patientId, reason, notes, disposition)
    if (!result.ok) return toast.error(result.error)
    toast.success('Nurse review completed')
    close()
  }
  return (
    <Modal title="Complete nurse review" wide onClose={close}>
      <div className="form-grid">
        <Field label="Reason"><input value={reason} onChange={event => setReason(event.target.value)} /></Field>
        <Field label="Disposition"><CustomSelect ariaLabel="Nurse review disposition" value={disposition} onChange={setDisposition} options={['Continue Monitoring','Increase Monitoring','Schedule Virtual Review','Escalate to Doctor','Contact Caregiver','Other'].map(value=>({value,label:value}))}/></Field>
      </div>
      <Field label="Review notes"><textarea required value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record symptoms, observations and clinical review notes..." /></Field>
      <small className="disclaimer">AI signals do not diagnose. Record the clinician-led disposition.</small>
      <div className="modal-actions"><button className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={!notes.trim() || s.role !== 'Virtual Ward Nurse'} title={s.role !== 'Virtual Ward Nurse' ? 'Virtual Ward Nurse role required' : ''} onClick={submit}>Complete review</button></div>
    </Modal>
  )
}

function EvidenceModal({ obs, close }: { obs: Observation[]; close: () => void }) {
  return (
    <Modal title="Supporting evidence" wide onClose={close}>
      <div className="evidence-banner"><BrainCircuit /><span><b>AI monitoring signal</b>Evidence is traceable to exact synthetic observations below.<small>Clinical review required.</small></span></div>
      {obs.length === 0 ? <ErrorState kind="no-readings" /> : (
        <div className="table-wrap"><table><thead><tr><th>Observation</th><th>Value</th><th>Time</th><th>Source</th><th>Status</th></tr></thead><tbody>
          {[...obs].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).map(o => <tr key={o.id}><td>{o.type}</td><td><b>{o.value}{o.secondaryValue ? `/${o.secondaryValue}` : ''}{o.unit}</b></td><td>{new Date(o.timestamp).toLocaleString()}</td><td>{o.source}</td><td><Badge>{o.status}</Badge></td></tr>)}
        </tbody></table></div>
      )}
    </Modal>
  )
}

function SourceEvidenceModal({ source, close }: { source: SourceCitation; close: () => void }) {
  const s = useVirtualWardStore()
  const observation = s.observations.find(item => item.id === source.sourceId)
  const medication = s.medications.find(item => item.id === source.sourceId)
  const review = s.reviews.find(item => item.id === source.sourceId)
  const timeline = s.timeline.find(item => item.id === source.sourceId)
  const plan = source.sourceType === 'Care Plan' ? s.carePlans.find(item => item.patientId === source.sourceId) : undefined

  let content: React.ReactNode = <ErrorState title="Supporting record unavailable" detail="No supporting record was found in the current synthetic data." />
  if (observation) content = <dl className="source-detail"><dt>Type</dt><dd>{observation.type}</dd><dt>Value</dt><dd>{observation.value}{observation.secondaryValue ? `/${observation.secondaryValue}` : ''}{observation.unit}</dd><dt>Timestamp</dt><dd>{new Date(observation.timestamp).toLocaleString()}</dd><dt>Source</dt><dd>{observation.source}</dd><dt>Device</dt><dd>{observation.deviceId || 'Manual/demo source'}</dd><dt>Status</dt><dd>{observation.status}</dd></dl>
  else if (medication) content = <dl className="source-detail"><dt>Medication</dt><dd>{medication.name}</dd><dt>Schedule</dt><dd>{medication.schedule}</dd><dt>Current adherence</dt><dd>{medication.today}</dd><dt>History</dt><dd>{medication.history.join(' → ')}</dd></dl>
  else if (review) content = <dl className="source-detail"><dt>Review</dt><dd>{review.type}</dd><dt>Reason</dt><dd>{review.reason}</dd><dt>Status</dt><dd>{review.status}</dd><dt>Disposition</dt><dd>{review.disposition}</dd><dt>Notes</dt><dd>{review.notes}</dd><dt>Created</dt><dd>{new Date(review.createdAt).toLocaleString()}</dd></dl>
  else if (timeline) content = <dl className="source-detail"><dt>Event</dt><dd>{timeline.title}</dd><dt>Type</dt><dd>{timeline.type}</dd><dt>Detail</dt><dd>{timeline.detail}</dd><dt>Actor</dt><dd>{timeline.actor}</dd><dt>Time</dt><dd>{new Date(timeline.time).toLocaleString()}</dd></dl>
  else if (plan) content = <dl className="source-detail"><dt>Plan</dt><dd>{plan.planName || `${plan.pathway} monitoring plan`}</dd><dt>Pathway</dt><dd>{plan.pathway}</dd><dt>Observations</dt><dd>{plan.observations.map(item => `${item.type}: ${item.frequency}`).join('; ')}</dd><dt>Next review</dt><dd>{plan.nextReview}</dd><dt>Notes</dt><dd>{plan.notes}</dd></dl>

  return (
    <Modal title={`Evidence · ${source.label}`} wide onClose={close}>
      <div className="evidence-banner"><BrainCircuit /><span><b>{source.sourceType}</b>Exact frontend state record used by the AI summary.<small>{source.timestamp ? new Date(source.timestamp).toLocaleString() : 'Synthetic source record'}</small></span></div>
      {content}
    </Modal>
  )
}

function unitFor(type: VitalType) {
  if (type === 'SpO2') return '%'
  if (type === 'Heart Rate') return 'bpm'
  if (type === 'Blood Pressure') return 'mmHg'
  if (type === 'Temperature') return '°C'
  if (type === 'Weight') return 'kg'
  if (type === 'Glucose') return 'mmol/L'
  if (type === 'Pain') return '/10'
  return 'score'
}

function deviceTypeSupports(deviceType: string, vital: VitalType) {
  return (
    (deviceType === 'Pulse Oximeter' && vital === 'SpO2') ||
    (deviceType === 'BP Monitor' && vital === 'Blood Pressure') ||
    (deviceType === 'Thermometer' && vital === 'Temperature') ||
    (deviceType === 'Weight Scale' && vital === 'Weight') ||
    (deviceType === 'Glucose Monitor' && vital === 'Glucose') ||
    (deviceType === 'Wearable' && vital === 'Heart Rate')
  )
}
