"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileSearch,
  FlaskConical,
  Lightbulb,
  Monitor,
  Network,
  NotebookPen,
  Play,
  RotateCcw,
  Router,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import Topology from "./topology";
import PwaUpdate from "./pwa-update";
import {
  labs,
  catalog,
  causes,
  fixes,
  commandsFor,
  gatewayFixes,
  gatewayReasons,
  vlanCauses,
  vlanFixes,
} from "@/lib/catalog";
import { execute, repaired, commandSequence } from "@/lib/engine";
import { grade, nextHint } from "@/lib/grading";
import {
  attemptSchema,
  scenarioSchema,
  type Attempt,
  type Diagnosis,
  type Scenario,
  type ScenarioId,
} from "@/lib/schema";
import { ACTIVE_KEY, elapsed, loadJournal, loadPack, saveAttempt, savePack } from "@/lib/storage";
import { lessons } from "@/lib/lessons";

type Section = "labs" | "journal" | "learn";
type Tab = "inspect" | "evidence" | "diagnose";
const emptyDiagnosis: Diagnosis = { cause: "unspecified", devices: [], fix: "unspecified", evidence: [], notes: "" };
const duration = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
function localId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `practice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
async function api(body: unknown) {
  const response = await fetch("/api/lab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? "Unable to reach the lab server.");
  return data;
}

export default function NetFault() {
  const [section, setSection] = useState<Section>("labs"),
    [tab, setTab] = useState<Tab>("inspect");
  const [attempt, setAttempt] = useState<Attempt>(),
    [journal, setJournal] = useState<Attempt[]>([]),
    [pack, setPack] = useState<Scenario>();
  const [selected, setSelected] = useState("PC-A"),
    [target, setTarget] = useState("192.168.30.10"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [online, setOnline] = useState(true),
    [now, setNow] = useState(0),
    [loaded, setLoaded] = useState(false),
    [preview, setPreview] = useState("");
  const [mode, setMode] = useState<"practice" | "assessment">("practice");
  const [chosenLab, setChosenLab] = useState<ScenarioId>("ospf-01");
  const lab = catalog(attempt?.scenario ?? chosenLab);
  const isGateway = lab.id === "gateway-01";
  const isVlan = lab.id === "vlan-01";
  const causeChoices = isVlan ? vlanCauses : causes;
  const repairChoices = isVlan ? vlanFixes : isGateway ? gatewayFixes : fixes;
  const inFlight = useRef(false),
    timeoutRequested = useRef(false);
  const latestAttempt = useRef<Attempt | undefined>(undefined);
  const nextTimeoutRetry = useRef(0);
  const active = !!attempt && !attempt.finishedAt;
  const locked = active && attempt.mode === "assessment";
  const answer = attempt?.diagnosis ?? emptyDiagnosis;
  const current = attempt?.history.filter((o) => o.device === selected).at(-1);
  const selectedDevice = lab.devices.find((d) => d.id === selected) ?? lab.devices[0];
  const commands = commandsFor(lab.id, selectedDevice.id);

  function store(a: Attempt) {
    if (latestAttempt.current?.scenario !== a.scenario) {
      setSelected("PC-A");
      setTarget(catalog(a.scenario).target);
      setPreview("");
    }
    latestAttempt.current = a;
    setAttempt(a);
    try {
      setJournal(saveAttempt(localStorage, a));
      localStorage.setItem(ACTIVE_KEY, a.id);
    } catch {
      setError(
        "Browser storage is unavailable or the journal is damaged. This attempt remains in memory; export it before closing. Existing stored data was not overwritten.",
      );
      setJournal((j) => [a, ...j.filter((x) => x.id !== a.id)]);
    }
  }
  useEffect(() => {
    async function restore() {
      try {
        const list = loadJournal(localStorage);
        setJournal(list);
        const id = localStorage.getItem(ACTIVE_KEY);
        const a = list.find((a) => a.id === id);
        setPack(loadPack(localStorage, a?.scenario ?? "ospf-01"));
        setTarget(catalog(a?.scenario ?? "ospf-01").target);
        if (a) {
          latestAttempt.current = a;
          setAttempt(a);
          if (a.mode === "assessment" && !a.finishedAt) {
            try {
              const data = await api({ action: "resume", id: a.id });
              const resumed = attemptSchema.parse(data.attempt);
              const restored = { ...resumed, diagnosis: resumed.diagnosis ?? a.diagnosis };
              latestAttempt.current = restored;
              setAttempt(restored);
              setJournal(saveAttempt(localStorage, restored));
            } catch {
              setError("Assessment server is unavailable. Reconnect to continue; its timer keeps running.");
            }
          }
        }
      } catch {
        setError(
          "Saved data could not be read. It has been preserved. Export raw storage from the journal before clearing browser data.",
        );
      }
      setLoaded(true);
      setNow(Date.now());
      setOnline(navigator.onLine);
    }
    void restore();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const status = () => setOnline(navigator.onLine);
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
    };
  }, []);
  useEffect(() => {
    if (
      !attempt ||
      attempt.finishedAt ||
      attempt.mode !== "assessment" ||
      now < attempt.expiresAt! ||
      timeoutRequested.current ||
      now < nextTimeoutRetry.current ||
      !online
    )
      return;
    timeoutRequested.current = true;
    api({ action: "resume", id: attempt.id })
      .then((data) => {
        const a = attemptSchema.parse(data.attempt);
        latestAttempt.current = a;
        setAttempt(a);
        try {
          setJournal(saveAttempt(localStorage, a));
        } catch {
          setError("Result could not be saved. Export the journal before closing.");
        }
      })
      .catch(() => {
        nextTimeoutRetry.current = Date.now() + 30000;
        timeoutRequested.current = false;
        setError("Time has ended. Reconnect to the server to finalize this assessment.");
      });
  }, [attempt, now, online]);
  async function task(fn: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action failed. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function getPack() {
    if (pack?.id === lab.id) return pack;
    const saved = loadPack(localStorage, lab.id);
    if (saved) {
      setPack(saved);
      return saved;
    }
    const data = await api({ action: "practice-pack", scenario: lab.id });
    const p = scenarioSchema.parse(data.pack);
    if (p.id !== lab.id) throw Error("The server returned a different lab.");
    setPack(p);
    try {
      savePack(localStorage, p);
    } catch {
      setNotice("Practice pack is available for this visit, but could not be saved offline.");
    }
    return p;
  }
  function start() {
    void task(async () => {
      let a: Attempt;
      if (mode === "practice") {
        await getPack();
        a = {
          version: 1,
          id: localId(),
          scenario: lab.id,
          mode,
          startedAt: Date.now(),
          history: [],
          hints: [],
          revealed: false,
        };
      } else {
        a = attemptSchema.parse((await api({ action: "start", scenario: lab.id })).attempt);
      }
      timeoutRequested.current = false;
      store(a);
      setSelected("PC-A");
      setTarget(lab.target);
      setTab("inspect");
      setSection("labs");
      setPreview("");
    });
  }
  function run(command: string) {
    if (!attempt || attempt.finishedAt) return;
    void task(async () => {
      if (attempt.mode === "assessment") {
        const data = await api({
          action: "command",
          id: attempt.id,
          device: selectedDevice.id,
          command,
          target: ["ping", "tracert", "traceroute"].includes(command) ? target : "",
        });
        const a = attemptSchema.parse(data.attempt);
        store({ ...a, diagnosis: a.diagnosis ?? latestAttempt.current?.diagnosis });
      } else {
        const p = await getPack();
        if (attempt.history.length >= 100)
          throw Error("100-command limit reached. Submit this attempt or start a new one.");
        store({
          ...(latestAttempt.current ?? attempt),
          history: [
            ...attempt.history,
            {
              id: localId(),
              scenario: attempt.scenario,
              device: selectedDevice.id,
              command,
              target: ["ping", "tracert", "traceroute"].includes(command) ? target : "",
              output: execute(p, selectedDevice.id, command, target, attempt.history),
              at: Date.now(),
            },
          ],
        });
      }
    });
  }
  function editAnswer(patch: Partial<Diagnosis>) {
    const currentAttempt = latestAttempt.current ?? attempt;
    if (currentAttempt && !currentAttempt.finishedAt)
      store({ ...currentAttempt, diagnosis: { ...(currentAttempt.diagnosis ?? emptyDiagnosis), ...patch } });
  }
  function toggleEvidence(id: string) {
    editAnswer({
      evidence: answer.evidence.includes(id) ? answer.evidence.filter((x) => x !== id) : [...answer.evidence, id],
    });
  }
  function submit(reveal = false) {
    if (!attempt || attempt.finishedAt) return;
    void task(async () => {
      if (attempt.mode === "assessment")
        store(attemptSchema.parse((await api({ action: "submit", id: attempt.id, diagnosis: answer })).attempt));
      else {
        const p = await getPack();
        store({
          ...attempt,
          diagnosis: answer,
          finishedAt: Date.now(),
          revealed: reveal,
          feedback: grade(p, answer, attempt.history),
        });
      }
      setTab("diagnose");
    });
  }
  function hint() {
    if (!attempt || attempt.mode !== "practice" || attempt.finishedAt) return;
    void task(async () => {
      const p = await getPack();
      if (attempt.hints.length < p.hints.length)
        store({ ...attempt, hints: [...attempt.hints, nextHint(p, attempt.hints.length)] });
    });
  }
  function download(raw = false) {
    try {
      const data = raw
        ? {
            journal: localStorage.getItem("netfault.journal.v1"),
            practice: localStorage.getItem("netfault.practice.v1"),
            gatewayPractice: localStorage.getItem("netfault.practice.gateway-01.v1"),
            vlanPractice: localStorage.getItem("netfault.practice.vlan-01.v1"),
          }
        : { version: 1, exportedAt: new Date().toISOString(), attempts: journal };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = raw ? "netfault-recovery.json" : "netfault-journal.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("The browser blocked this export. Your current attempt remains in memory.");
    }
  }
  function navigate(s: Section) {
    if (locked && s !== "labs") {
      setNotice("The journal and field guide are available after your assessment ends.");
      return;
    }
    setSection(s);
  }
  function back() {
    if (locked) {
      setNotice("Submit your assessment before leaving the workspace. The timer continues until submission or expiry.");
      return;
    }
    setChosenLab(lab.id);
    setAttempt(undefined);
    latestAttempt.current = undefined;
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {}
    setSection("labs");
    setPreview("");
  }
  const finished = journal.filter((a) => a.finishedAt);
  const remaining = attempt?.expiresAt ? Math.max(0, Math.ceil((attempt.expiresAt - now) / 1000)) : 0;
  const disabled = busy || !!(locked && remaining === 0);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#main" className="skip">
          Skip to content
        </a>
        <button className="brand" onClick={() => navigate("labs")} aria-label="NetFault labs">
          <span className="brand-mark">
            <Network size={24} />
          </span>
          netfault<span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "labs", label: "Troubleshooting labs", Icon: FlaskConical },
              { id: "journal", label: "Your journal", Icon: NotebookPen },
              { id: "learn", label: "Field guide", Icon: BookOpen },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={section === id ? "nav-item selected" : "nav-item"}
              aria-current={section === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "labs" && <span className="nav-count">{String(labs.length).padStart(2, "0")}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="course-badge">UM</div>
          <div>
            <strong>WIA2008</strong>
            <small>Advanced Network Technology</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />{" "}
            <span>
              {section === "labs" ? "Troubleshooting labs" : section === "journal" ? "Your journal" : "Field guide"}
            </span>
          </div>
          <span className="connection">
            <span className={online ? "status-dot" : "status-dot offline"} />
            {online ? "Workspace online" : "Offline"}
            <span className="desktop-only"> · Milestone 2B</span>
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          <PwaUpdate busy={busy} />
          {error && (
            <div role="alert" className="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={18} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
                <X size={18} />
              </button>
            </div>
          )}
          {!loaded ? (
            <div className="panel empty">Opening your workspace…</div>
          ) : section === "labs" && !attempt ? (
            <>
              <section className="welcome">
                <div>
                  <div className="eyebrow">
                    <span /> THE TROUBLESHOOTING WORKSPACE
                  </div>
                  <h1>
                    Find the fault.
                    <br />
                    <span>Build your instincts.</span>
                  </h1>
                  <p>
                    Follow the evidence. Understand the network.
                    <br className="desktop-only" /> Learn to solve the problem yourself.
                  </p>
                  <div className="welcome-tags">
                    <span>
                      <Terminal size={15} /> Real diagnostic workflows
                    </span>
                    <span>
                      <ShieldCheck size={15} /> Deterministic feedback
                    </span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="art-router">
                    <Network size={58} />
                  </div>
                  <div className="art-tag t1">
                    <Activity size={15} /> Observe
                  </div>
                  <div className="art-tag t2">
                    <FileSearch size={15} /> Investigate
                  </div>
                  <div className="art-tag t3">
                    <CheckCircle2 size={15} /> Explain
                  </div>
                </div>
              </section>
              <div className="section-heading">
                <h2>
                  Your lab bench <span>{String(labs.length).padStart(2, "0")}</span>
                </h2>
                <span className="muted">Two networks. Follow the evidence.</span>
              </div>
              <div className="lab-selector" role="group" aria-label="Choose a troubleshooting lab">
                {labs.map((item) => (
                  <button
                    key={item.id}
                    className={`mode ${lab.id === item.id ? "chosen" : ""}`}
                    aria-pressed={lab.id === item.id}
                    disabled={busy}
                    onClick={() => {
                      setChosenLab(item.id);
                      setTarget(item.target);
                      setSelected("PC-A");
                    }}
                  >
                    <span>
                      <small>
                        LAB {item.number} · {item.topic}
                      </small>
                      <strong>{item.title}</strong>
                    </span>
                  </button>
                ))}
              </div>
              <section className="lab-card panel">
                <div className="lab-card-main">
                  <div className="lab-meta">
                    <span className="tag">{lab.topic}</span>
                    <span className="muted">LAB {lab.number}</span>
                  </div>
                  <h2>{lab.title}</h2>
                  <p>{lab.subtitle} Trace the path between two campus LANs and explain why traffic is not arriving.</p>
                  <div className="mini-path" aria-label={lab.devices.map((d) => d.id).join(" to ")}>
                    {lab.devices.map((d, i) => (
                      <span key={d.id}>
                        {i > 0 && <i />}
                        {d.kind === "pc" ? (
                          <Monitor size={23} />
                        ) : d.kind === "switch" ? (
                          <Network size={23} />
                        ) : (
                          <Router size={23} />
                        )}
                        <b>{d.id}</b>
                      </span>
                    ))}
                  </div>
                  <div className="lab-footer">
                    <span>
                      <Network size={15} /> 5 devices
                    </span>
                    <span>
                      <Clock3 size={15} /> 15–20 min suggested
                    </span>
                    <span>
                      <FileSearch size={15} /> Evidence-based
                    </span>
                  </div>
                </div>
                <div className="launch-panel">
                  <h3>Choose your approach</h3>
                  <button
                    className={`mode ${mode === "practice" ? "chosen" : ""}`}
                    aria-pressed={mode === "practice"}
                    onClick={() => setMode("practice")}
                  >
                    <Lightbulb size={20} />
                    <span>
                      <strong>Practice</strong>
                      <small>Take your time. Hints when you need them.</small>
                    </span>
                    <span className="radio" />
                  </button>
                  <button
                    className={`mode ${mode === "assessment" ? "chosen" : ""}`}
                    aria-pressed={mode === "assessment"}
                    onClick={() => setMode("assessment")}
                  >
                    <ShieldCheck size={20} />
                    <span>
                      <strong>Assessment</strong>
                      <small>20 minutes. No hints. Server required.</small>
                    </span>
                    <span className="radio" />
                  </button>
                  <button
                    className="primary start"
                    disabled={busy || (!online && mode === "assessment")}
                    onClick={start}
                  >
                    {busy ? "Preparing lab…" : "Start investigation"}
                    <ArrowRight size={18} />
                  </button>
                  <small className="muted">
                    {mode === "practice"
                      ? "Progress saves on this browser. Starting practice downloads the offline lab pack."
                      : "The timer continues if you leave. This is self-assessment, not a proctored exam."}
                  </small>
                </div>
              </section>
              <details className="offline-details">
                <summary>Offline practice & assessment limits</summary>
                <p>
                  Practice downloads an inspectable lab pack. Offline use requires the production app on localhost or
                  trusted HTTPS, a completed service-worker installation, and an online reload. On an iPhone, a plain
                  HTTP laptop address does not support offline service workers.
                </p>
                <p>
                  Assessment needs the server. Its active payload contains no answer key, but previous practice data and
                  the source are inspectable. This is self-assessment, not a secure exam. Progress stays on this
                  browser; export it before changing addresses or clearing storage.
                </p>
              </details>
              {journal.some((a) => !a.finishedAt) && (
                <section className="panel resume">
                  <h3>Pick up where you left off</h3>
                  {journal
                    .filter((a) => !a.finishedAt)
                    .map((a) => (
                      <button
                        className="secondary"
                        key={a.id}
                        onClick={() =>
                          void task(async () => {
                            if (a.mode === "assessment") {
                              const r = attemptSchema.parse((await api({ action: "resume", id: a.id })).attempt);
                              store({ ...r, diagnosis: r.diagnosis ?? a.diagnosis });
                            } else store(a);
                            setTab("inspect");
                            timeoutRequested.current = false;
                          })
                        }
                      >
                        Resume {a.mode} · {catalog(a.scenario).title} · {a.history.length} observations{" "}
                        <ArrowRight size={16} />
                      </button>
                    ))}
                </section>
              )}
              <div className="below-grid">
                <div className="quiet-card">
                  <span className="step-number">01 → 03</span>
                  <h3>A method you can take with you</h3>
                  <p>
                    Observe the symptom, gather evidence, then explain the smallest repair. Every command is part of the
                    same network state.
                  </p>
                </div>
                <div className="quiet-card">
                  <BookOpen size={23} />
                  <h3>Understand the why</h3>
                  <p>Build from addressing to OSPF adjacency with examples and independent exercises.</p>
                  <button className="text-button" onClick={() => navigate("learn")}>
                    Open the field guide <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : section === "labs" && attempt ? (
            <>
              <div className="investigation-heading">
                <div>
                  <button className="text-button" onClick={back}>
                    ← Lab bench {active ? "(attempt saved)" : ""}
                  </button>
                  <h1>{lab.title}</h1>
                  <p className="muted">
                    LAB {lab.number} <span className="divider">/</span> {lab.topic} <span className="divider">/</span>{" "}
                    {attempt.mode}
                  </p>
                </div>
                <div className="timer">
                  <Clock3 size={18} />
                  <strong>
                    {duration(attempt.mode === "assessment" && !attempt.finishedAt ? remaining : elapsed(attempt, now))}
                  </strong>
                  <small>
                    {attempt.finishedAt ? "elapsed" : attempt.mode === "assessment" ? "remaining" : "elapsed · untimed"}
                  </small>
                </div>
              </div>
              <section className="incident panel">
                <div className="incident-icon">
                  <Activity size={21} />
                </div>
                <div>
                  <div className="eyebrow">INCIDENT REPORT</div>
                  <h2>PC-A cannot reach PC-B.</h2>
                  <p>{lab.incident}</p>
                  <details>
                    <summary>Network design & investigation brief</summary>
                    <p>{lab.design}</p>
                    <p>
                      Use commands to inspect each device. Save observations as evidence,{" "}
                      {isVlan
                        ? "identify the device, interface and observed configuration, then propose the intended configuration."
                        : isGateway
                          ? "identify the device and incorrect setting, then propose an address and explain the repair."
                          : "identify both affected adjacency endpoints, then propose a repair."}{" "}
                      Outputs are deterministic, condensed IOS-style or PC-style views; no live network traffic is sent.
                    </p>
                  </details>
                </div>
                <span className="tag amber">OPEN INVESTIGATION</span>
              </section>
              <div className="work-tabs" role="tablist" aria-label="Investigation steps">
                {(
                  [
                    { id: "inspect", label: "Investigate", Icon: Terminal },
                    { id: "evidence", label: `Evidence (${answer.evidence.length})`, Icon: NotebookPen },
                    { id: "diagnose", label: attempt.feedback ? "Feedback" : "Diagnose", Icon: ShieldCheck },
                  ] as const
                ).map(({ id, label, Icon }, i) => (
                  <button
                    role="tab"
                    aria-selected={tab === id}
                    aria-controls={`panel-${id}`}
                    id={`tab-${id}`}
                    key={id}
                    onClick={() => setTab(id)}
                    tabIndex={tab === id ? 0 : -1}
                    onKeyDown={(event) => {
                      const order: Tab[] = ["inspect", "evidence", "diagnose"];
                      const next =
                        event.key === "ArrowRight"
                          ? order[(i + 1) % 3]
                          : event.key === "ArrowLeft"
                            ? order[(i + 2) % 3]
                            : event.key === "Home"
                              ? order[0]
                              : event.key === "End"
                                ? order[2]
                                : undefined;
                      if (next) {
                        event.preventDefault();
                        setTab(next);
                        document.getElementById(`tab-${next}`)?.focus();
                      }
                    }}
                    className={tab === id ? "active" : ""}
                  >
                    <span className="tab-num">0{i + 1}</span>
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </div>
              {tab === "inspect" && (
                <div id="panel-inspect" role="tabpanel" aria-labelledby="tab-inspect" className="investigate-grid">
                  <section className="panel map-panel">
                    <div className="panel-heading">
                      <h2>
                        <Network size={18} /> Network topology
                      </h2>
                      <span className="muted">Tap a device to inspect</span>
                    </div>
                    <Topology lab={lab} selected={selectedDevice.id} onSelect={setSelected} />
                    <div className="device-picker" aria-label="Select a device">
                      {lab.devices.map((d) => (
                        <button
                          key={d.id}
                          aria-pressed={selected === d.id}
                          className={selected === d.id ? "selected" : ""}
                          onClick={() => setSelected(d.id)}
                        >
                          {d.kind === "pc" ? (
                            <Monitor size={16} />
                          ) : d.kind === "switch" ? (
                            <Network size={16} />
                          ) : (
                            <Router size={16} />
                          )}{" "}
                          {d.id}
                        </button>
                      ))}
                    </div>
                    <p className="map-caption">
                      Physical links only · Pan or pinch to explore · Link color does not indicate a diagnosis
                    </p>
                    <div className="investigation-tip">
                      <FileSearch size={19} />
                      <p>
                        <strong>Let the evidence lead.</strong> A working link and a working route are different things.
                        Compare observations before drawing a conclusion.
                      </p>
                    </div>
                    {attempt.mode === "practice" && (
                      <div className="hint-panel">
                        <div className="panel-heading">
                          <h3>
                            <Lightbulb size={18} /> Need a nudge?
                          </h3>
                          <button
                            className="secondary"
                            disabled={disabled || !!attempt.finishedAt || attempt.hints.length >= 3}
                            onClick={hint}
                          >
                            Next hint ({attempt.hints.length}/3)
                          </button>
                        </div>
                        {attempt.hints.map((h, i) => (
                          <p key={h}>
                            <b>0{i + 1}</b> {h}
                          </p>
                        ))}
                        <p className="muted">Hints are recorded in your journal. They do not deduct points.</p>
                      </div>
                    )}
                  </section>
                  <section className="panel inspector">
                    <div className="panel-heading">
                      <h2>
                        {selectedDevice.kind === "router" ? (
                          <Router size={20} />
                        ) : selectedDevice.kind === "switch" ? (
                          <Network size={20} />
                        ) : (
                          <Monitor size={20} />
                        )}{" "}
                        {selectedDevice.id} <span className="muted">/ {selectedDevice.role}</span>
                      </h2>
                      <span className="tag">INSPECTOR</span>
                    </div>
                    <div className="command-area">
                      {commands.some((c) => ["ping", "tracert", "traceroute"].includes(c)) && (
                        <>
                          <label htmlFor="destination">
                            Destination IPv4 <span className="muted">for ping / trace</span>
                          </label>
                          <input
                            id="destination"
                            inputMode="decimal"
                            value={target}
                            maxLength={64}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={lab.target}
                          />
                        </>
                      )}
                      <div className="command-grid">
                        {commands.map((c) => (
                          <button
                            key={c}
                            className={`command-button${c.endsWith(" switchport") ? " long-command" : ""}`}
                            disabled={disabled || !!attempt.finishedAt}
                            onClick={() => run(c)}
                          >
                            <span>{c}</span>
                            <Play size={12} />
                          </button>
                        ))}
                      </div>
                      <small className="muted">Only listed commands are supported for this device and lab.</small>
                    </div>
                    <div className="terminal-bar">
                      <span>
                        <span className="status-dot" /> {selected} console
                      </span>
                      <span>SIMULATED OUTPUT</span>
                    </div>
                    <div
                      className="terminal-output"
                      role="region"
                      aria-label="Command output"
                      aria-live="polite"
                      tabIndex={0}
                    >
                      {current ? (
                        <>
                          <div className="prompt">
                            {selected}
                            {selectedDevice.kind === "router" ? "#" : ">"} {current.command} {current.target}
                          </div>
                          <pre>{current.output}</pre>
                        </>
                      ) : (
                        <div className="terminal-empty">
                          <Terminal size={30} />
                          <p>Your investigation starts here.</p>
                          <span>Select a command to observe this device.</span>
                        </div>
                      )}
                    </div>
                    {current && (
                      <button
                        className={`save-evidence ${answer.evidence.includes(current.id) ? "saved" : ""}`}
                        disabled={!!attempt.finishedAt}
                        onClick={() => toggleEvidence(current.id)}
                      >
                        {answer.evidence.includes(current.id) ? <Check size={17} /> : <NotebookPen size={17} />}{" "}
                        {answer.evidence.includes(current.id) ? "Selected as evidence" : "Select output as evidence"}
                      </button>
                    )}
                  </section>
                </div>
              )}
              {tab === "evidence" && (
                <section
                  id="panel-evidence"
                  role="tabpanel"
                  aria-labelledby="tab-evidence"
                  className="panel evidence-panel"
                >
                  <div className="panel-heading">
                    <div>
                      <h2>Investigation notebook</h2>
                      <p className="muted">
                        {attempt.history.length} commands inspected · {answer.evidence.length} selected. Select outputs
                        that support your reasoning.
                      </p>
                    </div>
                    <NotebookPen size={24} />
                  </div>
                  {!attempt.history.length ? (
                    <div className="empty">
                      <FileSearch size={36} />
                      <h3>No observations yet</h3>
                      <p>Inspect a device and run a command to begin collecting evidence.</p>
                      <button className="secondary" onClick={() => setTab("inspect")}>
                        Inspect the network
                      </button>
                    </div>
                  ) : (
                    [...attempt.history].reverse().map((o, i) => (
                      <article className="observation" key={o.id}>
                        <div className="observation-heading">
                          <label>
                            <input
                              type="checkbox"
                              checked={answer.evidence.includes(o.id)}
                              disabled={!!attempt.finishedAt}
                              onChange={() => toggleEvidence(o.id)}
                            />
                            <span>
                              <strong>{o.device}</strong>{" "}
                              <code>
                                {o.command} {o.target}
                              </code>
                            </span>
                          </label>
                          <span className="muted">
                            #{attempt.history.length - i} ·{" "}
                            {duration(Math.max(0, Math.floor((o.at - attempt.startedAt) / 1000)))}
                          </span>
                        </div>
                        <details>
                          <summary>Read command output</summary>
                          <pre>{o.output}</pre>
                        </details>
                      </article>
                    ))
                  )}
                  <button className="primary" onClick={() => setTab("diagnose")}>
                    Build your diagnosis <ArrowRight size={17} />
                  </button>
                </section>
              )}
              {tab === "diagnose" && (
                <section id="panel-diagnose" role="tabpanel" aria-labelledby="tab-diagnose">
                  {attempt.feedback ? (
                    <div className="feedback panel">
                      <div className="feedback-top">
                        <div>
                          <div className="eyebrow">INVESTIGATION REVIEW</div>
                          <h2>
                            {attempt.feedback.score === 100
                              ? "A diagnosis backed by evidence."
                              : "Keep following the evidence."}
                          </h2>
                          <p>
                            {attempt.feedback.timedOut
                              ? "Time expired. No on-time final submission was recorded."
                              : attempt.revealed
                                ? "Solution revealed during practice. Treat this as a worked example."
                                : "Your submission has been saved to your journal."}
                          </p>
                        </div>
                        <div className="score">
                          {attempt.feedback.score}
                          <small>/ 100</small>
                        </div>
                      </div>
                      <div className="rubric">
                        {attempt.feedback.parts.map((p) => (
                          <div key={p.name}>
                            <h3>
                              {p.name}
                              <span>
                                {p.earned}/{p.possible}
                              </span>
                            </h3>
                            <p>{p.message}</p>
                          </div>
                        ))}
                      </div>
                      <h3>What happened</h3>
                      <p>{attempt.feedback.explanation}</p>
                      {attempt.feedback.lesson?.map((part) =>
                        part.revealOnRequest ? (
                          <details key={`${attempt.id}-${part.title}`} className="solution">
                            <summary>{part.title} — reveal when ready</summary>
                            <p>{part.text}</p>
                          </details>
                        ) : (
                          <section key={part.title} className="solution">
                            <h3>{part.title}</h3>
                            <p>{part.text}</p>
                          </section>
                        ),
                      )}
                      <details className="solution">
                        <summary>Your submitted diagnosis & reasoning</summary>
                        <p>
                          <strong>Cause:</strong>{" "}
                          {causeChoices.find(([id]) => id === answer.cause)?.[1] ?? "Not submitted"}
                        </p>
                        <p>
                          <strong>{isGateway || isVlan ? "Affected device:" : "Adjacency endpoints:"}</strong>{" "}
                          {answer.devices.join(", ") || "None selected"}
                        </p>
                        <p>
                          <strong>Repair:</strong>{" "}
                          {repairChoices.find(([id]) => id === answer.fix)?.[1] ?? "Not submitted"}
                        </p>
                        {isGateway && (
                          <p>
                            <strong>Gateway:</strong> {answer.gateway || "Not submitted"}
                            <br />
                            <strong>Explanation:</strong>{" "}
                            {gatewayReasons.find(([id]) => id === answer.reason)?.[1] ?? "Not submitted"}
                          </p>
                        )}
                        {isVlan && (
                          <p>
                            <strong>Interface:</strong> {answer.interface || "Not submitted"}
                            <br />
                            <strong>Observed VLAN:</strong> {answer.observedVlan ?? "Not submitted"}
                            <br />
                            <strong>Intended VLAN:</strong> {answer.intendedVlan ?? "Not submitted"}
                          </p>
                        )}
                        <p>
                          <strong>Evidence:</strong> {answer.evidence.length} observations. Review the Evidence tab for
                          original outputs.
                        </p>
                        <p className="learner-notes">
                          <strong>Notes (not graded):</strong> {answer.notes || "No notes recorded."}
                        </p>
                      </details>
                      <details className="solution" open>
                        <summary>Worked repair & verification</summary>
                        <pre>{attempt.feedback.solution}</pre>
                      </details>
                      <button
                        className="secondary"
                        onClick={() =>
                          void task(async () => {
                            const original = await getPack();
                            const p = repaired(original);
                            if (isVlan) {
                              setPreview(
                                [
                                  "REPAIRED-STATE PREVIEW — not part of your evidence",
                                  "BEFORE REPAIR",
                                  execute(original, "SW1", "show interfaces fastethernet0/1 switchport"),
                                  "AFTER REPAIR — only the affected access VLAN changes; fresh ARP cache",
                                  commandSequence(p, [
                                    ["SW1", "show vlan brief"],
                                    ["SW1", "show interfaces fastethernet0/1 switchport"],
                                    ["SW1", "show interfaces fastethernet0/24 switchport"],
                                    ["SW1", "show running-config"],
                                    ["PC-A", "arp -a"],
                                    ["PC-A", "ping", "192.168.10.1"],
                                    ["PC-A", "arp -a"],
                                    ["PC-A", "ping", lab.target],
                                    ["PC-A", "tracert", lab.target],
                                    ["PC-B", "ping", "192.168.10.10"],
                                    ["R1", "show ip route"],
                                    ["R2", "show ip route"],
                                  ]),
                                ].join("\n\n"),
                              );
                              return;
                            }
                            setPreview(
                              [
                                "REPAIRED-STATE PREVIEW — not part of your evidence",
                                ...(isGateway
                                  ? [
                                      "PC-A> ipconfig",
                                      execute(p, "PC-A", "ipconfig"),
                                      "PC-A> route print",
                                      execute(p, "PC-A", "route print"),
                                      "PC-A> ping 192.168.10.1",
                                      execute(p, "PC-A", "ping", "192.168.10.1"),
                                      `PC-A> tracert ${lab.target}`,
                                      execute(p, "PC-A", "tracert", lab.target),
                                    ]
                                  : ["R2# show ip ospf neighbor", execute(p, "R2", "show ip ospf neighbor")]),
                                "R1# show ip route",
                                execute(p, "R1", "show ip route"),
                                `PC-A> ping ${lab.target}`,
                                execute(p, "PC-A", "ping", lab.target),
                                "PC-B> ping 192.168.10.10",
                                execute(p, "PC-B", "ping", "192.168.10.10"),
                              ].join("\n\n"),
                            );
                          })
                        }
                      >
                        <Play size={16} /> Verify repaired network
                      </button>
                      {preview && <pre className="preview">{preview}</pre>}
                      <p className="muted">
                        A result in one lab is evidence of practice, not proof of mastery. {attempt.hints.length} hints
                        used.
                      </p>
                      <button className="primary" onClick={back}>
                        <RotateCcw size={17} /> Return to lab bench
                      </button>
                    </div>
                  ) : (
                    <form
                      className="panel diagnosis"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      <div className="panel-heading">
                        <div>
                          <h2>Make your case</h2>
                          <p className="muted">A good diagnosis connects the symptom, the evidence, and the repair.</p>
                        </div>
                        <ShieldCheck size={25} />
                      </div>
                      <label htmlFor="cause">01 / Root cause</label>
                      <select
                        id="cause"
                        required
                        value={answer.cause === "unspecified" ? "" : answer.cause}
                        onChange={(e) => editAnswer({ cause: e.target.value as Diagnosis["cause"] })}
                      >
                        <option value="" disabled>
                          Select the fault you observed
                        </option>
                        {causeChoices.map(([id, label]) => (
                          <option value={id} key={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <fieldset>
                        <legend>
                          {isGateway || isVlan ? "02 / Device with the fault" : "02 / Affected adjacency endpoints"}
                        </legend>
                        <p className="muted">
                          {isGateway || isVlan
                            ? "Choose the device containing the incorrect configuration."
                            : "Choose the two routers whose intended adjacency fails."}
                        </p>
                        <div className="device-checks">
                          {lab.devices
                            .filter((d) => isGateway || isVlan || d.kind === "router")
                            .map((d) => (
                              <label key={d.id}>
                                <input
                                  type="checkbox"
                                  checked={answer.devices.includes(d.id)}
                                  onChange={() =>
                                    editAnswer({
                                      devices: answer.devices.includes(d.id)
                                        ? answer.devices.filter((x) => x !== d.id)
                                        : [...answer.devices, d.id],
                                    })
                                  }
                                />
                                {d.id}
                              </label>
                            ))}
                        </div>
                      </fieldset>
                      {isVlan && (
                        <>
                          <label htmlFor="port-answer">Affected interface</label>
                          <select
                            id="port-answer"
                            required
                            value={answer.interface ?? ""}
                            onChange={(e) => editAnswer({ interface: e.target.value })}
                          >
                            <option value="" disabled>
                              Select the interface you diagnosed
                            </option>
                            {["Ethernet0", "FastEthernet0/1", "FastEthernet0/24", "Gi0/0", "Gi0/1"].map((port) => (
                              <option key={port}>{port}</option>
                            ))}
                          </select>
                          <label htmlFor="observed-vlan">Observed access VLAN</label>
                          <select
                            id="observed-vlan"
                            required
                            value={answer.observedVlan ?? ""}
                            onChange={(e) => editAnswer({ observedVlan: Number(e.target.value) })}
                          >
                            <option value="" disabled>
                              Select the VLAN in your evidence
                            </option>
                            {[1, 10, 20, 30].map((vlan) => (
                              <option key={vlan} value={vlan}>
                                {vlan}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="intended-vlan">Intended access VLAN</label>
                          <select
                            id="intended-vlan"
                            required
                            value={answer.intendedVlan ?? ""}
                            onChange={(e) => editAnswer({ intendedVlan: Number(e.target.value) })}
                          >
                            <option value="" disabled>
                              Select the VLAN required by the design
                            </option>
                            {[1, 10, 20, 30].map((vlan) => (
                              <option key={vlan} value={vlan}>
                                {vlan}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      <label htmlFor="fix">03 / Proposed remediation</label>
                      <select
                        id="fix"
                        required
                        value={answer.fix === "unspecified" ? "" : answer.fix}
                        onChange={(e) => editAnswer({ fix: e.target.value as Diagnosis["fix"] })}
                      >
                        <option value="" disabled>
                          Choose the smallest correct repair
                        </option>
                        {repairChoices.map(([id, label]) => (
                          <option value={id} key={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {isGateway && (
                        <>
                          <label htmlFor="gateway-answer">Correct default gateway</label>
                          <input
                            id="gateway-answer"
                            inputMode="decimal"
                            autoComplete="off"
                            required
                            maxLength={64}
                            value={answer.gateway ?? ""}
                            onChange={(e) => editAnswer({ gateway: e.target.value })}
                            placeholder="Enter the next-hop IPv4 address"
                          />
                          <label htmlFor="reason-answer">Why does the correction work?</label>
                          <select
                            id="reason-answer"
                            required
                            value={answer.reason === "unspecified" ? "" : (answer.reason ?? "")}
                            onChange={(e) => editAnswer({ reason: e.target.value as Diagnosis["reason"] })}
                          >
                            <option value="" disabled>
                              Select a forwarding explanation
                            </option>
                            {gatewayReasons.map(([id, text]) => (
                              <option key={id} value={id}>
                                {text}
                              </option>
                            ))}
                          </select>
                          <p className="muted">
                            The selected explanation is graded. Optional notes below are saved without interpretation.
                          </p>
                        </>
                      )}
                      <div className="evidence-summary">
                        <NotebookPen size={20} />
                        <div>
                          <strong>04 / {answer.evidence.length} evidence items selected</strong>
                          <p>
                            {isVlan
                              ? "Combine host configuration with membership observations for both connected switch ports. A failed ping alone does not identify the cause."
                              : isGateway
                                ? "Include at least one observation of PC-A's configured next hop. Compare it with the router interface and local/remote probes."
                                : "Include both interface configurations and observations of the neighbor and routing impact."}
                          </p>
                          <button className="text-button" type="button" onClick={() => setTab("evidence")}>
                            Review evidence <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                      <label htmlFor="notes">
                        Your reasoning <span className="muted">optional · journal only, not graded</span>
                      </label>
                      <textarea
                        id="notes"
                        maxLength={2000}
                        rows={4}
                        value={answer.notes}
                        placeholder={
                          isVlan
                            ? "What first suggested a Layer 2 problem? Why suspect IP settings? What would you check first next time?"
                            : "What did you rule out, and why?"
                        }
                        onChange={(e) => editAnswer({ notes: e.target.value })}
                      />
                      <p className="muted">
                        Grading uses the selected cause,{" "}
                        {isVlan
                          ? "device, interface, observed VLAN, command evidence and intended access-port configuration"
                          : isGateway
                            ? "device, command evidence, gateway address and forwarding explanation"
                            : "endpoint pair, command evidence, and repair"}
                        . Free text is saved verbatim; it is not interpreted.
                      </p>
                      <button className="primary" disabled={disabled} type="submit">
                        Submit diagnosis <ArrowRight size={18} />
                      </button>
                      {attempt.mode === "practice" && (
                        <details className="reveal">
                          <summary>Stuck? Review the solution</summary>
                          <p>This ends this practice attempt and records that you revealed the solution.</p>
                          <button type="button" className="secondary" onClick={() => submit(true)} disabled={busy}>
                            End attempt & reveal solution
                          </button>
                        </details>
                      )}
                    </form>
                  )}
                </section>
              )}
            </>
          ) : section === "journal" ? (
            <>
              <div className="page-heading">
                <div className="eyebrow">YOUR LEARNING RECORD</div>
                <h1>Progress, with perspective.</h1>
                <p>Return to your observations. Notice how your method changes.</p>
              </div>
              <div className="stats">
                <div className="panel">
                  <small>COMPLETED ATTEMPTS</small>
                  <strong>{finished.length}</strong>
                </div>
                <div className="panel">
                  <small>COMMANDS INSPECTED</small>
                  <strong>{journal.reduce((n, a) => n + a.history.length, 0)}</strong>
                </div>
                <div className="panel">
                  <small>LABS EXPLORED</small>
                  <strong>
                    {new Set(journal.map((a) => a.scenario)).size} <span>/ {labs.length}</span>
                  </strong>
                </div>
              </div>
              <p className="muted">
                This records activity across these {labs.length} labs. It does not measure overall networking mastery.
                Up to 100 recent attempts are retained on this browser.
              </p>
              <div className="journal-actions">
                <button className="secondary" onClick={() => download()}>
                  <Download size={17} /> Export journal
                </button>
                <button className="text-button" onClick={() => download(true)}>
                  Export raw storage for recovery
                </button>
              </div>
              {journal.length ? (
                journal.map((a) => (
                  <article key={a.id} className="panel journal-entry">
                    <div>
                      <span className="tag">{a.mode.toUpperCase()}</span>
                      <h2>{catalog(a.scenario).title}</h2>
                      <p>
                        {new Date(a.startedAt).toLocaleString()} · {duration(elapsed(a, now))} · {a.history.length}{" "}
                        commands · {a.hints.length} hints
                      </p>
                      {a.revealed && <small>Solution revealed</small>}
                    </div>
                    <div className="journal-result">
                      <strong>{a.feedback ? `${a.feedback.score}/100` : "In progress"}</strong>
                      <button
                        className="secondary"
                        onClick={() =>
                          void task(async () => {
                            let next = a;
                            if (a.mode === "assessment" && !a.finishedAt) {
                              next = attemptSchema.parse((await api({ action: "resume", id: a.id })).attempt);
                            }
                            store(next);
                            setSection("labs");
                            setTab(a.feedback ? "diagnose" : "evidence");
                            setPreview("");
                            timeoutRequested.current = false;
                          })
                        }
                      >
                        Open attempt <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel empty">
                  <NotebookPen size={38} />
                  <h2>Your first investigation belongs here.</h2>
                  <p>Commands, evidence, hints, diagnoses and feedback are saved as you work.</p>
                  <button className="primary" onClick={() => navigate("labs")}>
                    Explore the lab
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="page-heading">
                <div className="eyebrow">THE FIELD GUIDE</div>
                <h1>Understand what you observe.</h1>
                <p>Four connected ideas. A method for the next unfamiliar network.</p>
              </div>
              {lessons.map((l) => (
                <details className="panel lesson" key={l.title}>
                  <summary>
                    {l.title}
                    <BookOpen size={20} />
                  </summary>
                  <div className="lesson-body">
                    <h3>The simple version</h3>
                    <p>{l.simple}</p>
                    <h3>An analogy, with limits</h3>
                    <p>{l.analogy}</p>
                    <h3>Under the hood</h3>
                    <p>{l.technical}</p>
                    <h3>Worked example</h3>
                    <pre>{l.example}</pre>
                    <h3>Connect it to a symptom</h3>
                    <p>{l.symptom}</p>
                    <h3>Guided practice</h3>
                    <p>{l.guided}</p>
                    <h3>Try it independently</h3>
                    <p>{l.exercise}</p>
                  </div>
                </details>
              ))}
              <div className="quiet-card">
                <h3>Built on documented protocol behavior</h3>
                <p>
                  Concepts and modeled behavior were reviewed against{" "}
                  <a href="https://www.rfc-editor.org/rfc/rfc2328#section-8.2" target="_blank" rel="noreferrer">
                    RFC 2328
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Cisco’s OSPF troubleshooting guidance
                  </a>
                  . This is a simplified simulator, not an IOS emulator or an official Universiti Malaya product.
                </p>
              </div>
            </>
          )}
          <footer>
            <span>
              <Network size={15} /> NetFault <span className="muted">/ Learn by investigating.</span>
            </span>
            <span>Local-first practice · WIA2008 companion</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
