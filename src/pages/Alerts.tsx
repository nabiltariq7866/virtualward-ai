import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, ArrowUpDown, BrainCircuit, ChevronLeft, ChevronRight, ClipboardCheck, MessageSquare, Search, ShieldAlert, Stethoscope, UserRoundCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Card, CustomSelect, Empty, ErrorState, Field, PageHeader } from '../components/UI'
import { can, useVirtualWardStore } from '../stores/useVirtualWardStore'
import type { AlertPriority } from '../types/domain'

const priorityRank: Record<AlertPriority, number> = { Informational: 0, Attention: 1, High: 2, 'Urgent Review': 3 }

export default function Alerts() {
  const s = useVirtualWardStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<string | undefined>(params.get('open') ?? undefined)
  const [filter, setFilter] = useState<'Open' | 'Resolved' | 'All'>('Open')
  const [priority, setPriority] = useState('All')
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 5

  const alerts = useMemo(() => s.alerts.filter(a => {
    const p = s.patients.find(x => x.id === a.patientId)
    const match = !query || [a.type, a.trigger, a.assignedTo, p?.name, p?.pathway].join(' ').toLowerCase().includes(query.toLowerCase())
    const status = filter === 'All' || (filter === 'Open' ? !['Resolved', 'Dismissed'].includes(a.status) : a.status === 'Resolved')
    const priorityMatch = priority === 'All' || a.priority === priority
    return match && status && priorityMatch
  }).sort((a, b) => (priorityRank[b.priority] - priorityRank[a.priority]) * (sortDesc ? 1 : -1) || +new Date(b.createdAt) - +new Date(a.createdAt)), [s.alerts, s.patients, query, filter, priority, sortDesc])

  const pages = Math.max(1, Math.ceil(alerts.length / pageSize))
  const currentPage = Math.min(page, pages)
  const list = alerts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedAlert = s.alerts.find(a => a.id === selected)
  const patient = s.patients.find(p => p.id === selectedAlert?.patientId)

  return <>
    <PageHeader eyebrow="CLINICAL MONITORING" title="Clinical alerts" description="Review, assign, contact, escalate and resolve AI-assisted monitoring signals with human clinical oversight." />
    <Card>
      <div className="table-tools">
        <label className="search-box"><Search /><input aria-label="Search alerts" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Search patient, pathway, alert or assignee..." /></label>
        <div className="filter-grid">
          <CustomSelect ariaLabel="Alert status" value={filter} onChange={value => { setFilter(value as typeof filter); setPage(1) }} options={['Open','Resolved','All'].map(value=>({value,label:value}))}/>
          <CustomSelect ariaLabel="Alert priority" value={priority} onChange={value => { setPriority(value); setPage(1) }} options={['All','Informational','Attention','High','Urgent Review'].map(value=>({value,label:value}))}/>
        </div>
      </div>
      {list.length ? <><div className="table-wrap"><table><thead><tr><th>Alert</th><th>Patient</th><th>Care pathway</th><th>Trigger</th><th>Time</th><th><button className="sort-button" onClick={() => setSortDesc(v => !v)}>Priority <ArrowUpDown /></button></th><th>Assigned to</th><th>Status</th><th>Action</th></tr></thead><tbody>{list.map(a => {
        const p = s.patients.find(x => x.id === a.patientId)
        return <tr key={a.id}><td><div className="alert-title"><ShieldAlert /><span><b>{a.type}</b><small>{a.id}</small></span></div></td><td>{p?.name}</td><td>{p?.pathway}</td><td>{a.trigger}</td><td>{new Date(a.createdAt).toLocaleString()}</td><td><Badge>{a.priority}</Badge></td><td>{a.assignedTo}</td><td><Badge>{a.status}</Badge></td><td><button className="btn" onClick={() => setSelected(a.id)}>Review</button></td></tr>
      })}</tbody></table></div><div className="pagination"><small>Page {currentPage} of {pages}</small><div><button className="icon-btn" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(v => Math.max(1, v - 1))}><ChevronLeft /></button><button className="icon-btn" aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(v => Math.min(pages, v + 1))}><ChevronRight /></button></div></div></> : <Empty title="No alerts match" detail="Try a different status, priority or search filter." icon="alert" />}
    </Card>
    {selectedAlert && patient && <AlertDrawer alertId={selectedAlert.id} close={() => setSelected(undefined)} openPatient={() => nav(`/patients/${patient.id}`)} />}
  </>
}

