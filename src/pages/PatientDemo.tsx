import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Heart, MessageSquare, Radio, Send, ShieldCheck, Smartphone, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import { useVirtualWardStore } from '../stores/useVirtualWardStore'
import type { VitalType } from '../types/domain'
import { Badge, Card, CustomSelect, ErrorState, Field, LoadingState, Modal } from '../components/UI'

export default function PatientDemo() {
  const s = useVirtualWardStore()
  const [patientId, setPatient] = useState('PT-20284')
  const [reading, setReading] = useState(false)
  const [checkin, setCheckin] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const previousRole = useVirtualWardStore.getState().role
    useVirtualWardStore.getState().setRole('Patient / Caregiver')
    return () => useVirtualWardStore.getState().setRole(previousRole)
  }, [])

  const p = s.patients.find(x => x.id === patientId)
  if (!p) return <div className="patient-portal"><main><ErrorState kind="missing-patient" /></main></div>

  const obs = s.observations.filter(o => o.patientId === p.id).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
  const tasks = s.tasks.filter(t => t.patientId === p.id)
  const meds = s.medications.filter(m => m.patientId === p.id)
  const messages = s.messages.filter(m => m.patientId === p.id)

  const syncDevice = () => {
    setSyncing(true)
    setTimeout(() => {
      const latest = obs[0]
      const ok = s.addObservation(p.id, latest?.type || 'SpO2', latest?.value || 97, latest?.unit || '%', 'Synced demo device', latest?.secondaryValue, latest?.deviceId)
      setSyncing(false)
      ok ? toast.success('Device reading synced') : toast.error('Unable to sync the synthetic reading.')
    }, 650)
  }

  return <div className="patient-portal">
    <header className="portal-header">
      <div className="portal-brand"><Heart /><b>VirtualWard</b><span>Patient</span></div>
      <CustomSelect ariaLabel="Select patient demo profile" value={patientId} onChange={setPatient} options={s.patients.filter(patient => patient.monitoringStatus !== 'Completed').map(patient => ({value:patient.id,label:`${patient.name} (demo)`}))}/>
      <span><Wifi /> Patient / Caregiver demo mode</span>
    </header>
    <main>
      <section className="portal-welcome">
        <div><small>GOOD AFTERNOON</small><h1>Hello, {p.name.split(' ')[0]}</h1><p>Your virtual ward team is monitoring your readings. If you feel seriously unwell, use your usual emergency-care route.</p></div>
        <div className="next-review"><span><Smartphone /></span><div><small>NEXT VIRTUAL REVIEW</small><b>{p.nextReview}</b><span>{p.nurse}</span></div></div>
      </section>
      <div className="portal-grid">
        <Card className="portal-actions"><h2>How are you feeling today?</h2><p>Complete your daily check-in to keep your care team informed.</p><button className="btn primary full" onClick={() => setCheckin(true)}><Heart /> Complete daily check-in</button></Card>
        <Card title="Today's readings"><div className="portal-reading-grid">{obs.slice(0, 3).map(o => <div key={o.id}><span><Activity /></span><small>{o.type}</small><b>{o.value}{o.secondaryValue ? `/${o.secondaryValue}` : ''}{o.unit}</b><Badge>{o.status}</Badge></div>)}</div><div className="portal-buttons"><button className="btn" onClick={() => setReading(true)}>Enter reading</button><button className="btn primary" disabled={syncing} onClick={syncDevice}><Radio /> {syncing ? 'Receiving observation…' : 'Sync device reading'}</button></div>{syncing && <LoadingState kind="device" />}</Card>
        <Card title="Today's tasks"><div className="portal-task-list">{tasks.map(task => <button key={task.id} onClick={() => { const result = s.updateTask(task.id, 'Completed'); result.ok ? toast.success('Task completed') : toast.error(result.error) }}><span className={task.status === 'Completed' ? 'done' : ''}><CheckCircle2 /></span><span><b>{task.title}</b><small>{task.due}</small></span><Badge>{task.status}</Badge></button>)}</div></Card>
        <Card title="Medication"><div className="portal-med-list">{meds.map(med => <div key={med.id}><ShieldCheck /><span><b>{med.name}</b><small>{med.schedule}</small></span><Badge>{med.today}</Badge></div>)}</div></Card>
        <Card title="Messages from your care team" className="portal-messages">{messages.slice(0, 3).map(message => <div key={message.id}><MessageSquare /><span><b>{message.sender}</b><p>{message.body}</p><small>{new Date(message.time).toLocaleString()} · {message.channel}</small></span></div>)}</Card>
      </div>
    </main>
    {reading && <ReadingModal patientId={p.id} close={() => setReading(false)} />}
    {checkin && <CheckinModal patientId={p.id} close={() => setCheckin(false)} />}
  </div>
}

