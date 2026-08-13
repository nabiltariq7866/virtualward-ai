# VirtualWard AI — Complete Frontend Product Demo Master Prompt

You are a Senior Frontend Engineer, Healthcare Product Architect, Remote Patient Monitoring Specialist, Hospital-at-Home Workflow Designer, Clinical Safety UX Designer, Data Visualization Engineer, and Enterprise Healthcare SaaS Product Designer.

Your task is to build a polished portfolio product called:

# VirtualWard AI
## Hospital-at-Home & Remote Patient Monitoring

VirtualWard AI is an interactive healthcare product demo showing how appropriate patients could be monitored safely outside the hospital using connected-device data, remote-care workflows, AI-assisted trend detection, risk prioritization, medication-adherence monitoring, clinical alerts, virtual reviews and coordinated escalation.

The product should demonstrate how a healthcare organization could manage a virtual ward containing patients recovering or being monitored at home while maintaining visibility over:

- Vital signs
- Device connectivity
- Monitoring schedules
- Patient-reported symptoms
- Medication adherence
- Abnormal trends
- Deterioration risk
- Readmission risk
- Clinical alerts
- Nurse reviews
- Doctor reviews
- Escalations
- Virtual consultations
- Care-plan tasks
- Patient outcomes

This product will be shown to prospective healthcare clients.

It must therefore feel like a real enterprise remote-care platform.

It must NOT feel like:

- a static dashboard,
- a generic admin template,
- a fitness tracker,
- a consumer wearable app,
- a simple vitals chart,
- a Dribbble concept,
- or a fake AI chatbot.

---

# 1. READ EVERYTHING BEFORE CODING

Before implementing anything:

1. Read all provided reference documents.
2. Inspect the entire current codebase.
3. Review:
   - package.json
   - existing routing
   - global styles
   - components
   - design system
   - state management
   - tests
   - charts
   - tables
   - forms
   - mock data
   - utilities
4. Understand what already exists.
5. Reuse good implementation.
6. Refactor instead of duplicating.
7. Do not install duplicate libraries unnecessarily.
8. Understand all VirtualWard workflows before coding.
9. Do not build isolated mock screens.

If this is an empty repository, create a clean modular architecture.

---

# 2. PROJECT CONSTRAINT

THIS PROJECT IS FRONTEND ONLY.

Do NOT build:

- Django backend
- Node backend
- database server
- real medical-device integration
- real wearable integration
- real EHR API
- real FHIR server
- real SMS
- real telemedicine infrastructure
- real clinical AI
- real deterioration model
- real readmission model
- real medication system

All patients, readings, alerts and predictions must be synthetic.

However:

The application must behave like a functioning remote-care product.

Example:

Patient enrolled in Virtual Ward
→ monitoring plan assigned
→ connected devices appear
→ vitals update
→ SpO2 trend declines
→ AI flags abnormal trend
→ patient moves from Stable to Needs Review
→ nurse receives alert
→ nurse reviews patient timeline
→ nurse contacts patient
→ doctor escalation created
→ intervention recorded
→ monitoring plan updated
→ risk state changes.

All of those actions must work through shared frontend state.

---

# 3. PRODUCT PRINCIPLE

VirtualWard AI is NOT an autonomous diagnostic system.

AI may:

- detect abnormal trends,
- identify missing readings,
- identify unusual changes,
- suggest deterioration risk,
- prioritize patients for review,
- identify medication-adherence concerns,
- highlight readmission-risk indicators,
- summarize monitoring history,
- recommend administrative or clinical review.

AI must NOT:

- make final diagnoses,
- prescribe medication,
- change medication,
- automatically send a patient to emergency care,
- automatically discharge a patient,
- override a clinician,
- make irreversible clinical decisions.

Always use:

AI-assisted monitoring

AI-generated risk signal

Requires clinical review

Potential deterioration pattern

Clinician decision required

---

# 4. PRIMARY PRODUCT FLOW

The main workflow is:

Patient
↓
Home / Care Facility
↓
Connected Devices
↓
Blood Pressure
Heart Rate
SpO2
Temperature
Weight
Glucose
Wearables
↓
Remote Monitoring Data
↓
AI Layer
↓
Abnormal Trend Detection
Deterioration Detection
Readmission Risk
Medication Adherence
Personalized Monitoring
↓
Risk Classification
↓
Stable / Needs Attention / High Risk
↓
Clinical Alert
↓
Nurse Review
↓
Doctor Review if required
↓
Action / Escalation
↓
Continue Virtual Care or Transition

This workflow must function end-to-end.

---

# 5. SUPPORTED DEMO CARE PATHWAYS

Seed realistic fictional patients across:

- Heart failure
- COPD
- Hypertension
- Diabetes
- Post-operative recovery

Do not implement validated medical protocols.

These care pathways exist only to provide realistic demo scenarios.

---

# 6. RECOMMENDED TECH STACK

Use:

- React
- TypeScript
- Vite
- React Router
- Zustand
- localStorage / IndexedDB
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack Table
- Recharts
- Lucide React
- Sonner
- date-fns
- Framer Motion only where useful

