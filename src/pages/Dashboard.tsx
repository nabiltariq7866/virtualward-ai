import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, BrainCircuit, Clock3, Radio, WifiOff } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useVirtualWardStore } from '../stores/useVirtualWardStore'
import { generateMonitoringInsights } from '../services/ai'
import { deriveExpectedReadings } from '../utils/monitoring'
import { Badge, Card, Metric, PageHeader } from '../components/UI'

export default function Dashboard() {
  const s = useVirtualWardStore()
  const nav = useNavigate()
  const active = s.patients.filter(p => p.monitoringStatus !== 'Completed')
  const expected = deriveExpectedReadings(s.patients, s.carePlans, s.observations, s.devices)
  const missing = expected.filter(r => r.status === 'Missing')
  const counts = {
    stable: active.filter(p => p.risk === 'Stable').length,
    review: active.filter(p => p.risk === 'Needs Review').length,
    high: active.filter(p => p.risk === 'High Risk').length,
  }
  const attention = active.filter(p => p.risk !== 'Stable').sort((a, b) => (a.risk === 'High Risk' ? -1 : 1) - (b.risk === 'High Risk' ? -1 : 1))
  const unresolved = s.alerts.filter(a => !['Resolved', 'Dismissed'].includes(a.status))
  const reviewsDue = active.filter(p => p.nextReview.includes('Today') || p.nextReview === 'Overdue').length
  const insights = generateMonitoringInsights(active, s.alerts, s.observations)
  const primaryInsight = insights.find(i => i.patientIds.length) || insights[0]
  const data = [
    { name: 'Stable', value: counts.stable, color: '#43B99F' },
    { name: 'Needs attention', value: counts.review, color: '#D79A3D' },
    { name: 'High risk', value: counts.high, color: '#D0605D' },
    { name: 'Awaiting reading', value: new Set(missing.map(r => r.patientId)).size, color: '#679BC3' },
    { name: 'Escalated', value: s.alerts.filter(a => a.status === 'Escalated').length, color: '#596FC4' },
  ]

  return <>
    <PageHeader
      eyebrow="LIVE COMMAND CENTRE"
      title="Virtual Ward"
      description="Real-time overview of remotely monitored patients, clinical alerts and care-plan activity."
      actions={<><span className="live-pill"><Radio /> Live monitoring · {s.devices.filter(d => d.status === 'Connected').length} devices</span><button className="btn primary" onClick={() => nav('/monitoring')}>Open live monitoring <ArrowRight /></button></>}
    />
    <div className="metric-grid">
      <Metric label="Active patients" value={active.length} note="Across 5 care pathways" />
      <Metric label="Stable" value={counts.stable} tone="success" note="Within monitoring baseline" />
      <Metric label="Needs review" value={counts.review} tone="warning" note="Clinical review recommended" />
      <Metric label="High risk" value={counts.high} tone="danger" note="Prioritized for review" />
      <Metric label="New alerts" value={unresolved.length} tone="warning" />
      <Metric label="Missing readings" value={missing.length} tone="warning" />
      <Metric label="Devices offline" value={s.devices.filter(d => d.status === 'Offline').length} tone="danger" />
      <Metric label="Reviews due today" value={reviewsDue} />
    </div>
    <div className="dashboard-grid">
      <Card title="Patients requiring attention" className="priority-card" action={<button className="text-btn" onClick={() => nav('/patients')}>View all <ArrowRight /></button>}>
        <div className="priority-list">
          {attention.map(p => {
            const latest = s.observations.filter(o => o.patientId === p.id).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))[0]
            return <button key={p.id} onClick={() => nav(`/patients/${p.id}`)} className="priority-row">
              <span className={`patient-avatar ${p.risk === 'High Risk' ? 'red' : ''}`}>{p.name.split(' ').map(x => x[0]).join('')}</span>
              <span className="priority-name"><b>{p.name}</b><small>{p.pathway} · Day {p.day}</small></span>
              <span className="signal"><b>{p.summary.split('.')[0]}</b><small>{latest ? `Latest: ${latest.type} ${latest.value}${latest.unit}` : 'Awaiting reading'}</small></span>
              <Badge>{p.risk}</Badge><ArrowRight />
            </button>
          })}
        </div>
      </Card>
      <Card title="Live patient status" className="status-card">
        <div className="chart-box"><ResponsiveContainer width="100%" height={180}><BarChart data={data}><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} /><Tooltip /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map(d => <Cell key={d.name} fill={d.color} />)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="status-legend">{data.map(d => <div key={d.name}><i style={{ background: d.color }} /><span>{d.name}</span><b>{d.value}</b></div>)}</div>
      </Card>
      <Card className="ai-panel">
        <div className="ai-head"><span><BrainCircuit /></span><div><div className="eyebrow">AI MONITORING INSIGHT</div><h2>{primaryInsight.observation}</h2></div></div>
        <p>{primaryInsight.why}</p>
        <div className="evidence-chips">{primaryInsight.evidence.slice(0, 4).map(e => <span key={e}><Activity /> {e}</span>)}</div>
        <div className="ai-foot"><span><b>Suggested action:</b> {primaryInsight.action}</span><button onClick={() => nav('/ai-insights')}>View insights <ArrowRight /></button></div>
        <small className="disclaimer">AI-generated operational insight. Not a clinical diagnosis. Clinician decision required.</small>
      </Card>
      <Card title="Care activity today"><div className="activity-list">{s.timeline.slice(0, 5).map(e => <div key={e.id}><span className="activity-icon"><Activity /></span><span><b>{e.title}</b><small>{s.patients.find(p => p.id === e.patientId)?.name} · {e.detail}</small></span><time>{new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div></Card>
    </div>
  </>
}
