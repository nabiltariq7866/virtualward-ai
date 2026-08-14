import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Card, CustomSelect, Empty, Field, Modal, PageHeader } from '../components/UI'
import { can, useVirtualWardStore } from '../stores/useVirtualWardStore'
import type { Message } from '../types/domain'

const templates = {
  'Reading reminder': 'Please complete your scheduled Virtual Ward reading when appropriate.',
  'Medication reminder': 'Please confirm your scheduled medication in the patient check-in. Do not change your medication based on this message.',
  'Nurse check-in': 'Your Virtual Ward nurse would like to check how you are feeling today. Please complete the daily check-in.',
  'Virtual review': 'Your virtual review is scheduled. Please keep your monitoring device available.',
}

export default function Communications() {
  const s = useVirtualWardStore()
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState('PT-20284')
  const [channel, setChannel] = useState<Message['channel']>('App')
  const [template, setTemplate] = useState<keyof typeof templates>('Reading reminder')
  const [body, setBody] = useState(templates['Reading reminder'])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const filtered = useMemo(() => s.messages.filter(m => [m.body, m.channel, m.sender, m.response, s.patients.find(p => p.id === m.patientId)?.name].join(' ').toLowerCase().includes(query.toLowerCase())), [s.messages, s.patients, query])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const list = filtered.slice((current - 1) * pageSize, current * pageSize)
  const send = () => {
    const result = s.sendMessage(patientId, body, channel)
    if (!result.ok) { toast.error(result.error); return }
    toast.success('Demo message sent')
    setOpen(false)
  }
  return <>
    <PageHeader eyebrow="PATIENT COMMUNICATION" title="Patient messages" description="Simulated app, SMS-demo and email-demo communication with templates, status and patient responses." actions={<button className="btn primary" disabled={!can(s.role, 'communication')} onClick={() => setOpen(true)}><Plus /> Send message</button>} />
    <Card><div className="table-tools"><label className="search-box"><Search /><input aria-label="Search communications" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Search patient, message or channel..." /></label></div>{list.length ? <><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Message</th><th>Channel</th><th>Sender</th><th>Time</th><th>Status</th><th>Patient response</th></tr></thead><tbody>{list.map(m => <tr key={m.id}><td>{s.patients.find(x => x.id === m.patientId)?.name}</td><td>{m.body}</td><td>{m.channel}</td><td>{m.sender}</td><td>{new Date(m.time).toLocaleString()}</td><td><Badge>{m.status}</Badge></td><td>{m.response || 'No response'}</td></tr>)}</tbody></table></div><div className="pagination"><small>Page {current}/{pages}</small><div><button className="icon-btn" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(v => Math.max(1, v - 1))}><ChevronLeft /></button><button className="icon-btn" aria-label="Next page" disabled={current >= pages} onClick={() => setPage(v => Math.min(pages, v + 1))}><ChevronRight /></button></div></div></> : <Empty title="No communications" />}</Card>
    {open && <Modal title="Send patient message" onClose={() => setOpen(false)}><Field label="Patient"><CustomSelect ariaLabel="Patient" value={patientId} onChange={setPatientId} options={s.patients.filter(p => p.monitoringStatus !== 'Completed').map(p => ({value:p.id,label:p.name}))}/></Field><Field label="Template"><CustomSelect ariaLabel="Message template" value={template} onChange={value => { const next = value as keyof typeof templates; setTemplate(next); setBody(templates[next]) }} options={Object.keys(templates).map(value=>({value,label:value}))}/></Field><Field label="Channel"><CustomSelect ariaLabel="Message channel" value={channel} onChange={value => setChannel(value as Message['channel'])} options={['App','SMS Demo','Email Demo'].map(value=>({value,label:value}))}/></Field><Field label="Custom message"><textarea value={body} onChange={e => setBody(e.target.value)} /></Field><small className="disclaimer">Simulation only. No real SMS, email or app message is sent.</small><div className="modal-actions"><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn primary" disabled={!body.trim()} onClick={send}><Send /> Send demo message</button></div></Modal>}
  </>
}