If equivalent libraries already exist, reuse them.

---

# 7. COMPLETELY UNIQUE VISUAL IDENTITY

Do NOT reuse the themes from:

CareOps AI

Clinician Copilot AI

SmartReferral AI

MedSafe AI

VirtualWard AI should feel like:

A calm live clinical monitoring environment.

It should visually communicate:

Connection
Continuity
Remote care
Live telemetry
Stability
Escalation
Home-based healthcare
Clinical oversight

The product should feel modern and technical without becoming cyberpunk.

---

# 8. VIRTUALWARD COLOR SYSTEM

Use a distinctive remote-care palette.

## Primary Deep Pine
#173E3C

Use for:

- sidebar
- strong navigation
- main headings
- primary structural elements

## Digital Mint
#43B99F

Use for:

- connected devices
- live readings
- active monitoring
- successful communication

## Remote-Care Sky
#679BC3

Use for:

- virtual consultations
- informational charts
- communication
- device telemetry

## Signal Amber
#D79A3D

Use for:

- needs attention
- missing readings
- monitoring concern

## High-Risk Coral
#D0605D

Use for:

- high-risk patient states
- serious alerts

## App Background
#F4F8F6

## Main Surface
#FFFFFF

## Secondary Surface
#EDF4F1

## Border
#D7E3DE

## Main Text
#20302E

## Secondary Text
#697A76

## AI Accent
#596FC4

## AI Background
#EFF1FC

## Stable Background
#EAF7F2

## Monitoring Background
#EEF5FA

Use AI blue only for AI-related outputs.

Do not make this a blue hospital dashboard.

---

# 9. COLOR DISTRIBUTION

Approximately:

75% soft neutral / white

15% deep pine / structural tones

10% semantic monitoring colors

Stable patients should not turn the entire screen green.

Use restrained semantic indicators.

---

# 10. UI EXPERIENCE

The product should combine:

Live monitoring command centre

+

Patient remote-care workspace

+

Clinical alert workflow

+

Virtual-care coordination

Do not make every page a dashboard.

---

# 11. TYPOGRAPHY

Use:

Inter

or an equivalent clean healthcare enterprise font.

Recommended:

Page Title:
27–30px

Patient Name:
20–24px

Section:
18px

Body:
14px

Table:
13–14px

Vitals:
24–30px

Metadata:
12–13px

Alert heading:
15–17px

---

# 12. APPLICATION SHELL

Suggested sidebar:

VIRTUALWARD AI

OVERVIEW
- Virtual Ward

PATIENTS
- Active Patients
- Patient Monitoring
- Enrolments

MONITORING
- Live Observations
- Alerts
- Missing Readings

CARE MANAGEMENT
- Care Plans
- Medication Adherence
- Tasks

CLINICAL
- Nurse Reviews
- Doctor Escalations
- Virtual Consultations

INTELLIGENCE
- AI Insights
- Risk Overview
- Population Trends

SYSTEM
- Devices
- Integrations
- Audit Trail
- Settings

---

# 13. TOP BAR

Include:

Facility / Virtual Ward selector

Global patient search

Live connectivity indicator

Alerts

Notifications

Current clinician

Demo Environment

Example:

Northbridge Virtual Care Service

Live Monitoring:
38 patients connected

User:

Rebecca Morgan
Virtual Ward Nurse

---

# 14. ROLE SIMULATION

Support:

Virtual Ward Nurse

Consultant Physician

Remote Care Coordinator

Pharmacist

Operations Manager

Administrator

Patient / Caregiver demo mode

Permissions should affect actions.

---

# 15. DEMO DATA

Create realistic synthetic data for:

Patients

Care pathways

Conditions

Vital readings

Monitoring plans

Threshold configurations

Devices

Device connectivity

Medication schedules

Medication adherence

Patient symptoms

Care tasks

Alerts

Clinical reviews

Escalations

Virtual consultations

Notes

Messages

Care coordinators

Clinicians

AI insights

Audit events

---

# 16. SHARED STATE

Use centralized state.

Suggested:

patientStore

monitoringStore

deviceStore

alertStore

carePlanStore

medicationStore

taskStore

reviewStore

consultationStore

auditStore

All screens must use the same state.

---

# 17. DEMO RESET

Settings
→ Demo Controls
→ Reset Demo Data

Restore original seeded state.

---

# 18. VIRTUAL WARD COMMAND CENTRE

This should be a highly impressive first screen.

Title:

Virtual Ward

Subtitle:

Real-time overview of remotely monitored patients, clinical alerts and care-plan activity.

---

# 19. TOP METRICS

Suggested:

Active Patients

Stable

Needs Review

High Risk

New Alerts

Missing Readings

Devices Offline

Reviews Due Today

Example:

Active Patients
124

Stable
96

Needs Review
19

High Risk
9

Devices Offline
4

---

# 20. LIVE PATIENT STATUS DISTRIBUTION

Show compact visualization:

Stable
Needs Attention
High Risk
Awaiting Reading
Escalated

Use counts derived from state.

---

