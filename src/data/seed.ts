import type { Alert, AuditEvent, CarePlan, CareTeamMember, Consultation, Device, DischargeRecord, DocumentRecord, Integration, Medication, Message, Observation, Patient, Review, Task, ThresholdConfig, TimelineEvent } from '../types/domain'

const now = new Date('2026-08-14T13:30:00').toISOString()
const ago = (minutes:number) => new Date(new Date(now).getTime()-minutes*60000).toISOString()

export const patients:Patient[] = [
  {id:'PT-20284',episodeId:'VW-2026-0418',name:'Margaret Ellis',age:72,pathway:'COPD',condition:'COPD recovery monitoring',startDate:'2026-08-09',expectedEndDate:'2026-08-23',day:6,risk:'Stable',monitoringStatus:'Active',nurse:'Rebecca Morgan',consultant:'Dr. James Howard',lastContact:ago(160),nextReview:'Today, 15:00',adherence:92,deviceIds:['OX-40812','TH-10211'],symptoms:[],summary:'Day 6 of COPD virtual monitoring. Current observations are within the demo baseline.',patientContact:'margaret.ellis@example.demo',emergencyContact:'Peter Ellis · 07000 100201',monitoringPlanName:'COPD standard demo plan'},
  {id:'PT-20162',episodeId:'VW-2026-0402',name:'Arthur Collins',age:68,pathway:'Heart Failure',condition:'Heart failure follow-up',startDate:'2026-08-07',expectedEndDate:'2026-08-21',day:8,risk:'Needs Review',monitoringStatus:'Needs Attention',nurse:'Rebecca Morgan',consultant:'Dr. James Howard',lastContact:ago(75),nextReview:'Today, 14:30',adherence:96,deviceIds:['SC-30108','BP-20814'],symptoms:['Mild ankle swelling'],summary:'Weight has increased over the monitoring window. Clinical review is recommended.',patientContact:'arthur.collins@example.demo',emergencyContact:'Helen Collins · 07000 100202',monitoringPlanName:'Heart Failure standard demo plan'},
  {id:'PT-20301',episodeId:'VW-2026-0424',name:'Daniel Morris',age:59,pathway:'Diabetes',condition:'Type 2 diabetes monitoring',startDate:'2026-08-11',expectedEndDate:'2026-08-25',day:4,risk:'Needs Review',monitoringStatus:'Needs Attention',nurse:'Aisha Khan',consultant:'Dr. Leila Grant',lastContact:ago(210),nextReview:'Today, 16:00',adherence:72,deviceIds:['GL-55120'],symptoms:[],summary:'Repeated elevated demo glucose readings and missed medication confirmations require review.',patientContact:'daniel.morris@example.demo',emergencyContact:'Sam Morris · 07000 100203',monitoringPlanName:'Diabetes standard demo plan'},
  {id:'PT-20412',episodeId:'VW-2026-0430',name:'Sophia Bennett',age:45,pathway:'Post-operative',condition:'Post-operative recovery',startDate:'2026-08-12',expectedEndDate:'2026-08-19',day:3,risk:'High Risk',monitoringStatus:'Needs Attention',nurse:'Nina Patel',consultant:'Dr. James Howard',lastContact:ago(25),nextReview:'Overdue',adherence:100,deviceIds:['TH-10992','WR-70018'],symptoms:['Moderate pain'],summary:'Temperature and pain check-in have increased. High-priority monitoring review is required.',patientContact:'sophia.bennett@example.demo',emergencyContact:'Alex Bennett · 07000 100204',monitoringPlanName:'Post-operative standard demo plan'},
  {id:'PT-20091',episodeId:'VW-2026-0391',name:'Robert Hayes',age:64,pathway:'Hypertension',condition:'Hypertension monitoring',startDate:'2026-08-05',expectedEndDate:'2026-08-19',day:10,risk:'Stable',monitoringStatus:'Active',nurse:'Aisha Khan',consultant:'Dr. Leila Grant',lastContact:ago(320),nextReview:'Tomorrow, 09:30',adherence:98,deviceIds:['BP-20920'],symptoms:[],summary:'Blood-pressure observations remain under routine review.',patientContact:'robert.hayes@example.demo',emergencyContact:'Anne Hayes · 07000 100205',monitoringPlanName:'Hypertension standard demo plan'},
  {id:'PT-20425',episodeId:'VW-2026-0438',name:'Emily Watson',age:52,pathway:'Post-operative',condition:'Orthopaedic recovery',startDate:'2026-08-13',expectedEndDate:'2026-08-20',day:2,risk:'Stable',monitoringStatus:'Active',nurse:'Nina Patel',consultant:'Dr. James Howard',lastContact:ago(55),nextReview:'Tomorrow, 11:00',adherence:100,deviceIds:['TH-11102'],symptoms:[],summary:'Stable post-operative monitoring with all planned readings complete.',patientContact:'emily.watson@example.demo',emergencyContact:'Chris Watson · 07000 100206',monitoringPlanName:'Post-operative standard demo plan'}
]