function ReadingModal({ patientId, close }: { patientId: string; close: () => void }) {
  const add = useVirtualWardStore(state => state.addObservation)
  const [type, setType] = useState<VitalType>('SpO2')
  const [value, setValue] = useState('')
  const [showInvalid, setShowInvalid] = useState(false)
  const units: Record<string, string> = { SpO2: '%', Temperature: '°C', Weight: 'kg', Glucose: 'mmol/L', 'Blood Pressure': 'mmHg' }
  const submit = () => {
    const numeric = +value
    if (!Number.isFinite(numeric) || numeric <= 0) return setShowInvalid(true)
    const ok = add(patientId, type, numeric, units[type], 'Patient manual entry')
    if (!ok) return setShowInvalid(true)
    toast.success('Reading submitted')
    close()
  }
  return <Modal title="Enter a reading" onClose={close}><Field label="Reading type"><CustomSelect ariaLabel="Reading type" value={type} onChange={value => setType(value as VitalType)} options={Object.keys(units).map(value=>({value,label:value}))}/></Field><Field label={`Value (${units[type]})`}><input type="number" step="0.1" value={value} onChange={e => { setValue(e.target.value); setShowInvalid(false) }} /></Field>{showInvalid && <ErrorState kind="reading-invalid" />}<div className="modal-actions"><button className="btn" onClick={close}>Cancel</button><button className="btn primary" disabled={!value} onClick={submit}><Send /> Submit reading</button></div></Modal>
}

function CheckinModal({ patientId, close }: { patientId: string; close: () => void }) {
  const submit = useVirtualWardStore(state => state.submitCheckIn)
  const [symptom, setSymptom] = useState('No new symptoms')
  const [severity, setSeverity] = useState('Mild')
  const [medicationTaken, setMedicationTaken] = useState(true)
  const [deviceProblem, setDeviceProblem] = useState(false)
  const save = () => {
    const result = submit(patientId, symptom, severity, medicationTaken, deviceProblem)
    if (!result.ok) return toast.error(result.error)
    toast.success('Check-in submitted')
    close()
  }
  return <Modal title="Daily patient check-in" onClose={close}><Field label="Any new symptoms?"><CustomSelect ariaLabel="New symptoms" value={symptom} onChange={setSymptom} options={['No new symptoms','Breathlessness','Dizziness','Fatigue','Pain','Nausea','Swelling','Other'].map(value=>({value,label:value}))}/></Field><Field label="Severity"><CustomSelect ariaLabel="Symptom severity" value={severity} onChange={setSeverity} options={['Mild','Moderate','Severe'].map(value=>({value,label:value}))}/></Field><label className="check-field"><input type="checkbox" checked={medicationTaken} onChange={e => setMedicationTaken(e.target.checked)} /> I took my scheduled medication</label><label className="check-field"><input type="checkbox" checked={deviceProblem} onChange={e => setDeviceProblem(e.target.checked)} /> I am having a device problem</label><div className="modal-actions"><button className="btn" onClick={close}>Cancel</button><button className="btn primary" onClick={save}>Submit check-in</button></div></Modal>
}