# 21. PRIORITY PATIENTS

Create:

Patients Requiring Attention

Example:

Margaret Ellis

COPD

SpO2 trend declining

Risk:
High

Last Reading:
12 minutes ago

Action:
Review

---

# 22. AI OPERATING INSIGHT

Example:

AI Monitoring Insight

5 patients have developed abnormal trends since the previous review cycle.

Primary signals:

Declining SpO2
Rapid weight change
Persistent elevated BP
Repeated missed glucose readings

Recommended Action:

Review high-priority patients.

Label:

AI-generated operational insight.

Not a clinical diagnosis.

---

# 23. ACTIVE PATIENTS PAGE

Build a rich professional table.

Columns:

Patient

Care Pathway

Day in Virtual Ward

Current Risk

Latest Vitals

Adherence

Device Status

Last Contact

Next Review

Actions

---

# 24. FILTERS

Functional filters:

Care pathway

Risk

Monitoring status

Device connectivity

Medication adherence

Review due

Length of stay

Clinician

---

# 25. PATIENT ENROLMENT

Button:

+ Enrol Patient

Open large modal.

Fields:

Patient Details

Care Pathway

Primary Condition

Virtual Ward Start Date

Expected Monitoring Duration

Assigned Clinician

Assigned Nurse

Monitoring Plan

Devices

Patient Contact

Emergency Contact

---

# 26. ENROLMENT WORKFLOW

On enrolment:

Create patient record

Assign monitoring plan

Assign devices

Create care tasks

Set risk baseline

Create timeline event

Update dashboard count

Show:

Patient enrolled in Virtual Ward.

---

# 27. PATIENT DETAIL PAGE

Patient detail is a major screen.

Header:

Patient

Age

Patient ID

Care Pathway

Day in Virtual Ward

Current Risk

Assigned Nurse

Assigned Consultant

---

# 28. PATIENT DETAIL TABS

Overview

Live Monitoring

Trends

Care Plan

Medications

Alerts

Reviews

Virtual Visits

Timeline

Documents

---

# 29. PATIENT OVERVIEW

Show:

Current status

Latest observations

Current AI risk signal

Care pathway

Monitoring schedule

Medication adherence

Open tasks

Upcoming review

Device status

Recent clinical contact

---

# 30. LATEST VITALS

Create premium compact vital cards.

Examples:

Heart Rate
78 bpm

SpO2
94%

Blood Pressure
138/86

Temperature
37.2°C

Weight
72.4 kg

Glucose
7.8 mmol/L

Each card:

latest value

last reading

trend direction

device source

status

---

# 31. TREND ARROWS

Use:

Stable

Rising

Falling

Irregular

Do not use arrows alone.

Always include text.

---

# 32. LIVE MONITORING

Create live-feel observation screen.

Show:

Real-time synthetic readings

Recent readings

Expected readings

Missing readings

Device source

---

# 33. SIMULATED REAL-TIME DATA

Provide optional:

Start Live Demo

This can simulate deterministic incoming readings.

Example:

Every few seconds:

new reading appears.

Do not use uncontrolled random values.

Use predefined demo sequences.

---

# 34. LIVE DEMO CONTROL

Settings or toolbar:

Play Monitoring Scenario

Pause

Reset Scenario

Available scenarios:

Stable Monitoring

COPD Deterioration

Heart Failure Weight Change

Missed Medication

Device Disconnection

Post-operative Monitoring

---

# 35. TREND VISUALIZATION

Show charts for:

Heart rate

SpO2

Blood pressure

Temperature

Weight

Glucose

Use individual charts where appropriate.

Do not overcrowd one graph.

---

# 36. TIME RANGE

Allow:

6h

24h

3d

7d

14d

---

# 37. ABNORMAL TREND DETECTION

Create deterministic AI logic.

Example:

SpO2 readings:

97
96
95
94
92

AI signal:

Declining oxygen saturation trend detected.

Review recommended.

Do NOT say:

Patient is experiencing respiratory failure.

---

# 38. DETERIORATION RISK

Show:

Current Monitoring Risk

Low
Medium
High

Display:

Reason for risk signal

Example:

Risk increased because:

SpO2 has declined across consecutive readings.

Heart rate increased.

Patient reported increased breathlessness.

Label:

AI-assisted risk prioritization.

Requires clinician review.

---

# 39. RISK EXPLAINABILITY

Every AI risk state should show:

Why flagged?

Supporting readings

Trend window

Symptoms

Missing data

Recent events

Never use unexplained 86% risk numbers everywhere.

---

# 40. RISK HISTORY

Timeline:

08:00
Low

12:00
Moderate

14:30
High

Show contributing events.

---

# 41. READMISSION RISK

Display carefully:

Readmission Risk Signal

Low / Moderate / High

Factors:

Recent admission

Repeated alert events

Poor adherence

Unresolved symptoms

Use only fictional deterministic rules.

Label:

Demo risk model.

Not validated for clinical use.

---

# 42. ALERT CENTER

Create:

Clinical Alerts

Categories:

Vital Trend

High-Risk Monitoring

Missed Reading

