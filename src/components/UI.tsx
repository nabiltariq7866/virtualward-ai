import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { X, AlertTriangle, CheckCircle2, Clock3, Radio, WifiOff, Loader2, BrainCircuit, Activity, RefreshCw, FileWarning, ChevronDown, Check } from 'lucide-react'
import type { Risk } from '../types/domain'


export type CustomSelectOption = { value: string; label: string; description?: string }
export function CustomSelect({value,onChange,options,ariaLabel,disabled=false,placeholder='Select an option',className=''}:{value:string;onChange:(value:string)=>void;options:CustomSelectOption[];ariaLabel:string;disabled?:boolean;placeholder?:string;className?:string}){
  const [open,setOpen]=useState(false)
  const rootRef=useRef<HTMLDivElement>(null)
  const optionRefs=useRef<Array<HTMLButtonElement|null>>([])
  const listId=useId()
  const isDisabled=disabled||options.length===0
  const selected=options.find(option=>option.value===value)
  const selectedIndex=Math.max(0,options.findIndex(option=>option.value===value))
  const [activeIndex,setActiveIndex]=useState(selectedIndex)

  useEffect(()=>{setActiveIndex(selectedIndex)},[selectedIndex])
  useEffect(()=>{
    if(!open)return
    const onPointer=(event:MouseEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))setOpen(false)}
    document.addEventListener('mousedown',onPointer)
    return()=>document.removeEventListener('mousedown',onPointer)
  },[open])
  useEffect(()=>{if(open)requestAnimationFrame(()=>optionRefs.current[activeIndex]?.focus())},[open,activeIndex])

  const choose=(next:string)=>{onChange(next);setOpen(false)}
  const move=(delta:number)=>setActiveIndex(index=>Math.max(0,Math.min(options.length-1,index+delta)))
  const onTriggerKey=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
    if(isDisabled)return
    if(event.key==='ArrowDown'){event.preventDefault();setActiveIndex(Math.min(options.length-1,selectedIndex+1));setOpen(true)}
    else if(event.key==='ArrowUp'){event.preventDefault();setActiveIndex(Math.max(0,selectedIndex-1));setOpen(true)}
    else if(event.key==='Home'){event.preventDefault();setActiveIndex(0);setOpen(true)}
    else if(event.key==='End'){event.preventDefault();setActiveIndex(Math.max(0,options.length-1));setOpen(true)}
  }
  const onOptionKey=(event:ReactKeyboardEvent<HTMLButtonElement>,index:number)=>{
    if(event.key==='ArrowDown'){event.preventDefault();move(1)}
    else if(event.key==='ArrowUp'){event.preventDefault();move(-1)}
    else if(event.key==='Home'){event.preventDefault();setActiveIndex(0)}
    else if(event.key==='End'){event.preventDefault();setActiveIndex(Math.max(0,options.length-1))}
    else if(event.key==='Escape'){event.preventDefault();setOpen(false);rootRef.current?.querySelector<HTMLButtonElement>('.custom-select-trigger')?.focus()}
    else if(event.key==='Tab'){setOpen(false)}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(options[index].value)}
  }
  return <div ref={rootRef} className={`custom-select ${open?'open':''} ${isDisabled?'disabled':''} ${className}`}>
    <button type="button" className="custom-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined} disabled={isDisabled} onClick={()=>setOpen(v=>!v)} onKeyDown={onTriggerKey}>
      <span className={!selected?'placeholder':''}>{selected?.label||placeholder}</span><ChevronDown aria-hidden="true"/>
    </button>
    {open&&<div id={listId} className="custom-select-menu" role="listbox" aria-label={ariaLabel}>
      {options.map((option,index)=><button key={option.value} ref={node=>{optionRefs.current[index]=node}} type="button" role="option" aria-selected={option.value===value} className={`custom-select-option ${option.value===value?'selected':''}`} tabIndex={index===activeIndex?0:-1} onMouseEnter={()=>setActiveIndex(index)} onKeyDown={event=>onOptionKey(event,index)} onClick={()=>choose(option.value)}>
        <span><b>{option.label}</b>{option.description&&<small>{option.description}</small>}</span>{option.value===value&&<Check aria-hidden="true"/>}
      </button>)}
    </div>}
  </div>
}