const obs=(id:string,patientId:string,type:Observation['type'],value:number,unit:string,minutes:number,source:string,deviceId?:string,status:Observation['status']='Normal',secondaryValue?:number):Observation=>({id,patientId,type,value,secondaryValue,unit,timestamp:ago(minutes),source,deviceId,status})
export const observations:Observation[] = [
  obs('o1','PT-20284','SpO2',97,'%',360,'Pulse Oximeter','OX-40812'),obs('o2','PT-20284','SpO2',97,'%',180,'Pulse Oximeter','OX-40812'),obs('o3','PT-20284','Heart Rate',78,'bpm',12,'Pulse Oximeter','OX-40812'),obs('o4','PT-20284','SpO2',97,'%',12,'Pulse Oximeter','OX-40812'),obs('o5','PT-20284','Temperature',37.2,'°C',80,'Thermometer','TH-10211'),
  obs('o6','PT-20162','Weight',78.4,'kg',4320,'Weight Scale','SC-30108'),obs('o7','PT-20162','Weight',78.8,'kg',2880,'Weight Scale','SC-30108'),obs('o8','PT-20162','Weight',79.3,'kg',1440,'Weight Scale','SC-30108','Attention'),obs('o9','PT-20162','Blood Pressure',142,'mmHg',45,'BP Monitor','BP-20814','Attention',88),
  obs('o10','PT-20301','Glucose',12.1,'mmol/L',90,'Glucose Monitor','GL-55120','Attention'),obs('o11','PT-20301','Glucose',11.4,'mmol/L',520,'Glucose Monitor','GL-55120','Attention'),
  obs('o12','PT-20412','Temperature',38.1,'°C',35,'Thermometer','TH-10992','High'),obs('o13','PT-20412','Pain',7,'/10',30,'Patient check-in',undefined,'High'),
  obs('o14','PT-20091','Blood Pressure',138,'mmHg',140,'BP Monitor','BP-20920','Normal',84),obs('o15','PT-20425','Temperature',36.9,'°C',65,'Thermometer','TH-11102')
]

export const devices:Device[] = [
  ['OX-40812','Pulse Oximeter','PT-20284','Connected',82],['TH-10211','Thermometer','PT-20284','Connected',76],['SC-30108','Weight Scale','PT-20162','Connected',64],['BP-20814','BP Monitor','PT-20162','Connected',49],['GL-55120','Glucose Monitor','PT-20301','Low Battery',18],['TH-10992','Thermometer','PT-20412','Connected',71],['WR-70018','Wearable','PT-20412','Offline',42],['BP-20920','BP Monitor','PT-20091','Connected',88],['TH-11102','Thermometer','PT-20425','Connected',93],['OX-40900','Pulse Oximeter',undefined,'Not Assigned',100]
].map((d,i)=>({id:d[0] as string,type:d[1] as string,patientId:d[2] as string|undefined,status:d[3] as Device['status'],battery:d[4] as number,lastSync:ago(10+i*8),serialDemoId:`DEMO-${String(4000+i)}`,connectionHistory:[{time:ago(180),event:'Device connected'},{time:ago(10+i*8),event:'Reading received'}]}))

export const alerts:Alert[] = [
  {id:'ALT-1001',patientId:'PT-20412',type:'Vital Trend',priority:'Urgent Review',trigger:'Temperature and pain trend require review',evidence:['Temperature 38.1°C','Pain reported 7/10'],createdAt:ago(28),assignedTo:'Nina Patel',status:'Needs Review'},
  {id:'ALT-1002',patientId:'PT-20301',type:'Medication Adherence',priority:'Attention',trigger:'Two medication confirmations missed',evidence:['Morning dose missed — 12 Aug','Evening dose missed — 13 Aug'],createdAt:ago(95),assignedTo:'Aisha Khan',status:'Acknowledged',acknowledgedAt:ago(80)},
  {id:'ALT-1003',patientId:'PT-20412',type:'Device Offline',priority:'Attention',trigger:'Wearable has not synced',evidence:['Last sync more than 4 hours ago'],createdAt:ago(120),assignedTo:'Remote Care Team',status:'Needs Review'}
]

