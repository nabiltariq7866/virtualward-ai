import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Battery,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Link2,
  MessageSquare,
  MonitorSmartphone,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  UserPlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Card,
  CustomSelect,
  Empty,
  ErrorState,
  Field,
  Metric,
  Modal,
  PageHeader,
} from "../components/UI";
import { generateMonitoringInsights } from "../services/ai";
import { can, useVirtualWardStore } from "../stores/useVirtualWardStore";
import type { DischargeInput, Medication, Task } from "../types/domain";
import { deriveExpectedReadings } from "../utils/monitoring";
import { EnrolModal } from "./Patients";

const patientName = (
  id: string | undefined,
  patients: { id: string; name: string }[],
) => patients.find((p) => p.id === id)?.name || "Unassigned";

export function MissingReadings() {
  const s = useVirtualWardStore();
  const nav = useNavigate();
  useEffect(() => {
    useVirtualWardStore.getState().refreshMissingReadingAlerts();
  }, []);
  const expected = deriveExpectedReadings(
    s.patients,
    s.carePlans,
    s.observations,
    s.devices,
  );
  const items = expected.filter((r) => r.status === "Missing");
  const contact = (patientId: string, type: string) => {
    const result = s.sendMessage(
      patientId,
      `Your scheduled ${type} reading appears overdue in this demo. Please check the device and submit the reading when appropriate.`,
      "App",
    );
    result.ok ? toast.success("Patient contacted") : toast.error(result.error);
  };
  return (
    <>
      <PageHeader
        eyebrow="MONITORING CONTINUITY"
        title="Missing readings"
        description="Expected observations derived from each active monitoring plan and the current synthetic observation stream."
      />
      <div className="metric-grid four">
        <Metric label="Expected today" value={expected.length} />
        <Metric
          label="Received"
          value={expected.filter((r) => r.status === "Received").length}
          tone="success"
        />
        <Metric label="Missing" value={items.length} tone="warning" />
        <Metric
          label="Devices offline"
          value={s.devices.filter((d) => d.status === "Offline").length}
          tone="danger"
        />
      </div>
      <Card>
        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Expected reading</th>
                  <th>Due</th>
                  <th>Overdue</th>
                  <th>Device status</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const p = s.patients.find((x) => x.id === row.patientId)!;
                  return (
                    <tr key={row.id}>
                      <td>
                        <b>{p.name}</b>
                        <small className="block">{p.episodeId}</small>
                      </td>
                      <td>{row.type}</td>
                      <td>
                        {new Date(row.dueAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        {Math.floor(row.overdueMinutes / 60)}h{" "}
                        {row.overdueMinutes % 60}m
                      </td>
                      <td>
                        <Badge>{row.deviceStatus || "Not Assigned"}</Badge>
                        <small className="block">
                          {row.deviceId || "No device"}
                        </small>
                      </td>
                      <td>
                        <Badge>{p.risk}</Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn"
                            onClick={() => nav("/devices")}
                          >
                            Check device
                          </button>
                          <button
                            className="btn"
                            disabled={!can(s.role, "communication")}
                            onClick={() => contact(p.id, row.type)}
                          >
                            Contact
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No missing readings"
            detail="All currently due synthetic observations have been received."
            icon="reading"
          />
        )}
      </Card>
    </>
  );
}

export function Devices() {
  const s = useVirtualWardStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>();
  const [assignPatient, setAssignPatient] = useState("PT-20284");
  const expected = deriveExpectedReadings(
    s.patients,
    s.carePlans,
    s.observations,
    s.devices,
  );
  const list = s.devices.filter((d) =>
    [d.id, d.type, d.serialDemoId, patientName(d.patientId, s.patients)]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const device = s.devices.find((d) => d.id === selected);
  const run = (result: { ok: boolean; error?: string }, success: string) =>
    result.ok ? toast.success(success) : toast.error(result.error);
  return (
    <>
      <PageHeader
        eyebrow="DEVICE CONNECTIVITY"
        title="Devices"
        description="Synthetic monitoring-device assignment, connectivity, reading continuity and replacement workflow."
      />
      <div className="metric-grid four">
        <Metric
          label="Connected devices"
          value={s.devices.filter((d) => d.status === "Connected").length}
          tone="success"
        />
        <Metric
          label="Offline devices"
          value={s.devices.filter((d) => d.status === "Offline").length}
          tone="danger"
        />
        <Metric
          label="Low battery"
          value={s.devices.filter((d) => d.status === "Low Battery").length}
          tone="warning"
        />
        <Metric
          label="Missing readings"
          value={expected.filter((r) => r.status === "Missing").length}
          tone="warning"
        />
      </div>
      <Card>
        <div className="table-tools">
          <label className="search-box">
            <Search />
            <input
              aria-label="Search devices"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search device, serial or patient..."
            />
          </label>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Type</th>
                  <th>Patient</th>
                  <th>Connection</th>
                  <th>Battery</th>
                  <th>Last sync</th>
                  <th>Assigned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <button
                        className="text-btn"
                        onClick={() => setSelected(d.id)}
                      >
                        {d.id}
                      </button>
                      <small className="block">{d.serialDemoId}</small>
                    </td>
                    <td>{d.type}</td>
                    <td>{patientName(d.patientId, s.patients)}</td>
                    <td>
                      <Badge>{d.status}</Badge>
                    </td>
                    <td>
                      <span className="battery">
                        <Battery /> {d.battery}%
                      </span>
                    </td>
                    <td>{new Date(d.lastSync).toLocaleString()}</td>
                    <td>{d.patientId ? "Assigned" : "Available"}</td>
                    <td>
                      <button className="btn" onClick={() => setSelected(d.id)}>
                        View detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No devices match" icon="device" />
        )}
      </Card>
      {device && (
        <Modal
          title={`${device.type} · ${device.id}`}
          wide
          onClose={() => setSelected(undefined)}
        >
          <div className="two-col device-modal-grid">
            <Card className="device-status-card">
              <div className="device-hero">
                <span className={device.status === "Offline" ? "offline" : ""}>
                  {device.status === "Offline" ? <WifiOff /> : <Wifi />}
                </span>
                <div>
                  <b>{device.status}</b>
                  <small className="block">
                    Battery {device.battery}% · last sync{" "}
                    {new Date(device.lastSync).toLocaleString()}
                  </small>
                  <small className="block">
                    Assigned patient:{" "}
                    {patientName(device.patientId, s.patients)}
                  </small>
                </div>
              </div>

              <div className="device-section-heading">
                <span>Connection history</span>
                <small>Most recent synthetic gateway events</small>
              </div>

              <div className="mini-timeline device-event-timeline">
                {device.connectionHistory
                  .slice()
                  .reverse()
                  .slice(0, 6)
                  .map((e, i) => (
                    <div key={`${e.time}-${i}`}>
                      <i />
                      <span>
                        <b>{e.event}</b>
                        <small>{new Date(e.time).toLocaleString()}</small>
                      </span>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="device-observation-card">
              <div className="device-section-heading">
                <span>Recent observations</span>
                <small>Latest readings received from this device</small>
              </div>

              <div className="device-observation-list">
                {s.observations
                  .filter((o) => o.deviceId === device.id)
                  .sort(
                    (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
                  )
                  .slice(0, 3)
                  .map((o) => (
                    <div className="device-observation-row" key={o.id}>
                      <Activity />
                      <span>
                        <b>
                          {o.type}: {o.value}
                          {o.secondaryValue ? `/${o.secondaryValue}` : ""}
                          {o.unit}
                        </b>
                        <small>{new Date(o.timestamp).toLocaleString()}</small>
                      </span>
                    </div>
                  ))}
              </div>

              {!device.patientId && (
                <div className="device-assign-panel">
                  <Field label="Assign to active patient">
                    <CustomSelect
                      ariaLabel="Assign device to active patient"
                      value={assignPatient}
                      onChange={setAssignPatient}
                      options={s.patients
                        .filter((p) => p.monitoringStatus !== "Completed")
                        .map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </Field>
                  <button
                    className="btn primary"
                    disabled={!can(s.role, "device")}
                    onClick={() =>
                      run(
                        s.assignDevice(device.id, assignPatient),
                        "Device assigned",
                      )
                    }
                  >
                    Assign device
                  </button>
                </div>
              )}

              {device.patientId && (
                <div className="modal-actions device-modal-actions">
                  <button
                    className="btn"
                    disabled={
                      !can(s.role, "device") || device.status === "Offline"
                    }
                    onClick={() =>
                      run(s.disconnectDevice(device.id), "Device disconnected")
                    }
                  >
                    Disconnect demo
                  </button>
                  <button
                    className="btn primary"
                    disabled={
                      !can(s.role, "device") || device.status === "Connected"
                    }
                    onClick={() =>
                      run(
                        s.reconnectDevice(device.id),
                        "Device reconnected and reading received",
                      )
                    }
                  >
                    Retry demo sync
                  </button>
                  <button
                    className="btn"
                    disabled={!can(s.role, "device")}
                    onClick={() =>
                      run(
                        s.replaceDevice(device.id),
                        "Replacement task created",
                      )
                    }
                  >
                    Replace device
                  </button>
                  {can(s.role, "communication") && (
                    <button
                      className="btn"
                      onClick={() => {
                        s.sendMessage(
                          device.patientId!,
                          "We noticed a monitoring-device issue. Please check the device connection and contact the care team if the problem continues.",
                          "App",
                        );
                        toast.success("Patient contacted");
                      }}
                    >
                      Contact patient
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>

          <small className="disclaimer device-modal-disclaimer">
            Synthetic device gateway only. No real medical device is connected.
          </small>
        </Modal>
      )}
    </>
  );
}

export function CarePlans() {
  const s = useVirtualWardStore();
  const nav = useNavigate();
  const active = s.carePlans.filter((c) => c.status === "Active");

  return (
    <>
      <PageHeader
        eyebrow="CARE MANAGEMENT"
        title="Care plans"
        description="Pathway-specific monitoring schedules, goals, check-ins, review expectations and escalation instructions."
      />

      <div className="card-grid care-plan-grid">
        {active.map((plan) => {
          const p = s.patients.find((x) => x.id === plan.patientId)!;
          const openTasks = s.tasks.filter(
            (t) =>
              t.patientId === p.id &&
              !["Completed", "Cancelled"].includes(t.status),
          ).length;

          return (
            <Card key={plan.patientId} className="care-plan-card">
              <div className="care-plan-card-top">
                <div className="care-plan-patient">
                  <span className="care-plan-icon">
                    <ClipboardCheck />
                  </span>
                  <div>
                    <small>ACTIVE CARE PLAN</small>
                    <h2>{p.name}</h2>
                  </div>
                </div>
                <Badge>{p.risk}</Badge>
              </div>

              <div className="care-plan-pathway">
                <span>PATHWAY</span>
                <strong>
                  {plan.planName || `${plan.pathway} monitoring plan`}
                </strong>
              </div>

              <div className="care-plan-section-label">Monitoring schedule</div>
              <div className="plan-observations">
                {plan.observations.map((o) => (
                  <span key={o.type}>
                    <b>{o.type}</b>
                    <small>{o.frequency}</small>
                  </span>
                ))}
              </div>

              <div className="care-plan-summary">
                <div>
                  <span>Next review</span>
                  <strong>{plan.nextReview}</strong>
                </div>
                <div>
                  <span>Open tasks</span>
                  <strong>{openTasks}</strong>
                </div>
              </div>

              <div className="care-plan-guidance">
                <span>Escalation guidance</span>
                <p>{plan.escalationInstructions}</p>
              </div>

              <button
                className="btn full care-plan-cta"
                onClick={() => nav(`/patients/${p.id}`)}
              >
                Open patient workspace <ArrowRight />
              </button>
            </Card>
          );
        })}

        {!active.length && <Empty title="No active care plans" />}
      </div>
    </>
  );
}

export function Tasks() {
  const s = useVirtualWardStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("PT-20284");
  const [title, setTitle] = useState("Follow-up questionnaire");
  const [due, setDue] = useState("Tomorrow");
  const list = s.tasks.filter(
    (t) =>
      (status === "All" || t.status === status) &&
      [t.title, t.category, patientName(t.patientId, s.patients)]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const change = (task: Task, next: Task["status"]) => {
    const r = s.updateTask(task.id, next);
    r.ok ? toast.success("Task updated") : toast.error(r.error);
  };
  return (
    <>
      <PageHeader
        eyebrow="CARE TASKS"
        title="Tasks"
        description="Observation, check-in, device, education and follow-up work across the Virtual Ward."
        actions={
          <button
            className="btn primary"
            disabled={!can(s.role, "task")}
            onClick={() => setOpen(true)}
          >
            <Plus /> Add task
          </button>
        }
      />
      <Card>
        <div className="table-tools">
          <label className="search-box">
            <Search />
            <input
              aria-label="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task or patient..."
            />
          </label>
          <CustomSelect
            ariaLabel="Task status"
            value={status}
            onChange={setStatus}
            options={[
              "All",
              "Upcoming",
              "Due",
              "Completed",
              "Missed",
              "Overdue",
              "Cancelled",
            ].map((value) => ({ value, label: value }))}
          />
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Patient</th>
                  <th>Category</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.title}</b>
                      {t.required && (
                        <small className="block">
                          Required for episode completion
                        </small>
                      )}
                    </td>
                    <td>{patientName(t.patientId, s.patients)}</td>
                    <td>{t.category}</td>
                    <td>{t.due}</td>
                    <td>
                      <Badge>{t.status}</Badge>
                    </td>
                    <td>
                      <CustomSelect
                        ariaLabel={`Update ${t.title}`}
                        disabled={!can(s.role, "task")}
                        value={t.status}
                        onChange={(value) => change(t, value as Task["status"])}
                        options={[
                          "Upcoming",
                          "Due",
                          "Completed",
                          "Missed",
                          "Overdue",
                          "Cancelled",
                        ].map((value) => ({ value, label: value }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No care tasks match" />
        )}
      </Card>
      {open && (
        <Modal title="Add care task" onClose={() => setOpen(false)}>
          <Field label="Patient">
            <CustomSelect
              ariaLabel="Patient"
              value={patientId}
              onChange={setPatientId}
              options={s.patients
                .filter((p) => p.monitoringStatus !== "Completed")
                .map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="Task">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Due">
            <input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <div className="modal-actions">
            <button className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!title.trim()}
              onClick={() => {
                const r = s.addTask(patientId, title, due, "Follow-up");
                r.ok ? toast.success("Task added") : toast.error(r.error);
                if (r.ok) setOpen(false);
              }}
            >
              Add task
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Medications() {
  const s = useVirtualWardStore();
  const update = (med: Medication, value: Medication["today"]) => {
    const r = s.recordMedication(med.id, value);
    r.ok ? toast.success("Adherence record updated") : toast.error(r.error);
  };
  const concern = s.medications.filter((m) =>
    ["Missed", "Late", "Unconfirmed"].includes(m.today),
  );
  return (
    <>
      <PageHeader
        eyebrow="MEDICATION ADHERENCE"
        title="Medication adherence"
        description="Synthetic scheduled-dose confirmation and adherence review; no medication changes are made automatically."
      />
      <div className="metric-grid four">
        <Metric label="Today's doses" value={s.medications.length} />
        <Metric
          label="Taken"
          value={s.medications.filter((m) => m.today === "Taken").length}
          tone="success"
        />
        <Metric
          label="Missed"
          value={s.medications.filter((m) => m.today === "Missed").length}
          tone="danger"
        />
        <Metric
          label="Late / unconfirmed"
          value={
            s.medications.filter((m) =>
              ["Late", "Unconfirmed"].includes(m.today),
            ).length
          }
          tone="warning"
        />
      </div>
      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medication</th>
                <th>Schedule</th>
                <th>Today</th>
                <th>Recent history</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {s.medications.map((m) => (
                <tr key={m.id}>
                  <td>{patientName(m.patientId, s.patients)}</td>
                  <td>{m.name}</td>
                  <td>{m.schedule}</td>
                  <td>
                    <Badge>{m.today}</Badge>
                  </td>
                  <td>
                    <div className="dose-history">
                      {m.history.slice(-7).map((h, i) => (
                        <i key={i} className={h.toLowerCase()} title={h} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <CustomSelect
                      ariaLabel={`Medication status for ${m.name}`}
                      disabled={!can(s.role, "medication")}
                      value={m.today}
                      onChange={(value) =>
                        update(m, value as Medication["today"])
                      }
                      options={["Taken", "Missed", "Late", "Unconfirmed"].map(
                        (value) => ({ value, label: value }),
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="ai-panel">
        <div className="ai-head">
          <span>
            <BrainCircuit />
          </span>
          <div>
            <small>AI-ASSISTED ADHERENCE INSIGHT</small>
            <h2>
              {concern.length
                ? `${concern.length} medication confirmation(s) need review`
                : "No current adherence concern"}
            </h2>
          </div>
        </div>
        <p>
          {concern.length
            ? "Missed, late or unconfirmed scheduled doses should be reviewed with the patient."
            : "Current synthetic dose confirmations are maintained."}
        </p>
        <small className="disclaimer">
          Suggested review action only. Do not change medication based on this
          demo.
        </small>
      </Card>
    </>
  );
}

export function Reviews({ doctor }: { doctor?: boolean }) {
  const s = useVirtualWardStore();
  const list = s.reviews.filter((r) =>
    doctor ? r.type === "Doctor" : r.type === "Nurse",
  );
  return (
    <>
      <PageHeader
        eyebrow="CLINICAL REVIEWS"
        title={doctor ? "Doctor escalations" : "Nurse reviews"}
        description={
          doctor
            ? "Consultant review queue and recorded decisions."
            : "Nurse review history and dispositions."
        }
      />
      <Card>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Reason</th>
                  <th>Notes</th>
                  <th>Disposition</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <td>{patientName(r.patientId, s.patients)}</td>
                    <td>{r.reason}</td>
                    <td>{r.notes}</td>
                    <td>{r.disposition}</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No clinical reviews" icon="escalation" />
        )}
      </Card>
    </>
  );
}

export function Consultations() {
  const s = useVirtualWardStore();
  const [selected, setSelected] = useState(s.consultations[0]?.id);
  const consultation = s.consultations.find((c) => c.id === selected);
  const [notes, setNotes] = useState(consultation?.notes || "");
  const patient =
    consultation && s.patients.find((p) => p.id === consultation.patientId);
  const latest =
    patient &&
    s.observations
      .filter((o) => o.patientId === patient.id)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 4);
  const run = (r: { ok: boolean; error?: string }, ok: string) =>
    r.ok ? toast.success(ok) : toast.error(r.error);
  return (
    <>
      <PageHeader
        eyebrow="VIRTUAL CARE"
        title="Virtual consultations"
        description="Simulated remote consultation workspace with patient context, notes, tasks and monitoring-plan actions."
      />
      <div className="two-col">
        <Card title="Consultation list">
          {s.consultations.length ? (
            <div className="review-list large">
              {s.consultations.map((c) => (
                <button
                  key={c.id}
                  className="doctor-row"
                  onClick={() => {
                    setSelected(c.id);
                    setNotes(c.notes);
                  }}
                >
                  <span className="review-icon">
                    <MonitorSmartphone />
                  </span>
                  <span>
                    <b>{patientName(c.patientId, s.patients)}</b>
                    <small>{new Date(c.scheduledAt).toLocaleString()}</small>
                  </span>
                  <Badge>{c.status}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="No virtual consultations" />
          )}
        </Card>
        {consultation && patient ? (
          <Card className="consult-workspace">
            <div className="consult-status">
              <div>
                <small>SESSION</small>
                <h2>{patient.name}</h2>
              </div>
              <Badge>{consultation.status}</Badge>
            </div>
            <div className="participants">
              {consultation.participants.map((p) => (
                <span key={p}>
                  {p
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              ))}
              <small>{consultation.participants.join(" · ")}</small>
            </div>
            {consultation.startedAt && (
              <ConsultationTimer
                startedAt={consultation.startedAt}
                completedAt={consultation.completedAt}
              />
            )}
            <h3>Latest observations</h3>
            {latest?.map((o) => (
              <div className="consult-observation" key={o.id}>
                <Activity />
                <span>
                  <b>
                    {o.type} {o.value}
                    {o.unit}
                  </b>
                  <small>{new Date(o.timestamp).toLocaleString()}</small>
                </span>
              </div>
            ))}
            <Field label="Consultation notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <div className="modal-actions">
              <button
                className="btn"
                disabled={
                  !can(s.role, "consultation") ||
                  consultation.status !== "Scheduled"
                }
                onClick={() =>
                  run(
                    s.startConsultation(consultation.id),
                    "Virtual session started",
                  )
                }
              >
                Start session
              </button>
              <button
                className="btn"
                disabled={
                  !can(s.role, "consultation") ||
                  consultation.status !== "In progress"
                }
                onClick={() =>
                  run(
                    s.updateConsultationNotes(consultation.id, notes),
                    "Notes saved",
                  )
                }
              >
                Save notes
              </button>
              <button
                className="btn"
                disabled={!can(s.role, "task")}
                onClick={() =>
                  run(
                    s.addTask(
                      patient.id,
                      "Virtual consultation follow-up",
                      "Tomorrow",
                      "Clinical",
                    ),
                    "Follow-up task created",
                  )
                }
              >
                Create task
              </button>
              <button
                className="btn"
                disabled={!can(s.role, "plan")}
                onClick={() =>
                  run(
                    s.updateCarePlan(
                      patient.id,
                      "Monitoring plan reviewed during virtual consultation.",
                      "Tomorrow, 10:00",
                    ),
                    "Monitoring plan updated",
                  )
                }
              >
                Update monitoring plan
              </button>
              <button
                className="btn primary"
                disabled={
                  !can(s.role, "consultation") ||
                  consultation.status !== "In progress" ||
                  !notes.trim()
                }
                onClick={() =>
                  run(
                    s.completeConsultation(consultation.id, notes),
                    "Virtual consultation completed",
                  )
                }
              >
                Complete session
              </button>
            </div>
            <small className="disclaimer">
              No real video or telemedicine infrastructure is used.
            </small>
          </Card>
        ) : (
          <Card>
            <Empty title="Select a consultation" />
          </Card>
        )}
      </div>
    </>
  );
}

function ConsultationTimer({
  startedAt,
  completedAt,
}: {
  startedAt: string;
  completedAt?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (completedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [completedAt]);
  const end = completedAt ? +new Date(completedAt) : now;
  const seconds = Math.max(0, Math.floor((end - +new Date(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="consult-timer">
      <Radio /> Session timer {minutes}:{remainder}
      {completedAt ? " · completed" : " · live demo"}
    </div>
  );
}

export function AIInsights() {
  const s = useVirtualWardStore();
  const nav = useNavigate();
  const insights = generateMonitoringInsights(
    s.patients.filter((p) => p.monitoringStatus !== "Completed"),
    s.alerts,
    s.observations,
  );
  return (
    <>
      <PageHeader
        eyebrow="AI MONITORING"
        title="AI monitoring insights"
        description="Deterministic operational signals grounded in current synthetic Virtual Ward state."
      />
      <div className="insight-grid">
        {insights.map((i) => (
          <Card key={i.id} className="insight-card">
            <div className="ai-head">
              <span>
                <BrainCircuit />
              </span>
              <div>
                <small>OBSERVATION</small>
                <h2>{i.observation}</h2>
              </div>
              <strong>{i.patientIds.length}</strong>
            </div>
            <dl>
              <dt>Supporting evidence</dt>
              <dd>
                {i.evidence.length
                  ? i.evidence.slice(0, 4).join(" · ")
                  : "No supporting record in current state."}
              </dd>
              <dt>Why it matters</dt>
              <dd>{i.why}</dd>
              <dt>Suggested review action</dt>
              <dd>{i.action}</dd>
            </dl>
            <button
              className="btn"
              onClick={() =>
                nav(
                  i.id.includes("device") || i.id.includes("missing")
                    ? "/missing-readings"
                    : "/patients",
                )
              }
            >
              Review affected workflow <ArrowRight />
            </button>
            <small className="disclaimer">
              AI-generated monitoring insight. Not a diagnosis.
            </small>
          </Card>
        ))}
      </div>
    </>
  );
}

export function PopulationTrends() {
  const s = useVirtualWardStore();
  const active = s.patients.filter((p) => p.monitoringStatus !== "Completed");
  const pathways = [...new Set(active.map((p) => p.pathway))];
  const data = pathways.map((pathway) => {
    const cohort = active.filter((p) => p.pathway === pathway);
    const cohortAlerts = s.alerts.filter(
      (a) =>
        cohort.some((p) => p.id === a.patientId) &&
        !["Resolved", "Dismissed"].includes(a.status),
    ).length;
    return {
      pathway,
      patients: cohort.length,
      alerts: cohortAlerts,
      adherence: cohort.length
        ? Math.round(
            cohort.reduce((sum, p) => sum + p.adherence, 0) / cohort.length,
          )
        : 0,
      duration: cohort.length
        ? Math.round(cohort.reduce((sum, p) => sum + p.day, 0) / cohort.length)
        : 0,
    };
  });
  const expected = deriveExpectedReadings(
    s.patients,
    s.carePlans,
    s.observations,
    s.devices,
  );
  const completion = expected.length
    ? Math.round(
        (expected.filter((r) => r.status === "Received").length /
          expected.length) *
          100,
      )
    : 100;
  return (
    <>
      <PageHeader
        eyebrow="ANALYTICS"
        title="Population trends"
        description="Limited synthetic cohort analytics for operations review; no causal clinical claims."
      />
      <div className="metric-grid four">
        <Metric label="Patients monitored" value={active.length} />
        <Metric
          label="Average ward duration"
          value={`${Math.round(active.reduce((a, p) => a + p.day, 0) / Math.max(active.length, 1))} days`}
        />
        <Metric
          label="Readings completion"
          value={`${completion}%`}
          tone="success"
        />
        <Metric
          label="Device connectivity"
          value={`${Math.round((s.devices.filter((d) => d.status === "Connected").length / Math.max(s.devices.filter((d) => d.patientId).length, 1)) * 100)}%`}
          tone="success"
        />
      </div>
      <div className="two-col">
        <Card title="Alerts by pathway">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <XAxis dataKey="pathway" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="alerts" fill="#679BC3" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Cohort summary">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pathway</th>
                  <th>Patients</th>
                  <th>Alerts</th>
                  <th>Avg duration</th>
                  <th>Adherence</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.pathway}>
                    <td>{d.pathway}</td>
                    <td>{d.patients}</td>
                    <td>{d.alerts}</td>
                    <td>{d.duration}d</td>
                    <td>{d.adherence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

export function Integrations() {
  const s = useVirtualWardStore();
  const run = (r: { ok: boolean; error?: string }, ok: string) =>
    r.ok ? toast.success(ok) : toast.error(r.error);
  const mappings = [
    ["Patient", "Patient", "patientId → Patient.identifier"],
    ["Observation", "Observation", "vital reading → Observation.valueQuantity"],
    ["Device", "Device", "deviceId → Device.identifier"],
    ["CarePlan", "CarePlan", "monitoring plan → CarePlan.activity"],
    ["Task", "Task", "care task → Task.status"],
    ["Encounter", "Encounter", "virtual consultation → Encounter"],
    ["Communication", "Communication", "message → Communication.payload"],
    [
      "MedicationStatement",
      "MedicationStatement",
      "adherence → MedicationStatement",
    ],
    [
      "QuestionnaireResponse",
      "QuestionnaireResponse",
      "check-in → QuestionnaireResponse",
    ],
    ["Provenance", "Provenance", "audit/source → Provenance.entity"],
  ];
  return (
    <>
      <PageHeader
        eyebrow="SIMULATED INTEGRATIONS"
        title="Integrations"
        description="Frontend-only integration catalogue and FHIR/device-gateway concepts. No live system is connected."
      />
      <div className="integration-banner">
        <Link2 />
        <span>
          <b>Demo environment only</b>
          <small>
            Statuses and sync actions below change shared frontend state and
            never call an external service.
          </small>
        </span>
      </div>
      <div className="card-grid integrations">
        {s.integrations.map((i) => (
          <Card key={i.id}>
            <div className="plan-head">
              <span className="integration-icon">
                <Link2 />
              </span>
              <Badge>{i.status}</Badge>
            </div>
            <h2>{i.name}</h2>
            <p>
              {i.type} · {i.protocol}
            </p>
            <small>
              Last demo sync: {new Date(i.lastSync).toLocaleString()}
            </small>
            <div className="plan-observations">
              {i.domains.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="row-actions">
              <button
                className="btn"
                disabled={!can(s.role, "admin")}
                onClick={() =>
                  run(
                    s.updateIntegration(i.id, "Attention Required"),
                    "Demo integration marked attention required",
                  )
                }
              >
                Create demo error
              </button>
              <button
                className="btn primary"
                disabled={!can(s.role, "admin")}
                onClick={() =>
                  run(s.simulateIntegrationSync(i.id), "Demo sync completed")
                }
              >
                Simulate sync
              </button>
            </div>
          </Card>
        ))}
      </div>
      <Card title="FHIR Demo Mapping">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>VirtualWard concept</th>
                <th>FHIR demo resource</th>
                <th>Mapping concept</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m[0]}>
                  <td>{m[0]}</td>
                  <td>
                    <Badge tone="info">{m[1]}</Badge>
                  </td>
                  <td>{m[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <small className="disclaimer">
          FHIR Demo Mapping — illustrative only; no FHIR server or production
          terminology validation.
        </small>
      </Card>
      <Card title="Simulated device gateway">
        <div className="gateway-flow">
          <div>
            <span>
              <b>Home device</b>BP / SpO2 / scale / glucose
            </span>
            <ArrowRight />
            <span>
              <b>Remote Monitoring Gateway</b>Demo connection events
            </span>
            <ArrowRight />
            <span>
              <b>Observation Stream</b>Synthetic readings
            </span>
            <ArrowRight />
            <span>
              <b>VirtualWard AI</b>Risk signals & alerts
            </span>
            <ArrowRight />
            <span>
              <b>Care team</b>Human review & action
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}

export function AuditTrail() {
  const s = useVirtualWardStore();
  const [query, setQuery] = useState("");
  const list = s.audits.filter((a) =>
    [
      a.user,
      a.role,
      a.action,
      a.previousState,
      a.newState,
      patientName(a.patientId, s.patients),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="ENTERPRISE AUDIT"
        title="Audit trail"
        description="Append-only demo history for meaningful state-changing actions."
      />
      <Card>
        <div className="table-tools">
          <label className="search-box">
            <Search />
            <input
              aria-label="Search audit"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, patient or action..."
            />
          </label>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Patient</th>
                  <th>Action</th>
                  <th>Previous state</th>
                  <th>New state</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.time).toLocaleString()}</td>
                    <td>{a.user}</td>
                    <td>{a.role}</td>
                    <td>{patientName(a.patientId, s.patients)}</td>
                    <td>{a.action}</td>
                    <td>{a.previousState}</td>
                    <td>{a.newState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No audit history" />
        )}
      </Card>
    </>
  );
}

export function Enrolments() {
  const s = useVirtualWardStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="ENROLMENT"
        title="Enrolments"
        description="Virtual Ward episode details, monitoring duration, care team, plan and contact information."
        actions={
          <button
            className="btn primary"
            disabled={!can(s.role, "enrol")}
            onClick={() => setOpen(true)}
          >
            <UserPlus /> Enrol
          </button>
        }
      />
      <Card>
        {s.patients.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Episode</th>
                  <th>Pathway</th>
                  <th>Start</th>
                  <th>Expected end</th>
                  <th>Monitoring plan</th>
                  <th>Care team</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {s.patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.name}</b>
                      <small className="block">{p.id}</small>
                    </td>
                    <td>{p.episodeId}</td>
                    <td>{p.pathway}</td>
                    <td>{p.startDate}</td>
                    <td>{p.expectedEndDate}</td>
                    <td>{p.monitoringPlanName || `${p.pathway} plan`}</td>
                    <td>
                      {p.nurse}
                      <small className="block">{p.consultant}</small>
                    </td>
                    <td>
                      {p.patientContact || "Demo contact unavailable"}
                      <small className="block">
                        Emergency: {p.emergencyContact || "Not recorded"}
                      </small>
                    </td>
                    <td>
                      <Badge>{p.monitoringStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No enrolments" />
        )}
      </Card>
      {open && <EnrolModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function SettingsPage() {
  const s = useVirtualWardStore();
  return (
    <>
      <PageHeader
        eyebrow="SETTINGS"
        title="Settings"
        description="Demo configuration, role context, synthetic threshold references and deterministic reset controls."
      />
      <Card>
        <div className="settings-row">
          <span>
            <b>Reset demo data</b>
            <small>Restore the complete original synthetic state.</small>
          </span>
          <button
            className="btn danger"
            disabled={!can(s.role, "admin")}
            title={
              !can(s.role, "admin") ? "Administrator permission required" : ""
            }
            onClick={() => {
              if (confirm("Reset all VirtualWard demo data?")) {
                s.resetDemo();
                toast.success("Demo data reset");
              }
            }}
          >
            <RotateCcw /> Reset demo data
          </button>
        </div>
        <div className="settings-row">
          <span>
            <b>Current simulated role</b>
            <small>Change role from the profile menu in the top bar.</small>
          </span>
          <Badge>{s.role}</Badge>
        </div>
        <div className="settings-row">
          <span>
            <b>Data mode</b>
            <small>
              All records, devices, alerts, integrations and model outputs are
              synthetic.
            </small>
          </span>
          <Badge tone="info">Frontend-only demo</Badge>
        </div>
      </Card>
      <div className="two-col">
        <Card title="Demo threshold configuration">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pathway</th>
                  <th>Observation</th>
                  <th>Attention rule</th>
                  <th>High rule</th>
                </tr>
              </thead>
              <tbody>
                {s.thresholdConfigs.map((item) => (
                  <tr key={item.id}>
                    <td>{item.pathway}</td>
                    <td>{item.type}</td>
                    <td>{item.attentionRule}</td>
                    <td>
                      {item.highRule}
                      <small className="block">{item.note}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small className="disclaimer">
            Illustrative synthetic configuration only. These values are not
            validated medical protocols.
          </small>
        </Card>
        <Card title="Synthetic care-team directory">
          <div className="review-list">
            {s.careTeam.map((member) => (
              <div key={member.id}>
                <span className="review-icon">
                  <Stethoscope />
                </span>
                <span>
                  <b>{member.name}</b>
                  <small>
                    {member.role} · {member.specialty}
                  </small>
                </span>
                <Badge>{member.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function DischargePage() {
  const { id } = useParams();
  const s = useVirtualWardStore();
  const nav = useNavigate();
  const p = s.patients.find((x) => x.id === id);
  const [error, setError] = useState("");
  const [form, setForm] = useState<DischargeInput>({
    dischargeDate: new Date().toISOString().slice(0, 10),
    outcome: "Monitoring complete",
    finalReview: "Consultant review complete",
    followUpRequired: "Follow up with usual-care team",
    deviceReturn: "Return assigned devices",
    patientCommunication:
      "Your Virtual Ward monitoring episode is complete. Please follow the care-team instructions provided.",
    overrideReason: "",
  });
  if (!p)
    return (
      <ErrorState
        kind="missing-patient"
        onRetry={() => nav("/patients")}
        retryLabel="Back to patients"
      />
    );
  if (p.monitoringStatus === "Completed")
    return (
      <>
        <PageHeader eyebrow={p.episodeId} title={`Discharge ${p.name}`} />
        <Card>
          <ErrorState
            kind="patient-discharged"
            onRetry={() => nav("/patients")}
            retryLabel="Back"
          />
        </Card>
      </>
    );
  const highAlerts = s.alerts.filter(
    (a) =>
      a.patientId === p.id &&
      !["Resolved", "Dismissed"].includes(a.status) &&
      ["High", "Urgent Review"].includes(a.priority),
  );
  const requiredTasks = s.tasks.filter(
    (t) =>
      t.patientId === p.id &&
      t.required &&
      !["Completed", "Cancelled"].includes(t.status),
  );
  const nurseComplete = s.reviews.some(
    (r) =>
      r.patientId === p.id && r.type === "Nurse" && r.status === "Completed",
  );
  const doctorComplete = s.reviews.some(
    (r) =>
      r.patientId === p.id && r.type === "Doctor" && r.status === "Completed",
  );
  const ready =
    !highAlerts.length &&
    !requiredTasks.length &&
    nurseComplete &&
    doctorComplete;
  const update = <K extends keyof DischargeInput>(
    key: K,
    value: DischargeInput[K],
  ) => setForm((v) => ({ ...v, [key]: value }));
  return (
    <>
      <PageHeader
        eyebrow={p.episodeId}
        title={`Discharge ${p.name}`}
        description="Clinician-controlled Virtual Ward discharge with explicit readiness validation, follow-up, device return and patient communication."
      />
      <div className="two-col">
        <Card title="Discharge readiness">
          <div className="check-list">
            <p>
              <CheckCircle2 /> High-priority alerts{" "}
              <Badge>
                {highAlerts.length
                  ? `${highAlerts.length} unresolved`
                  : "Complete"}
              </Badge>
            </p>
            <p>
              <CheckCircle2 /> Required tasks{" "}
              <Badge>
                {requiredTasks.length
                  ? `${requiredTasks.length} open`
                  : "Complete"}
              </Badge>
            </p>
            <p>
              <Stethoscope /> Final nurse review{" "}
              <Badge>{nurseComplete ? "Completed" : "Required"}</Badge>
            </p>
            <p>
              <Stethoscope /> Final consultant review{" "}
              <Badge>{doctorComplete ? "Completed" : "Required"}</Badge>
            </p>
          </div>
          {!ready && (
            <p className="form-error">
              Normal discharge is blocked until all required items are complete.
              A Consultant Physician may use an explicit documented override
              reason.
            </p>
          )}
        </Card>
        <Card title="Discharge record">
          <div className="form-grid">
            <Field label="Discharge date">
              <input
                type="date"
                value={form.dischargeDate}
                onChange={(e) => update("dischargeDate", e.target.value)}
              />
            </Field>
            <Field label="Outcome">
              <CustomSelect
                ariaLabel="Discharge outcome"
                value={form.outcome}
                onChange={(value) => update("outcome", value)}
                options={[
                  "Monitoring complete",
                  "Transition to usual care",
                  "Recommend external assessment",
                ].map((value) => ({ value, label: value }))}
              />
            </Field>
            <Field label="Final review">
              <input
                value={form.finalReview}
                onChange={(e) => update("finalReview", e.target.value)}
              />
            </Field>
            <Field label="Follow-up required">
              <input
                value={form.followUpRequired}
                onChange={(e) => update("followUpRequired", e.target.value)}
              />
            </Field>
            <Field label="Device return">
              <CustomSelect
                ariaLabel="Device return"
                value={form.deviceReturn}
                onChange={(value) => update("deviceReturn", value)}
                options={[
                  "Return assigned devices",
                  "Collection arranged",
                  "No device return required",
                ].map((value) => ({ value, label: value }))}
              />
            </Field>
          </div>
          <Field label="Patient communication">
            <textarea
              value={form.patientCommunication}
              onChange={(e) => update("patientCommunication", e.target.value)}
            />
          </Field>
          {!ready && (
            <Field label="Consultant override reason (required only if overriding blockers)">
              <textarea
                value={form.overrideReason || ""}
                onChange={(e) => update("overrideReason", e.target.value)}
                placeholder="Document why discharge can proceed despite the listed demo blockers..."
              />
            </Field>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={() => nav("/patients")}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={
                !can(s.role, "discharge") ||
                (!ready && !form.overrideReason?.trim())
              }
              title={
                !can(s.role, "discharge")
                  ? "Consultant Physician permission required"
                  : ""
              }
              onClick={() => {
                const result = s.dischargePatient(p.id, form);
                if (!result.ok) {
                  setError(result.error || "Unable to discharge");
                  return;
                }
                toast.success("Patient discharged from Virtual Ward");
                nav("/patients");
              }}
            >
              Confirm discharge
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