Medication Adherence

Device Offline

Patient-Reported Symptom

Review Overdue

---

# 43. ALERT SEVERITY

Informational

Attention

High

Urgent Review

Avoid dramatic red everywhere.

---

# 44. ALERT TABLE

Columns:

Alert

Patient

Care Pathway

Trigger

Time

Priority

Assigned To

Status

Action

---

# 45. ALERT DETAIL DRAWER

Show:

Patient

Alert type

Supporting observations

AI explanation

Recent readings

Current care plan

Recent contact

Actions

---

# 46. ALERT ACTIONS

Acknowledge

Assign

Contact Patient

Create Nurse Review

Escalate to Doctor

Resolve

Dismiss where appropriate

---

# 47. ALERT WORKFLOW

Alert Generated
↓
Needs Review
↓
Nurse Acknowledges
↓
Patient Contacted
↓
Clinical Decision
↓
Resolved or Escalated

All transitions should update state.

---

# 48. NURSE REVIEW

Create:

Nurse Review

Fields:

Patient

Reason

Recent Observations

Symptoms

Medication Adherence

Review Notes

Disposition

---

# 49. REVIEW DISPOSITION

Continue Monitoring

Increase Monitoring

Schedule Virtual Review

Escalate to Doctor

Contact Caregiver

Other

Do not allow nurse AI to diagnose.

---

# 50. DOCTOR ESCALATION

Escalation includes:

Reason

Alert

Supporting readings

Nurse notes

Patient history

Current monitoring plan

---

# 51. DOCTOR ACTIONS

Review

Continue Virtual Care

Adjust Monitoring Plan

Schedule Virtual Consultation

Recommend External Assessment

Resolve Alert

Do not simulate prescribing.

---

# 52. VIRTUAL CONSULTATION

Create simulated virtual consultation feature.

Button:

Start Virtual Consultation

No real video required.

Show:

Patient card

Consultation status

Notes

Latest observations

Timer

Care-team participants

---

# 53. CONSULTATION DEMO

Allow:

Start Session

Add Notes

Create Task

Update Monitoring Plan

Complete Session

Timeline updates.

---

# 54. PATIENT-REPORTED SYMPTOMS

Allow patient/caregiver demo to submit:

Breathlessness

Dizziness

Fatigue

Pain

Nausea

Swelling

Other

Severity:

Mild
Moderate
Severe

This is synthetic.

---

# 55. PATIENT CHECK-IN

Patient portal-style check-in:

How are you feeling today?

Any new symptoms?

Did you take your medication?

Any device problem?

Submit.

---

# 56. MEDICATION ADHERENCE

Create:

Medication Adherence

Show:

Medication

Schedule

Taken

Missed

Late

Patient reported

---

# 57. ADHERENCE OVERVIEW

Metrics:

Today's Doses

Taken

Missed

Late

Unconfirmed

---

# 58. MISSED MEDICATION WORKFLOW

Scheduled dose
↓
Not confirmed
↓
Status = Missed
↓
AI/admin flag
↓
Nurse review
↓
Patient contacted
↓
Outcome recorded.

Do not adjust medication automatically.

---

# 59. ADHERENCE AI INSIGHT

Example:

Medication adherence concern

Three scheduled doses were unconfirmed during the past five days.

Suggested action:

Review adherence with patient.

Not:

Change medication.

---

# 60. CARE PLANS

Create:

Care Plan

Sections:

Monitoring Goals

Observation Schedule

Medication Tasks

Patient Check-ins

Clinical Reviews

Education Tasks

Escalation Instructions

---

# 61. MONITORING PLAN

Example COPD:

SpO2:
3 times daily

Heart Rate:
3 times daily

Temperature:
daily

Symptoms:
daily

Again:

Demo only.

---

# 62. PERSONALIZED MONITORING

Different seeded pathways should monitor different combinations.

Heart Failure:

Weight

BP

Heart Rate

Symptoms

COPD:

SpO2

Heart Rate

Temperature

Symptoms

Diabetes:

Glucose

Medication adherence

Symptoms

Post-operative:

Temperature

Pain

Activity

Wound-status check-in

---

# 63. CARE PLAN EDITING

Clinician can:

Modify schedule

Add task

Remove non-required observation

Change review date

Update care notes

All demo state.

---

# 64. CARE TASKS

Create:

Tasks

Examples:

Morning SpO2 reading

Daily weight

Medication confirmation

Nurse call

Virtual consultation

Follow-up questionnaire

---

# 65. TASK STATUS

Upcoming

Due

Completed

Missed

Overdue

Cancelled

---

# 66. MISSING READINGS

Create page:

Missing Readings

Show:

Patient

Expected Reading

Due

Overdue Duration

Device Status

Risk

Action

---

# 67. MISSING READING WORKFLOW

Reading expected
↓
Not received
↓
Grace period passes
↓
Missing Reading alert
↓
Check device
↓
Contact patient
↓
Record resolved reason.

---

# 68. DEVICE MANAGEMENT

Create:

Devices

Support fictional:

BP Monitor

Pulse Oximeter