export const tasks:Task[] = patients.flatMap((p,i)=>[
  {id:`T-${i}-1`,patientId:p.id,title:p.pathway==='COPD'?'Morning SpO2 reading':p.pathway==='Heart Failure'?'Daily weight':'Daily observation',due:'Today, 09:00',status:i===3?'Overdue':'Completed',required:true,category:'Observation'} as Task,
  {id:`T-${i}-2`,patientId:p.id,title:'Daily patient check-in',due:'Today, 18:00',status:'Upcoming',required:true,category:'Check-in'} as Task
])
export const medications:Medication[] = [
  {id:'M1',patientId:'PT-20284',name:'Demo maintenance medication',schedule:'08:00 and 20:00',today:'Taken',history:['Taken','Taken','Late','Taken','Taken']},
  {id:'M2',patientId:'PT-20301',name:'Demo diabetes medication',schedule:'With breakfast',today:'Missed',history:['Taken','Missed','Taken','Missed','Unconfirmed']},
  {id:'M3',patientId:'PT-20162',name:'Demo scheduled medication',schedule:'08:00 daily',today:'Taken',history:['Taken','Taken','Taken','Taken','Taken']}
]
export const carePlans:CarePlan[] = patients.map(p=>({patientId:p.id,pathway:p.pathway,goals:['Complete scheduled remote observations','Maintain contact with the virtual ward team'],observations:p.pathway==='COPD'?[{type:'SpO2',frequency:'3 times daily'},{type:'Heart Rate',frequency:'3 times daily'},{type:'Temperature',frequency:'Daily'}]:p.pathway==='Heart Failure'?[{type:'Weight',frequency:'Daily'},{type:'Blood Pressure',frequency:'Twice daily'},{type:'Heart Rate',frequency:'Daily'}]:p.pathway==='Diabetes'?[{type:'Glucose',frequency:'3 times daily'}]:p.pathway==='Post-operative'?[{type:'Temperature',frequency:'Daily'},{type:'Pain',frequency:'Daily'},{type:'Mobility',frequency:'Daily'}]:[{type:'Blood Pressure',frequency:'Twice daily'}],notes:'Synthetic demonstration plan. Clinician decision required for all changes.',nextReview:p.nextReview,status:'Active',medicationTasks:['Confirm scheduled medication adherence'],checkIns:['Daily symptom check-in'],reviews:['Nurse review as scheduled','Consultant review when escalated'],educationTasks:['Remote monitoring education'],escalationInstructions:'Review evidence, contact patient and escalate to the assigned consultant when clinical review is required.',assignedTeam:{nurse:p.nurse,consultant:p.consultant},startDate:p.startDate,expectedEndDate:p.expectedEndDate,planName:p.monitoringPlanName}))
export const timeline:TimelineEvent[] = patients.flatMap((p,i)=>[{id:`EV-${i}-1`,patientId:p.id,time:p.startDate+'T09:00:00',type:'Enrolment',title:'Enrolled in Virtual Ward',detail:`${p.pathway} monitoring plan assigned`,actor:'Remote Care Team'},{id:`EV-${i}-2`,patientId:p.id,time:ago(60+i*15),type:'Observation',title:'Observation received',detail:'Scheduled remote reading recorded',actor:'Connected device'}])
export const reviews:Review[] = [{id:'REV-1',patientId:'PT-20301',type:'Nurse',reason:'Medication adherence concern',notes:'Review in progress.',disposition:'Contact patient',status:'Open',createdAt:ago(70)}]
export const consultations:Consultation[] = [{id:'CON-1',patientId:'PT-20162',status:'Scheduled',scheduledAt:'2026-08-14T15:30:00',participants:['Arthur Collins','Rebecca Morgan'],notes:''}]
export const messages:Message[] = [{id:'MSG-1',patientId:'PT-20284',channel:'App',sender:'Rebecca Morgan',body:'Please remember your afternoon oxygen reading.',time:ago(90),status:'Read',response:'I will complete it shortly.'}]


