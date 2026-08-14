import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, Empty, PageHeader, Segmented } from '../components/UI'
import { useVirtualWardStore } from '../stores/useVirtualWardStore'

export default function RiskOverviewPage() {
  const s = useVirtualWardStore()
  const [view, setView] = useState('By patient')
  const active = s.patients.filter(p => p.monitoringStatus !== 'Completed')
  const pathways = [...new Set(active.map(p => p.pathway))]
  const byPatient = active.map(p => ({ ...p, signals: s.alerts.filter(a => a.patientId === p.id && !['Resolved', 'Dismissed'].includes(a.status)).length }))
  const pathwayData = pathways.map(pathway => ({ name: pathway, stable: active.filter(p => p.pathway === pathway && p.risk === 'Stable').length, review: active.filter(p => p.pathway === pathway && p.risk === 'Needs Review').length, high: active.filter(p => p.pathway === pathway && p.risk === 'High Risk').length }))
  const riskFactors = useMemo(() => [
    { factor: 'Vital trend', count: s.alerts.filter(a => a.type === 'Vital Trend' && !['Resolved', 'Dismissed'].includes(a.status)).length },
    { factor: 'Medication adherence', count: s.alerts.filter(a => a.type === 'Medication Adherence' && !['Resolved', 'Dismissed'].includes(a.status)).length },
    { factor: 'Missing reading', count: s.alerts.filter(a => a.type === 'Missing Reading' && !['Resolved', 'Dismissed'].includes(a.status)).length },
    { factor: 'Device continuity', count: s.alerts.filter(a => a.type === 'Device Offline' && !['Resolved', 'Dismissed'].includes(a.status)).length },
    { factor: 'Patient symptom', count: s.alerts.filter(a => a.type === 'Patient-Reported Symptom' && !['Resolved', 'Dismissed'].includes(a.status)).length },
  ], [s.alerts])
  const ward = [
    { cohort: 'Stable', count: active.filter(p => p.risk === 'Stable').length },
    { cohort: 'Needs Review', count: active.filter(p => p.risk === 'Needs Review').length },
    { cohort: 'High Risk', count: active.filter(p => p.risk === 'High Risk').length },
    { cohort: 'Escalated', count: new Set(s.alerts.filter(a => a.status === 'Escalated').map(a => a.patientId)).size },
  ]
  return <>
    <PageHeader eyebrow="RISK INTELLIGENCE" title="Risk overview" description="Four operational views of AI-assisted monitoring priority. All signals require human clinical review." />
    <div className="page-utility"><Segmented items={['By patient', 'By pathway', 'By ward cohort', 'By risk factor']} value={view} onChange={setView} /></div>
    {view === 'By patient' && <Card title="Patient risk">{byPatient.length ? <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Risk</th><th>Pathway</th><th>Open signals</th><th>Next review</th><th>Current summary</th></tr></thead><tbody>{byPatient.map(p => <tr key={p.id}><td><b>{p.name}</b><small className="block">{p.episodeId}</small></td><td><Badge>{p.risk}</Badge></td><td>{p.pathway}</td><td>{p.signals}</td><td>{p.nextReview}</td><td>{p.summary}</td></tr>)}</tbody></table></div> : <Empty title="No active patients" />}</Card>}
    {view === 'By pathway' && <Card title="Pathway risk"><ResponsiveContainer width="100%" height={320}><BarChart data={pathwayData}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="stable" stackId="a" fill="#43B99F" /><Bar dataKey="review" stackId="a" fill="#D79A3D" /><Bar dataKey="high" stackId="a" fill="#D0605D" /></BarChart></ResponsiveContainer></Card>}
    {view === 'By ward cohort' && <Card title="Ward cohort"><div className="table-wrap"><table><thead><tr><th>Cohort</th><th>Patients</th><th>Operational meaning</th></tr></thead><tbody>{ward.map(r => <tr key={r.cohort}><td><Badge>{r.cohort}</Badge></td><td>{r.count}</td><td>{r.cohort === 'Stable' ? 'Continue scheduled monitoring.' : r.cohort === 'Escalated' ? 'Doctor review workflow is active.' : 'Prioritize for clinical review.'}</td></tr>)}</tbody></table></div></Card>}
    {view === 'By risk factor' && <Card title="Risk factors"><ResponsiveContainer width="100%" height={300}><BarChart data={riskFactors} layout="vertical"><XAxis type="number" allowDecimals={false} /><YAxis dataKey="factor" type="category" width={150} /><Tooltip /><Bar dataKey="count" fill="#679BC3" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer><small className="disclaimer">Counts reflect deterministic synthetic alerts, not validated clinical risk scores.</small></Card>}
  </>
}