Thermometer

Weight Scale

Glucose Monitor

Wearable

---

# 69. DEVICE TABLE

Device ID

Type

Patient

Connection

Battery

Last Sync

Assigned

Status

---

# 70. DEVICE STATUS

Connected

Syncing

Offline

Low Battery

Not Assigned

Needs Attention

---

# 71. DEVICE DETAIL

Show:

Device

Assigned patient

Connection history

Battery

Last observation

Last sync

Recent errors

---

# 72. DEVICE DISCONNECTION DEMO

Device becomes Offline.

Patient Monitoring status updates.

Alert generated:

Monitoring Device Offline.

Actions:

Retry Demo Sync

Contact Patient

Replace Device

Resolve

---

# 73. DEVICE EVENT TIMELINE

Example:

08:02
Reading received

11:57
Connection lost

12:10
Alert created

12:18
Patient contacted

12:23
Device reconnected

---

# 74. CONNECTIVITY DASHBOARD

Metrics:

Connected Devices

Offline Devices

Low Battery

Readings Received Today

Expected Readings

Missing Readings

---

# 75. PATIENT COMMUNICATION

Create secure communication simulation.

Messages:

Reminder to take reading

Medication reminder

Nurse message

Appointment notification

Check-in request

---

# 76. SEND MESSAGE

Allow:

Template

Custom Message

Channel:

App
SMS Demo
Email Demo

No real sending.

---

# 77. COMMUNICATION HISTORY

Show:

Message

Channel

Sender

Time

Status

Patient response

---

# 78. ALERT-TO-COMMUNICATION FLOW

Clinical alert

→ nurse clicks Contact Patient

→ communication modal

→ message sent

→ timeline event

→ alert shows Contacted.

---

# 79. PATIENT PORTAL / HOME VIEW

Create lightweight patient-side experience.

Route:

/patient-demo

Show:

Today's readings

Tasks

Medication

Messages

Next review

Device connectivity

---

# 80. PATIENT SUBMIT READING

Allow patient to manually enter:

Blood pressure

Temperature

Weight

Glucose

where appropriate.

On submit:

Reading appears in clinician dashboard.

Risk state recalculates.

---

# 81. DEVICE-SIMULATED READING

Patient can click:

Sync Device Reading

Short loading.

New synthetic observation appears.

---

# 82. VIRTUAL WARD TIMELINE

Patient timeline should combine:

Enrolment

Device assignment

Readings

Alerts

Contacts

Reviews

Medication adherence

Virtual consultation

Monitoring plan changes

Discharge

---

# 83. AI PATIENT SUMMARY

Generate:

Remote Care Summary

Example:

Patient is on day 6 of COPD virtual monitoring.

SpO2 has declined over the last four readings.

Two medication doses were confirmed late.

One nurse contact occurred today.

Latest monitoring state requires review.

Sources:

SpO2 Monitoring

Medication Log

Nurse Review

---

# 84. SOURCE TRACEABILITY

AI statements must link to:

Observations

Patient Check-ins

Medication Log

Clinical Review

Device Event

Care Plan

Example:

SpO2 declined from 96% to 92%.

Source:
Pulse Oximeter Readings
11:00–14:00

---

# 85. SOURCE DRAWER

Click:

View Evidence

Show exact underlying readings and timestamps.

---

# 86. AI INSIGHTS PAGE

Create:

AI Monitoring Insights

Examples:

Five patients have worsening observation trends.

Three patients repeatedly missed morning readings.

Two high-risk patients have unresolved alerts.

Medication adherence has declined for four patients.

---

# 87. INSIGHT STRUCTURE

Each insight:

Observation

Patients affected

Supporting evidence

Why it matters operationally

Suggested review action

---

# 88. RISK OVERVIEW

Create:

Risk Overview

Views:

By patient

By pathway

By ward cohort

By risk factor

---

# 89. COHORT ANALYTICS

Examples:

COPD

Total patients

Stable

Needs Review

High Risk

Alerts

Average monitoring duration

---

# 90. POPULATION TRENDS

Use carefully limited analytics:

Patients monitored

Average virtual ward duration

Alerts per pathway

Review response time

Readings completion

Device connectivity

Medication adherence

---

# 91. HEART FAILURE DEMO

Seed patient:

Arthur Collins

Heart Failure Virtual Ward

Monitor:

Weight

BP

Heart Rate

Symptoms

Demo scenario:

Weight increases over three days.

Patient reports swelling.

AI flags:

Abnormal trend requiring review.

Do not state diagnosis.

---

# 92. COPD DEMO

Seed:

Margaret Ellis

COPD

Readings:

SpO2 gradually declines.

Patient reports worsening breathlessness.

AI flag:

High priority monitoring review.

Nurse reviews.

Doctor escalation created.

---

# 93. DIABETES DEMO

Seed:

Daniel Morris

Diabetes

Monitoring:

Glucose

Medication adherence

Check-ins

Scenario:

Repeated high demo readings and two missed confirmations.

AI:

Monitoring review recommended.

No automatic medication recommendation.

---

# 94. POST-OPERATIVE DEMO