export const thresholdConfigs:ThresholdConfig[] = [
  {id:'THR-COPD-SPO2',pathway:'COPD',type:'SpO2',attentionRule:'Demo review signal at or below 94%',highRule:'Demo high-priority signal at or below 92%',note:'Illustrative demo threshold only; not a validated clinical protocol.'},
  {id:'THR-HTN-BP',pathway:'Hypertension',type:'Blood Pressure',attentionRule:'Demo review signal at systolic 150 mmHg or above',highRule:'No autonomous emergency threshold in this demo',note:'Illustrative demo threshold only; clinician review required.'},
  {id:'THR-DM-GLU',pathway:'Diabetes',type:'Glucose',attentionRule:'Demo review signal at 11 mmol/L or above',highRule:'Demo high-priority signal at 14 mmol/L or above',note:'Illustrative demo threshold only; not validated for clinical use.'},
  {id:'THR-POST-TEMP',pathway:'Post-operative',type:'Temperature',attentionRule:'Trend and symptom context reviewed together',highRule:'Demo high-priority signal at 38°C or above',note:'Illustrative demo threshold only; no diagnosis is made.'},
  {id:'THR-HF-WEIGHT',pathway:'Heart Failure',type:'Weight',attentionRule:'Repeated upward synthetic trend prompts review',highRule:'No standalone diagnostic threshold',note:'Trend prioritization only; clinical decision required.'},
]

export const careTeam:CareTeamMember[] = [
  {id:'CT-001',name:'Rebecca Morgan',role:'Virtual Ward Nurse',specialty:'Remote Care Nursing',status:'On duty'},
  {id:'CT-002',name:'Aisha Khan',role:'Virtual Ward Nurse',specialty:'Chronic Disease Nursing',status:'Available'},
  {id:'CT-003',name:'Nina Patel',role:'Virtual Ward Nurse',specialty:'Post-acute Care',status:'Available'},
  {id:'CT-004',name:'Dr. James Howard',role:'Consultant Physician',specialty:'Respiratory / Virtual Care',status:'On duty'},
  {id:'CT-005',name:'Dr. Leila Grant',role:'Consultant Physician',specialty:'General Medicine',status:'Available'},
  {id:'CT-006',name:'Clinical Pharmacist',role:'Pharmacist',specialty:'Medication Adherence',status:'Demo only'},
  {id:'CT-007',name:'Remote Care Coordinator',role:'Remote Care Coordinator',specialty:'Devices & Coordination',status:'On duty'},
]

export const integrations:Integration[] = [
  {id:'INT-EHR',name:'EHR',type:'Clinical Record',status:'Demo Connected',protocol:'FHIR R4',lastSync:ago(3),domains:['Patient','Encounter','CarePlan']},
  {id:'INT-FHIR',name:'FHIR Gateway',type:'Interoperability',status:'Simulation',protocol:'FHIR R4',lastSync:ago(5),domains:['Patient','Observation','Task','Provenance']},
  {id:'INT-APP',name:'Patient App',type:'Patient Engagement',status:'Demo Connected',protocol:'REST Demo',lastSync:ago(2),domains:['Communication','QuestionnaireResponse']},
  {id:'INT-DEV',name:'Connected Devices',type:'Remote Monitoring',status:'Demo Connected',protocol:'Device Gateway Demo',lastSync:ago(1),domains:['Device','Observation']},
  {id:'INT-PHARM',name:'Pharmacy',type:'Medication',status:'Simulation',protocol:'FHIR Demo',lastSync:ago(20),domains:['MedicationStatement']},
  {id:'INT-VC',name:'Virtual Consultation',type:'Telehealth',status:'Simulation',protocol:'Session Demo',lastSync:ago(15),domains:['Encounter','Task']},
  {id:'INT-IDP',name:'Identity Provider',type:'Identity',status:'Demo Connected',protocol:'OIDC Demo',lastSync:ago(30),domains:['Practitioner','User']},
]

export const documents:DocumentRecord[] = [
  {id:'DOC-1',patientId:'PT-20284',title:'Virtual Ward enrolment summary',type:'Enrolment Summary',author:'Rebecca Morgan',createdAt:ago(7200),source:'VirtualWard AI Demo',summary:'Synthetic COPD virtual ward enrolment and monitoring-plan summary.'},
  {id:'DOC-2',patientId:'PT-20162',title:'Remote review note',type:'Clinical Note',author:'Rebecca Morgan',createdAt:ago(180),source:'VirtualWard AI Demo',summary:'Synthetic remote-care note documenting recent weight trend and follow-up.'},
]

export const dischargeRecords:DischargeRecord[] = []

export const audits:AuditEvent[] = [{id:'AUD-1',time:ago(28),user:'VirtualWard AI',role:'Administrator',patientId:'PT-20412',action:'AI-assisted risk signal changed',previousState:'Needs Review',newState:'High Risk — requires clinical review'}]

export const seedState = { patients, observations, devices, alerts, tasks, medications, carePlans, timeline, reviews, consultations, messages, integrations, documents, dischargeRecords, thresholdConfigs, careTeam, audits }
