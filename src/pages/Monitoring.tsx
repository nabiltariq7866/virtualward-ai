import { useEffect, useMemo, useState } from 'react'
import { Activity, Pause, Play, Radio, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { useVirtualWardStore, type Scenario } from '../stores/useVirtualWardStore'
import { deriveExpectedReadings } from '../utils/monitoring'
import { Badge, Card, CustomSelect, Empty, LoadingState, Metric, PageHeader } from '../components/UI'

const scenarios: Scenario[] = ['Stable Monitoring', 'COPD Deterioration', 'Heart Failure Weight Change', 'Missed Medication', 'Device Disconnection', 'Post-operative Monitoring', 'Hypertension Trend', 'Virtual Discharge']

export default function Monitoring() {
  const s = useVirtualWardStore()
  const [auto, setAuto] = useState(false)
  const [streamLoading, setStreamLoading] = useState(false)
  const expected = useMemo(() => deriveExpectedReadings(s.patients, s.carePlans, s.observations, s.devices), [s.patients, s.carePlans, s.observations, s.devices])

  useEffect(() => { useVirtualWardStore.getState().refreshMissingReadingAlerts() }, [])
  useEffect(() => {
    if (!auto) return
    setStreamLoading(true)
    const loadingTimer = setTimeout(() => setStreamLoading(false), 400)
    const timer = setInterval(() => useVirtualWardStore.getState().advanceScenario(), 2200)
    return () => { clearTimeout(loadingTimer); clearInterval(timer) }
  }, [auto, s.scenario])

  const latest = [...s.observations].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 14)
  return <>
    <PageHeader eyebrow="REMOTE TELEMETRY" title="Live observations" description="Synthetic device readings and deterministic monitoring scenarios from the active virtual ward." actions={<span className="live-pill"><Radio /> Observation stream connected</span>} />
    <Card className="scenario-control">
      <div className="scenario-title"><span><Settings2 /></span><div><small>LIVE DEMO CONTROL</small><h2>Play monitoring scenario</h2><p>Predictable sequences make every client demonstration reliable.</p></div></div>
      <CustomSelect ariaLabel="Live demo scenario" value={s.scenario} onChange={value => { s.setScenario(value as Scenario); setAuto(false) }} options={scenarios.map(value=>({value,label:value}))}/>
      <button className={`btn ${auto ? 'danger' : 'primary'}`} onClick={() => setAuto(!auto)}>{auto ? <><Pause /> Pause</> : <><Play /> Start live demo</>}</button>
      <button className="btn" onClick={() => { s.resetDemo(); setAuto(false); toast.success('Scenario reset') }}><RotateCcw /> Reset</button>
      <button className="btn" onClick={() => { s.advanceScenario(); setTimeout(() => useVirtualWardStore.getState().refreshMissingReadingAlerts(), 0); toast.success('Synthetic scenario step processed') }}><Activity /> Next step</button>
      <div className="scenario-progress"><span style={{ width: `${Math.min(s.scenarioStep * 22, 100)}%` }} /></div><small>Step {s.scenarioStep} · {auto ? 'Receiving predefined observations…' : 'Ready'}</small>
    </Card>
    <div className="metric-grid four">
      <Metric label="Readings received today" value={expected.filter(r => r.status === 'Received').length} tone="success" />
      <Metric label="Expected readings" value={expected.length} />
      <Metric label="Missing readings" value={expected.filter(r => r.status === 'Missing').length} tone="warning" />
      <Metric label="Devices connected" value={s.devices.filter(d => d.status === 'Connected').length} tone="success" />
    </div>
    <Card title="Incoming observation stream">
      <div className="stream-list" style={{ position: 'relative' }}>
        {streamLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><LoadingState kind="observation" /></div>}
        {latest.length ? latest.map((o, i) => {
          const p = s.patients.find(p => p.id === o.patientId)
          return <div className={i === 0 && s.scenarioStep ? 'new-reading' : ''} key={o.id}><span className="stream-dot"><Activity /></span><span><b>{p?.name}</b><small>{p?.pathway} · {o.source}</small></span><span><b>{o.type}</b><small>{o.deviceId || 'Manual entry'}</small></span><strong>{o.value}{o.secondaryValue ? `/${o.secondaryValue}` : ''} <small>{o.unit}</small></strong><Badge>{o.status}</Badge><time>{new Date(o.timestamp).toLocaleTimeString()}</time></div>
        }) : <Empty title="No recent readings" detail="Start a deterministic monitoring scenario or submit a patient reading." icon="reading" />}
      </div>
    </Card>
  </>
}