export const riskTone=(risk:string)=>risk==='High Risk'||risk==='Urgent Review'?'danger':risk==='Needs Review'||risk==='Attention'||risk==='Overdue'?'warning':risk==='Stable'||risk==='Connected'||risk==='Completed'||risk==='Resolved'?'success':'info'
export function Badge({children,tone}:{children:ReactNode;tone?:string}){return <span className={`badge ${tone||riskTone(String(children))}`}>{children}</span>}
export function PageHeader({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:ReactNode}){return <header className="page-header"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="header-actions">{actions}</div>}</header>}
export function Card({children,className='',title,action}:{children:ReactNode;className?:string;title?:string;action?:ReactNode}){return <section className={`card ${className}`}>{title&&<div className="card-head"><h2>{title}</h2>{action}</div>}{children}</section>}
export function Metric({label,value,note,tone='pine'}:{label:string;value:string|number;note?:string;tone?:string}){return <Card className="metric"><div className={`metric-icon ${tone}`}>{tone==='danger'?<AlertTriangle/>:tone==='warning'?<Clock3/>:tone==='success'?<CheckCircle2/>:<Radio/>}</div><div><span>{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div></Card>}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const node=ref.current;const focusable=()=>Array.from(node?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')||[]);focusable()[0]?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();if(event.key==='Tab'){const items=focusable();if(!items.length)return;const first=items[0],last=items.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()}},[onClose]);return <div className="overlay" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div ref={ref} className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="eyebrow">VIRTUALWARD WORKFLOW</div><h2 id="modal-title">{title}</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog"><X/></button></div>{children}</div></div>}
export function Empty({title='Nothing needs attention',detail='There are no items in this view.',icon='check'}:{title?:string;detail?:string;icon?:'check'|'patient'|'reading'|'alert'|'device'|'escalation'|'medication'}){const Icon=useMemo(()=>icon==='patient'?Radio:icon==='reading'?Activity:icon==='alert'?AlertTriangle:icon==='device'?WifiOff:icon==='escalation'?Clock3:icon==='medication'?FileWarning:CheckCircle2,[icon]);return <div className="empty" role="status" aria-live="polite"><Icon/><strong>{title}</strong><span>{detail}</span></div>}
export function Connectivity({online=true}:{online?:boolean}){return <span className={`connectivity ${online?'online':'offline'}`}>{online?<Radio/>:<WifiOff/>}{online?'Live monitoring':'Connection issue'}</span>}
export function Segmented({items,value,onChange}:{items:string[];value:string;onChange:(v:string)=>void}){return <div className="segmented" role="group">{items.map(i=><button type="button" key={i} aria-pressed={i===value} className={i===value?'active':''} onClick={()=>onChange(i)}>{i}</button>)}</div>}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
export const riskText=(risk:Risk)=>risk==='Stable'?'Recent monitoring is within the demo baseline.':risk==='Needs Review'?'A monitoring signal requires clinical review.':'High-priority monitoring review is required.'

export type LoadingKind='device'|'observation'|'trend'|'risk'|'summary'
const loadingMeta:Record<LoadingKind,{label:string;icon:typeof Loader2}>=({device:{label:'Connecting device…',icon:WifiOff},observation:{label:'Receiving observation…',icon:Activity},trend:{label:'Analyzing monitoring trend…',icon:BrainCircuit},risk:{label:'Updating risk…',icon:RefreshCw},summary:{label:'Generating patient summary…',icon:BrainCircuit}})
export function LoadingState({kind='observation',label}:{kind?:LoadingKind;label?:string}){const m=loadingMeta[kind];const Icon=m.icon;return <div className="loading-state" role="status" aria-live="polite" aria-busy="true"><span className="loading-spin"><Loader2/></span><strong>{label||m.label}</strong></div>}

export type ErrorKind='device-unavailable'|'reading-invalid'|'missing-patient'|'no-plan'|'no-readings'|'sync-failed'|'alert-resolved'|'review-completed'|'patient-discharged'|'no-clinician'
const errorMeta:Record<ErrorKind,{title:string;detail:string}>=({
'device-unavailable':{title:'Device unavailable',detail:'The monitoring device is currently not reachable. Try the demo reconnection action or assign a replacement device.'},
'reading-invalid':{title:'Reading invalid',detail:'The submitted observation value is not within the expected range for this demo monitoring type. Re-enter a valid positive value.'},
'missing-patient':{title:'Missing patient',detail:'The requested synthetic patient record is unavailable or has been discharged. Return to the active patients list.'},
'no-plan':{title:'No monitoring plan',detail:'No care plan is currently assigned. Enrol the patient in Virtual Ward or assign a pathway-specific monitoring plan first.'},
'no-readings':{title:'No recent readings',detail:'Expected observations have not been received within the synthetic grace period. Check device connectivity or submit a manual reading.'},
'sync-failed':{title:'Unable to simulate sync',detail:'The device-sync simulation did not complete. Reset the demo scenario and try the device workflow again.'},
'alert-resolved':{title:'Alert already resolved',detail:'This clinical alert was already resolved by a care-team member. The recorded resolution is preserved in the audit trail.'},
'review-completed':{title:'Review already completed',detail:'This clinical review was already recorded. A new review can be created from the patient workspace if further assessment is required.'},
'patient-discharged':{title:'Patient already discharged',detail:'This Virtual Ward episode is complete. Devices have been released and the patient is no longer in the active cohort.'},
'no-clinician':{title:'No clinician assigned',detail:'An assigned nurse or consultant is required before this workflow action can be recorded.'}
})
export function ErrorState({kind,title,detail,onRetry,retryLabel='Retry action'}:{kind?:ErrorKind;title?:string;detail?:string;onRetry?:()=>void;retryLabel?:string}){const m=kind?errorMeta[kind]:undefined;return <div className="error-state" role="alert" aria-live="assertive"><AlertTriangle/><strong>{title||m?.title||'Action unavailable'}</strong><span>{detail||m?.detail||'The requested action could not be completed in the current demo state.'}</span>{onRetry&&<button type="button" className="btn" onClick={onRetry}>{retryLabel}</button>}</div>}