function AlertDrawer({ alertId, close, openPatient }: { alertId: string; close: () => void; openPatient: () => void }) {
  const s = useVirtualWardStore()
  const alert = s.alerts.find(a => a.id === alertId)!
  const patient = s.patients.find(p => p.id === alert.patientId)!
  const plan = s.carePlans.find(c => c.patientId === patient.id)
  const readings = s.observations.filter(o => o.patientId === patient.id).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 6)
  const [assignee, setAssignee] = useState(alert.assignedTo)
  const [notes, setNotes] = useState('Monitoring evidence reviewed with the patient context.')
  const [resolution, setResolution] = useState('Clinical review completed and monitoring plan remains appropriate.')
  const [disposition, setDisposition] = useState('Continue Monitoring')
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]') || [])
    focusable()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const items = focusable(); if (!items.length) return
        const first = items[0], last = items.at(-1)!
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [close])

  const run = (result: { ok: boolean; error?: string }, success: string) => result.ok ? toast.success(success) : toast.error(result.error)
  const closed = ['Resolved', 'Dismissed'].includes(alert.status)
  return <div className="drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><aside ref={drawerRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby="alert-drawer-title">
    <div className="drawer-head"><div><div className="eyebrow">{alert.id} · {alert.type}</div><h2 id="alert-drawer-title">{alert.trigger}</h2><p>{patient.name} · {patient.pathway} · {patient.episodeId}</p></div><button className="icon-btn" aria-label="Close alert" onClick={close}><X /></button></div>
    {closed && <div className="drawer-section"><ErrorState kind="alert-resolved" detail={alert.resolution || 'The alert is closed and historical actions remain in the audit trail.'} /></div>}
    <div className="drawer-section"><div className="alert-workflow">{['Generated', 'Needs Review', 'Acknowledged', 'Contacted', 'Clinical Decision', 'Resolved / Escalated'].map(step => <span key={step}>{step}</span>)}</div><div className="human-review-grid"><div><small>AI MONITORING SIGNAL</small><Badge>{patient.risk}</Badge><p>{alert.trigger}</p></div><div><small>CURRENT ALERT STATE</small><Badge>{alert.status}</Badge><p>Assigned to {alert.assignedTo}</p></div><div><small>CLINICIAN DECISION</small><Badge>{alert.resolution ? 'Recorded' : 'Required'}</Badge><p>{alert.resolution || 'Human review is required before closure.'}</p></div></div></div>
    <div className="drawer-section"><h3>Supporting observations & AI explanation</h3><div className="ai-explain"><BrainCircuit /><div><b>Why flagged?</b>{alert.evidence.map(e => <p key={e}>{e}</p>)}<small>Potential monitoring pattern only. Not a diagnosis.</small></div></div>{readings.map(o => <div className="drawer-reading" key={o.id}><span>{o.type}<small>{new Date(o.timestamp).toLocaleString()} · {o.source}</small></span><b>{o.value}{o.secondaryValue ? `/${o.secondaryValue}` : ''}{o.unit}</b><Badge>{o.status}</Badge></div>)}</div>
    <div className="drawer-section"><h3>Current care context</h3><p><b>Recent contact:</b> {patient.lastContact.startsWith('20') ? new Date(patient.lastContact).toLocaleString() : patient.lastContact}</p><p><b>Monitoring plan:</b> {plan?.planName || `${patient.pathway} demo monitoring plan`}</p><p><b>Next review:</b> {patient.nextReview}</p><button className="text-btn" onClick={openPatient}>Open full patient workspace</button></div>
    <div className="drawer-section"><h3>Care-team actions</h3><div className="form-grid"><Field label="Assign to"><CustomSelect ariaLabel="Assign alert to" value={assignee} disabled={!can(s.role, 'review') || closed} onChange={value => { setAssignee(value); run(s.assignAlert(alert.id, value), 'Alert assigned') }} options={['Rebecca Morgan','Aisha Khan','Nina Patel','Dr. James Howard','Remote Care Team'].map(value=>({value,label:value}))}/></Field><Field label="Nurse disposition"><CustomSelect ariaLabel="Nurse disposition" value={disposition} onChange={setDisposition} options={['Continue Monitoring','Increase Monitoring','Schedule Virtual Review','Escalate to Doctor','Contact Caregiver'].map(value=>({value,label:value}))}/></Field></div><Field label="Clinical / escalation notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field><Field label="Resolution / dismissal reason"><textarea value={resolution} onChange={e => setResolution(e.target.value)} /></Field><div className="workflow-actions"><button className="btn" disabled={!can(s.role, 'review') || closed || alert.status !== 'Needs Review'} onClick={() => run(s.acknowledgeAlert(alert.id), 'Alert acknowledged')}><UserRoundCheck /> Acknowledge</button><button className="btn" disabled={!can(s.role, 'communication') || closed} onClick={() => run(s.contactPatient(alert.id), 'Patient contacted')}><MessageSquare /> Contact patient</button><button className="btn" disabled={s.role !== 'Virtual Ward Nurse' || closed || !notes.trim()} title={s.role !== 'Virtual Ward Nurse' ? 'Virtual Ward Nurse role required' : ''} onClick={() => run(s.createReview(patient.id, alert.trigger, notes, disposition), 'Nurse review recorded')}><ClipboardCheck /> Create nurse review</button><button className="btn" disabled={!can(s.role, 'escalate') || closed || !notes.trim()} onClick={() => run(s.createEscalation(patient.id, alert.trigger, notes), 'Doctor escalation created')}><Stethoscope /> Escalate to doctor</button><button className="btn primary" disabled={!can(s.role, 'review') || closed || !resolution.trim()} onClick={() => run(s.resolveAlert(alert.id, resolution), 'Alert resolved')}><Activity /> Resolve</button><button className="btn danger" disabled={!can(s.role, 'review') || closed || alert.priority === 'Urgent Review' || !resolution.trim()} onClick={() => run(s.dismissAlert(alert.id, resolution), 'Alert dismissed')}>Dismiss</button></div></div>
  </aside></div>
}