Seed:

Sophia Bennett

Post-operative virtual ward

Monitoring:

Temperature

Pain score

Mobility

Daily questionnaire

Scenario:

Temperature increases and pain check-in worsens.

System flags review.

---

# 95. HYPERTENSION DEMO

Seed:

Robert Hayes

Hypertension monitoring

BP trend increases across several readings.

System creates:

Persistent elevated BP trend — clinician review recommended.

Again:

No diagnosis.

---

# 96. PRIMARY DEMO SCENARIO — COPD DETERIORATION

This MUST work end-to-end.

Patient:
Margaret Ellis

Care Pathway:
COPD

Initial status:
Stable

Start demo scenario.

Readings:

SpO2 97
96
95
94
92

Patient check-in:

Increased breathlessness

Then:

AI detects trend.

Patient moves:

Stable
→ Needs Review
→ High Risk

Alert generated.

Nurse opens patient.

Reviews evidence.

Contacts patient.

Creates doctor escalation.

Doctor reviews.

Monitoring plan updated.

Alert resolved.

Timeline reflects all events.

---

# 97. SECOND DEMO — HEART FAILURE

Patient:
Arthur Collins

Weight:

78.4
78.8
79.3
80.0

Symptoms:
New swelling reported.

AI:

Abnormal weight trend.

Review recommended.

Nurse acknowledges.

Virtual review scheduled.

---

# 98. THIRD DEMO — MEDICATION ADHERENCE

Patient misses two scheduled demo medication confirmations.

System:

Medication adherence alert.

Nurse contacts patient.

Patient confirms misunderstanding of schedule.

Review note created.

Alert resolved.

---

# 99. FOURTH DEMO — DEVICE OFFLINE

Pulse oximeter disconnects.

No scheduled reading arrives.

System creates:

Device Offline

and:

Missing Reading

Remote Care Coordinator opens device.

Simulate Reconnect.

Reading arrives.

Alerts resolve.

---

# 100. FIFTH DEMO — VIRTUAL DISCHARGE

Patient monitoring remains stable.

All open tasks complete.

Final nurse review complete.

Consultant review complete.

Button:

Discharge from Virtual Ward

Confirmation.

Patient status:

Completed

Device assignment released.

Dashboard count updates.

Timeline event created.

---

# 101. VIRTUAL WARD DISCHARGE

Fields:

Discharge Date

Outcome

Final Review

Follow-up Required

Device Return

Patient Communication

---

# 102. DISCHARGE REQUIREMENTS

Prevent discharge if:

critical alert unresolved

mandatory review incomplete

required task open

unless clinician explicitly overrides with reason.

---

# 103. AUDIT TRAIL

Create enterprise audit page.

Columns:

Time

User

Role

Patient

Action

Previous State

New State

Examples:

Patient enrolled.

AI risk changed.

Nurse acknowledged alert.

Doctor reviewed escalation.

Monitoring plan updated.

Patient discharged.

---

# 104. NOTIFICATION CENTER

Examples:

High-risk patient requires review.

SpO2 trend alert.

Device offline.

Missing reading.

Medication dose unconfirmed.

Doctor escalation accepted.

Virtual consultation due.

---

# 105. SIMULATED INTEGRATIONS

Create:

Integrations

Cards:

EHR

FHIR

Patient App

Connected Devices

Pharmacy

Virtual Consultation

Identity Provider

Statuses:

Demo Connected

Simulation

Offline

Attention Required

Do NOT claim real integration.

---

# 106. FHIR DEMO MAPPING

Optional high-value screen.

Show mock mapping to:

Patient

Observation

Device

CarePlan

Task

Encounter

Communication

MedicationStatement

QuestionnaireResponse

Provenance

Clearly label:

FHIR Demo Mapping

---

# 107. SIMULATED DEVICE GATEWAY

Architecture screen:

Device
↓
Remote Monitoring Gateway
↓
Observation Stream
↓
VirtualWard AI
↓
Alerts / Care Plan / Clinician

Use product UI, not generic architecture image only.

---

# 108. AI SERVICE ARCHITECTURE

Do NOT hardcode random AI logic throughout components.

Create:

src/services/ai/

trendDetectionAI.ts

deteriorationAI.ts

readmissionAI.ts

adherenceAI.ts

missingReadingAI.ts

patientSummaryAI.ts

monitoringInsightAI.ts

riskExplanationAI.ts

---

# 109. EXAMPLE FUNCTIONS

detectVitalTrend()

calculateMonitoringRisk()

calculateReadmissionSignal()

detectAdherenceConcern()

detectMissingReadings()

generatePatientSummary()

generateMonitoringInsights()

explainRiskSignal()

---

# 110. DETERMINISTIC AI

Do not generate unpredictable random alerts.

Use predictable demo rules.

Example:

specific demo sequence

→ specific alert.

This is essential for reliable portfolio demonstration.

---

# 111. VITAL DATA MODEL

Observation should contain:

id

patientId

type

value

unit

timestamp

source

deviceId

status

---

# 112. ALERT DATA MODEL

