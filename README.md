# VirtualWard AI

**Hospital-at-Home & Remote Patient Monitoring — frontend-only enterprise product demo**

VirtualWard AI demonstrates connected remote-care workflows using entirely synthetic patients, observations, devices, alerts, medication-adherence records, care plans, clinical reviews, virtual consultations and AI-assisted monitoring signals.

> Demo only. No real patient data, medical-device connection, EHR/FHIR service, messaging service, telemedicine service, validated deterioration model or clinical AI is used.

## Core demo story

The strongest workflow is **Margaret Ellis / COPD**:

1. Open **Live Observations**.
2. Run **COPD Deterioration**.
3. Watch deterministic SpO2 readings move from baseline toward review-required values.
4. Open Margaret's patient workspace and inspect exact evidence.
5. Open **Clinical Alerts** as the Virtual Ward Nurse.
6. Acknowledge → Contact patient → Complete nurse review → Escalate.
7. Switch to **Consultant Physician**.
8. Complete doctor review / adjust monitoring plan.
9. Inspect the combined timeline and audit trail.

Other deterministic demonstrations include heart-failure weight change, medication-adherence concern, device disconnection/reconnect, post-operative monitoring, hypertension trend and discharge readiness.

## Main routes

```text
/                         Virtual Ward command centre
/patients                 Active patients
/patients/:id             Patient remote-care workspace
/enrolments               Virtual Ward enrolments
/monitoring               Patient monitoring
/live-observations        Live deterministic monitoring
/alerts                    Clinical alert centre
/missing-readings          Care-plan-derived missing readings
/care-plans                Care plans
/medications               Medication adherence
/tasks                     Care tasks
/nurse-reviews             Nurse reviews
/doctor-escalations        Doctor escalation workspace
/consultations             Virtual consultations
/communications            Patient communication simulation
/ai-insights               AI monitoring insights
/risk-overview             Risk by patient/pathway/cohort/factor
/population-trends         Virtual Ward cohort analytics
/devices                   Device connectivity/assignment
/integrations              Synthetic integrations + FHIR demo mapping
/audit                     Enterprise audit trail
/settings                  Roles, thresholds, care team and reset
/patient-demo              Mobile-oriented patient/caregiver demo
/discharge/:id             Virtual Ward discharge workflow
```

## Shared state

The application uses persisted Zustand state. Major collections include:

- patients and Virtual Ward episodes
- observations
- care plans and monitoring schedules
- threshold configurations
- care-team members
- alerts
- devices and connection history
- medications
- tasks
- nurse/doctor reviews
- virtual consultations
- communications
- documents
- integrations
- discharge records
- patient timeline
- audit events

Use **Settings → Reset Demo Data** while simulating the Administrator role to restore the seed state.

## Deterministic AI/services

`src/services/ai/` and `src/utils/monitoring.ts` provide synthetic deterministic logic for:

- vital trends
- monitoring risk
- readmission signal
- medication-adherence concern
- care-plan-derived missing readings
- patient summary
- operational monitoring insights
- exact source-grounded evidence

AI signals never diagnose, prescribe or autonomously discharge a patient.

## Run locally

```bash
npm install
npm run dev
```

Production and tests:

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

## Verification note

The final repair pass statically checks the TypeScript/TSX source tree and local imports and exercises critical store workflows with a lightweight local harness. The packaging sandbox could not fetch/install the full npm dependency tree, so `npm run build`, Vitest and Playwright are **not falsely reported as passing in that environment**. Run the commands above locally for runtime certification.

See:

- `docs/MASTER_PROMPT_COMPLIANCE.md`
- `docs/FINAL_FIX_AUDIT.md`

## Custom dropdown standard

This release uses the reusable `CustomSelect` component in `src/components/UI.tsx` for all dropdown-style controls. Native HTML native select / option elements are not used in the runtime application.

The custom dropdown supports mouse/touch selection, outside-click close, disabled state, selected-state indication, and keyboard navigation with Arrow Up/Down, Home/End, Enter/Space and Escape. Playwright selectors were updated so E2E tests exercise the custom control rather than native `selectOption()` behavior.