Alert:

id

patientId

type

priority

trigger

evidence

createdAt

assignedTo

status

acknowledgedAt

resolvedAt

resolution

---

# 113. CARE PLAN DATA MODEL

CarePlan:

patientId

pathway

goals

observations

medicationTasks

checkIns

reviews

assignedTeam

startDate

expectedEndDate

status

---

# 114. DEVICE DATA MODEL

Device:

id

type

patientId

status

battery

lastSync

serialDemoId

connectionHistory

---

# 115. ROLE PERMISSIONS

Nurse:

Review alerts

Contact patient

Complete nurse review

Create escalation

Care Coordinator:

Manage devices

Contact patient

Manage tasks

Doctor:

Review escalation

Change monitoring plan

Approve discharge

Pharmacist:

Review adherence

Operations Manager:

View analytics

Administrator:

Demo configuration

---

# 116. PREVENT INVALID STATE

Examples:

Cannot discharge patient with unresolved high-priority alert unless overridden.

Cannot resolve alert without resolution reason.

Cannot assign same physical demo device to two active patients.

Cannot complete consultation twice.

Cannot mark missed reading received without adding a reading.

Cannot enrol duplicate active virtual ward episode.

---

# 117. LOADING STATES

Use:

Connecting device...

Receiving observation...

Analyzing monitoring trend...

Updating risk...

Generating patient summary...

Keep delays short.

---

# 118. ERROR STATES

Implement:

Device unavailable

Reading invalid

Missing patient

No monitoring plan

No recent readings

Unable to simulate sync

Alert already resolved

Review already completed

Patient already discharged

No clinician assigned

---

# 119. EMPTY STATES

No high-risk patients.

No missing readings.

All devices connected.

No medication adherence concerns.

No clinical alerts.

No doctor escalations.

---

# 120. MODALS AND DRAWERS

Use:

Enrol Patient — large modal

Patient Alert — wide drawer

Nurse Review — wide modal

Doctor Escalation — drawer

Virtual Consultation — dedicated workspace

Device Assignment — modal

Discharge — confirmation workflow

---

# 121. TABLE QUALITY

Tables must include:

Search

Sorting

Filters

Pagination where required

Row actions

Loading states

Empty states

Sticky headers where helpful

---

# 122. CHART QUALITY

Charts should be clinically readable.

Avoid:

3D charts

excess gradients

decorative graphs

Use:

Line trends

Threshold/reference bands if appropriate for demo

Small sparklines

Simple bar charts

---

# 123. ALERT VISUALS

Do not flash or animate critical alerts aggressively.

Use:

icon

priority label

clear text

subtle semantic background

---

# 124. MICROINTERACTIONS

Professional examples:

Patient enrolled.

Monitoring plan updated.

Reading received.

Alert acknowledged.

Patient contacted.

Escalation created.

Virtual visit completed.

Device reconnected.

Patient discharged.

---

# 125. ACCESSIBILITY

Implement:

Keyboard navigation

Visible focus

ARIA labels

Focus trap

Escape handling

Contrast

Non-color risk states

Chart labels/tooltips

Accessible dialogs

---

# 126. RESPONSIVENESS

Primary:

1440px

1280px

Tablet

Patient-side portal should be mobile-friendly.

Clinician command centre remains desktop-focused.

---

# 127. ANIMATION

Use subtle animation only:

Live status pulse

Incoming reading

Chart update

Drawer transitions

AI processing

Do not use:

neon glowing lines

large background movement

bouncy cards

---

# 128. PROFESSIONAL REALISM DETAILS

Use:

Virtual Ward Episode ID

VW-2026-0418

Patient ID

PT-20284

Device ID

OX-40812

Last Reading

13:22

Next Review

15:00

Day in Virtual Ward

6

Assigned Nurse

Rebecca Morgan

Assigned Consultant

Dr. James Howard

---

# 129. HUMAN REVIEW

Every AI alert detail should show:

AI Monitoring Signal

then:

Clinical Review

Example:

AI Risk:
High

Nurse Review:
Escalated

Doctor Decision:
Continue monitoring with increased review frequency.

Preserve all states.

---

# 130. NO DEAD BUTTONS

Every major action must work.

If action is unavailable:

disable it

and explain why.

---

# 131. GLOBAL SEARCH

Search:

Patient

Virtual Ward ID

Device

Clinician

Care pathway

---

# 132. SUGGESTED PROJECT STRUCTURE

Adapt to real project.

Conceptually:

src/
  components/
    ui/
    layout/
    patients/
    monitoring/
    alerts/
    devices/
    carePlans/
    medications/
    reviews/
    consultations/
    ai/
    charts/

  pages/
    VirtualWard/
    ActivePatients/
    PatientDetail/
    Enrolments/
    LiveObservations/
    Alerts/
    MissingReadings/
    CarePlans/
    MedicationAdherence/
    Tasks/
    NurseReviews/
    DoctorEscalations/
    VirtualConsultations/
    AIInsights/
    RiskOverview/
    PopulationTrends/
    Devices/
    Integrations/
    AuditTrail/
    Settings/
    PatientDemo/

  stores/

  services/
    ai/

  data/
    seed/

  types/

  utils/

---

# 133. AUTOMATED TESTING

Add tests for:

Patient enrolment

Monitoring-plan assignment

Device assignment

Observation creation

Trend detection

Risk change

Alert creation

Alert acknowledgment

Nurse review

Doctor escalation

Medication adherence

Missing reading

Device disconnection

Device reconnection

Virtual consultation

Virtual ward discharge

Role permissions

Demo reset

---

# 134. IMPORTANT REGRESSION TESTS

Test:

Observation sequence triggers correct deterministic alert.

Alert does not disappear without resolution.

Discharged patient no longer appears in active cohort.

Device released after discharge.

Risk state updates after new readings.

Patient timeline retains clinical actions.

---

# 135. E2E TEST — COPD WORKFLOW

Select Margaret Ellis

Start COPD scenario

Receive readings

SpO2 declines

AI signal generated

Alert appears

Nurse reviews

Patient contacted

Doctor escalation created

Doctor review completed

Monitoring plan updated

Risk reduced

Alert resolved

Verify dashboard changes.

---

# 136. E2E TEST — DEVICE FAILURE

Device disconnect

Missing reading

Alert appears

Reconnect device

Reading received

Alert resolved

Verify device status.

---

# 137. E2E TEST — VIRTUAL DISCHARGE

Stable patient

Complete outstanding tasks

Complete final review

Discharge

Release devices

Update active-patient total

Timeline updated.

---

# 138. FINAL MANUAL QA

Before completion verify:

PATIENTS

Enrol works

Patient opens

Status correct

MONITORING

Vitals display

Trends work

Live demo works

AI signals deterministic

ALERTS

Create

Acknowledge

Assign

Escalate

Resolve

DEVICES

Assign

Disconnect

Reconnect

Release

CARE PLANS

Create

Edit

Tasks work

MEDICATION

Adherence state works

Missed dose workflow works

REVIEWS

Nurse review works

Doctor escalation works

CONSULTATIONS

Start

Notes

Complete

DISCHARGE

Validation

Complete

Device release

ANALYTICS

Derived from state

PATIENT DEMO

Readings

Check-in

Messages

GENERAL

No dead buttons

No broken routes

No console errors

No contradictory patient state

No AI diagnosis

No fake live integrations

No real patient data

No encoding issues

Reset Demo works

---

# 139. FINAL IMPLEMENTATION RESPONSE

After implementation provide:

1. Summary of what was built.
2. Files created.
3. Files modified.
4. Routes.
5. State architecture.
6. Synthetic data model.
7. Device simulation architecture.
8. AI simulation architecture.
9. Alert workflow.
10. Patient monitoring workflow.
11. Clinical escalation workflow.
12. Medication adherence workflow.
13. Virtual discharge workflow.
14. Role permissions.
15. Automated tests.
16. Known limitations.
17. Remaining TODOs.

Do not just explain what could be built.

Actually implement it.

---

# 140. FINAL PRODUCT DEMO EXPERIENCE

A client should be able to watch:

"These are all patients currently being cared for through our Virtual Ward."

Open Virtual Ward.

"Most are stable, but this COPD patient has developed a concerning trend."

Open Margaret Ellis.

"Here are the device readings coming from home."

Show SpO2 chart.

"Watch what happens as new readings arrive."

Run scenario.

SpO2 declines.

"VirtualWard AI detects the trend and prioritizes the patient for review."

Alert appears.

"The AI doesn't diagnose anything. It shows the evidence and asks the clinical team to review."

Open alert.

Show readings.

"The nurse contacts the patient."

Click Contact.

"Because the symptoms and trend require further review, the nurse escalates to the doctor."

Create escalation.

"The doctor reviews all current data and updates the monitoring plan."

Update plan.

"All decisions are captured in the timeline and audit trail."

Open timeline.

Then:

"This patient has a disconnected pulse oximeter."

Open Device Alert.

Reconnect.

"And here is medication adherence."

Show missed confirmation.

Finally:

"When the patient completes remote monitoring, the clinician discharges them from the Virtual Ward, and their devices become available for reassignment."

Discharge patient.

That entire workflow must operate within one connected frontend state.

---

# 141. FINAL PRODUCT STANDARD

VirtualWard AI should communicate that healthcare organizations could remotely manage appropriate patients while maintaining:

Operational visibility

Device connectivity

Monitoring continuity

Patient engagement

Clinical escalation

Medication-adherence visibility

Care coordination

Human oversight

Auditability

AI-assisted prioritization

The product should be polished enough to demonstrate to:

Hospitals

Health Systems

Hospital-at-Home Programs

Virtual Ward Providers

Remote Patient Monitoring Companies

Digital Health Organizations

Chronic Disease Management Providers

Post-Acute Care Teams

Healthcare Software Vendors

The final application must feel:

Real

Connected

Premium

Calm

Clinical

Modern

Highly interactive

And most importantly:

**AI helps the care team identify who may need attention.  
Clinicians remain responsible for what happens next.**