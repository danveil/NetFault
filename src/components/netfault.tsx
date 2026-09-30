"use client";
import Ipv6Repair, { Ipv6Diagnosis, observedIpv6 } from "./ipv6-controls";
import Ipv6Primer from "./ipv6-primer";
import { ipv6Causes, ipv6Fixes } from "@/lib/catalog";
import GreRepair, { GreDiagnosis, observedAddresses } from "./gre-repair";
import GrePrimer from "./gre-primer";
import { greCauses, greFixes } from "@/lib/catalog";
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
import EtherChannelRepair from "./etherchannel-repair";
import AclRepair from "./acl-repair";
import StpRepair, { StpDiagnosis } from "./stp-repair";
import StpPrimer from "./stp-primer";
import HsrpRepair, { HsrpDiagnosis } from "./hsrp-repair";
import PortSecurityRepair, { PortSecurityDiagnosis } from "./port-security-repair";
import NatRepair, { NatDiagnosis } from "./nat-repair";
import NatPrimer from "./nat-primer";
import { natCauses, natFixes } from "@/lib/catalog";
import PortSecurityPrimer from "./port-security-primer";
import { portSecurityCauses, portSecurityFixes } from "@/lib/catalog";
import HsrpPrimer from "./hsrp-primer";
import { hsrpCauses, hsrpFixes, hsrpReasons } from "@/lib/catalog";
import { stpCauses, stpFixes, stpReasons } from "@/lib/catalog";
import { recordRepair, trialNetwork, repairDescription } from "@/lib/repair-trial";
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
  returnCauses,
  returnFixes,
  returnReasons,
  passiveCauses,
  passiveFixes,
  passiveReasons,
  timerReasons,
  nextHopCauses,
  nextHopFixes,
  nextHopReasons,
  etherChannelCauses,
  etherChannelFixes,
  etherChannelReasons,
  aclCauses,
  aclFixes,
  aclReasons,
} from "@/lib/catalog";
import { execute } from "@/lib/engine";
import { repairPreview } from "@/lib/preview";
import { grade, nextHint } from "@/lib/grading";
import {
  attemptSchema,
  scenarioSchema,
  type Attempt,
  type Diagnosis,
  type Scenario,
  type ScenarioId,
  type RepairAction,
} from "@/lib/schema";
import { ACTIVE_KEY, elapsed, loadJournal, loadPack, saveAttempt, savePack } from "@/lib/storage";
import AcademyView from "./academy/academy";

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
  const [academyReferences, setAcademyReferences] = useState(false);
  const [section, setSection] = useState<Section>("labs"),
    [tab, setTab] = useState<Tab>("inspect");
  const [attempt, setAttempt] = useState<Attempt>(),
    [journal, setJournal] = useState<Attempt[]>([]),
    [pack, setPack] = useState<Scenario>();
  const [selected, setSelected] = useState("PC-A"),
    [target, setTarget] = useState("192.168.30.10"),
    [source, setSource] = useState(""),
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
  const isReturn = lab.id === "return-01";
  const isNextHop = lab.id === "next-hop-01";
  const isRouting = isReturn || isNextHop;
  const routingReasons = isNextHop ? nextHopReasons : returnReasons;
  const isPassive = lab.id === "passive-01";
  const isTimer = lab.id === "timer-01";
  const isEtherChannel = lab.id === "etherchannel-01";
  const isAcl = lab.id === "acl-01";
  const isStp = lab.id === "stp-01";
  const isIpv6 = lab.id === "ipv6-01";
  const isGre = lab.id === "gre-01";
  const isNat = lab.id === "nat-static-01";
  const isPortSecurity = lab.id === "port-security-01";
  const isHsrp = lab.id === "hsrp-01";
  const isTrial = isIpv6 || isGre || isNat || isEtherChannel || isAcl || isStp || isHsrp || isPortSecurity;
  const protocolReasons = isTimer ? timerReasons : passiveReasons;
  const singleDeviceFault = lab.id !== "ospf-01" && !isEtherChannel;
  const supportsPingSource = isIpv6 || isGre || isRouting || isPassive || isTimer || isAcl || isHsrp || isPortSecurity;
  const hintCount = isRouting || isPassive || isTimer || isTrial ? 4 : 3;
  const causeChoices = isIpv6
    ? ipv6Causes
    : isGre
      ? greCauses
      : isNat
        ? natCauses
        : isPortSecurity
          ? portSecurityCauses
          : isHsrp
            ? hsrpCauses
            : isStp
              ? stpCauses
              : isAcl
                ? aclCauses
                : isEtherChannel
                  ? etherChannelCauses
                  : isNextHop
                    ? nextHopCauses
                    : isPassive || isTimer
                      ? passiveCauses
                      : isRouting
                        ? returnCauses
                        : isVlan
                          ? vlanCauses
                          : causes;
  const repairChoices = isIpv6
    ? ipv6Fixes
    : isGre
      ? greFixes
      : isNat
        ? natFixes
        : isPortSecurity
          ? portSecurityFixes
          : isHsrp
            ? hsrpFixes
            : isStp
              ? stpFixes
              : isAcl
                ? aclFixes
                : isEtherChannel
                  ? etherChannelFixes
                  : isNextHop
                    ? nextHopFixes
                    : isPassive || isTimer
                      ? passiveFixes
                      : isRouting
                        ? returnFixes
                        : isVlan
                          ? vlanFixes
                          : isGateway
                            ? gatewayFixes
                            : fixes;
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
      setSource("");
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
    const probeSource =
      supportsPingSource && selectedDevice.kind === "router" && command === "ping" ? source.trim() : "";
    void task(async () => {
      if (attempt.mode === "assessment") {
        const data = await api({
          action: "command",
          id: attempt.id,
          device: selectedDevice.id,
          command,
          ...(probeSource ? { source: probeSource } : {}),
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
              ...(probeSource ? { source: probeSource } : {}),
              target: ["ping", "tracert", "traceroute"].includes(command) ? target : "",
              ...(attempt.repairs?.length ? { repairIndex: attempt.repairs.length } : {}),
              output: execute(
                trialNetwork(p, attempt.repairs),
                selectedDevice.id,
                command,
                target,
                attempt.history,
                probeSource,
                attempt.repairs?.length ?? 0,
              ),
              at: Date.now(),
            },
          ],
        });
      }
    });
  }
  function applyRepair(change: RepairAction) {
    if (!attempt || attempt.finishedAt) return;
    void task(async () => {
      if (attempt.mode === "assessment") {
        const data = await api({ action: "repair", id: attempt.id, change });
        const a = attemptSchema.parse(data.attempt);
        store({ ...a, diagnosis: a.diagnosis ?? latestAttempt.current?.diagnosis });
      } else store(recordRepair(await getPack(), latestAttempt.current ?? attempt, change, Date.now()));
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
          feedback: grade(p, answer, attempt.history, false, attempt.repairs),
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
            returnPractice: localStorage.getItem("netfault.practice.return-01.v1"),
            nextHopPractice: localStorage.getItem("netfault.practice.next-hop-01.v1"),
            timerPractice: localStorage.getItem("netfault.practice.timer-01.v1"),
            passivePractice: localStorage.getItem("netfault.practice.passive-01.v1"),
            etherChannelPractice: localStorage.getItem("netfault.practice.etherchannel-01.v1"),
            ipv6Practice: localStorage.getItem("netfault.practice.ipv6-01.v1"),
            grePractice: localStorage.getItem("netfault.practice.gre-01.v1"),
            natPractice: localStorage.getItem("netfault.practice.nat-static-01.v1"),
            portSecurityPractice: localStorage.getItem("netfault.practice.port-security-01.v1"),
            hsrpPractice: localStorage.getItem("netfault.practice.hsrp-01.v1"),
            stpPractice: localStorage.getItem("netfault.practice.stp-01.v1"),
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
  function navigate(s: Section, references = false) {
    if (locked && s !== "labs") {
      setNotice("The journal and field guide are available after your assessment ends.");
      return;
    }
    if (s === "learn") setAcademyReferences(references);
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
              { id: "learn", label: "Learn networking", Icon: BookOpen },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-label={id === "learn" ? "Learn networking / Field guide" : undefined}
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
              {section === "labs"
                ? "Troubleshooting labs"
                : section === "journal"
                  ? "Your journal"
                  : "Learn networking"}
            </span>
          </div>
          <span className="connection">
            <span className={online ? "status-dot" : "status-dot offline"} />
            {online ? "Workspace online" : "Offline"}
            <span className="desktop-only"> · Milestone 3Q</span>
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
                <span className="muted">Troubleshoot networks. Follow the evidence.</span>
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
                  <p>
                    {lab.subtitle}{" "}
                    {isHsrp
                      ? "Audit shared gateway roles and independent routing against the approved design."
                      : isStp
                        ? "Compare the observed switching tree with the approved design while connectivity remains available."
                        : "Trace the path between two campus LANs and explain why traffic is not arriving."}
                  </p>
                  <div
                    className="mini-path"
                    aria-label={
                      isHsrp
                        ? "Devices in the shared gateway network"
                        : isStp
                          ? "Devices in the redundant switched LAN"
                          : lab.devices.map((d) => d.id).join(" to ")
                    }
                  >
                    {lab.devices.map((d, i) => (
                      <span key={d.id}>
                        {i > 0 && !isStp && !isHsrp && <i />}
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
              {isStp && !locked && <StpPrimer />}
              {isHsrp && !locked && <HsrpPrimer />}
              {isNat && !locked && <NatPrimer />}
              {isIpv6 && !locked && <Ipv6Primer />}
              {isGre && !locked && <GrePrimer />}
              {isPortSecurity && !locked && <PortSecurityPrimer />}
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
                  <button className="text-button" onClick={() => navigate("learn", true)}>
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
                  <h2>{"heading" in lab ? lab.heading : "PC-A cannot reach PC-B."}</h2>
                  {isStp && !locked && <StpPrimer />}
                  {isHsrp && !locked && <HsrpPrimer />}
                  {isNat && !locked && <NatPrimer />}
                  {isIpv6 && !locked && <Ipv6Primer />}
                  {isGre && !locked && <GrePrimer />}
                  {isPortSecurity && !locked && <PortSecurityPrimer />}
                  <p>{lab.incident}</p>
                  <details>
                    <summary>Network design & investigation brief</summary>
                    <p>{lab.design}</p>
                    <p>
                      Use commands to inspect each device. Save observations as evidence,{" "}
                      {isIpv6
                        ? "compare manual addressing and routes, local reception and cross-network traffic; preserve original evidence and verify again after a change."
                        : isGre
                          ? "separate physical transport, tunnel configuration and inner delivery; apply one destination correction and verify both directions."
                          : isNat
                            ? "compare addressing, routes and both address views; apply one mapping correction and verify fresh bidirectional delivery."
                            : isPortSecurity
                              ? "compare endpoint identity with access policy, apply a justified static-slot replacement, then verify fresh controls, resolution and reciprocal delivery."
                              : isHsrp
                                ? "compare observed gateway roles with the approved design, apply a justified change and verify fresh roles, virtual resolution and reciprocal delivery."
                                : isStp
                                  ? "compare the observed tree with the approved design, apply a justified priority change, and verify fresh roles plus connectivity."
                                  : isAcl
                                    ? "identify the policy location and first matching entry, apply an order change, then verify permitted and restricted traffic."
                                    : isPassive || isTimer
                                      ? "identify the router, interface and configuration fault, then explain the effect of your correction."
                                      : isRouting
                                        ? "identify the device, destination prefix and next hop, then explain how the repair restores communication."
                                        : isVlan
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
                <div
                  id="panel-inspect"
                  role="tabpanel"
                  aria-labelledby="tab-inspect"
                  className={`investigate-grid${isGre ? " gre-investigation" : ""}${isIpv6 ? " ipv6-investigation" : ""}`}
                >
                  <section className="panel map-panel">
                    <div className="panel-heading">
                      <h2>
                        <Network size={18} /> Network topology
                      </h2>
                      <span className="muted">Tap a device to inspect</span>
                    </div>
                    <Topology
                      lab={lab}
                      selected={selectedDevice.id}
                      onSelect={(id) => {
                        setSelected(id);
                        setSource("");
                      }}
                    />
                    <div className="device-picker" aria-label="Select a device">
                      {lab.devices.map((d) => (
                        <button
                          key={d.id}
                          aria-pressed={selected === d.id}
                          className={selected === d.id ? "selected" : ""}
                          onClick={() => {
                            setSelected(d.id);
                            setSource("");
                          }}
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
                      {isGre ? "Physical cables and intended logical tunnel" : "Physical links only"} · Pan or pinch to
                      explore · Link color does not indicate a diagnosis
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
                            disabled={disabled || !!attempt.finishedAt || attempt.hints.length >= hintCount}
                            onClick={hint}
                          >
                            Next hint ({attempt.hints.length}/{hintCount})
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
                      {isTrial && (
                        <p className="muted">
                          Inspecting{" "}
                          {attempt.repairs?.length
                            ? `configuration version ${attempt.repairs.length}`
                            : "the initial configuration"}
                          . Apply a trial in Diagnose, then return here to verify it.
                        </p>
                      )}
                      {commands.some((c) => ["ping", "tracert", "traceroute"].includes(c)) && (
                        <>
                          <label htmlFor="destination">
                            Destination {isIpv6 ? "IPv6" : "IPv4"}{" "}
                            <span className="muted">
                              {isIpv6 || isGre || isNat || isAcl || isStp || isHsrp || isPortSecurity
                                ? "for ping"
                                : "for ping / trace"}
                            </span>
                          </label>
                          {isNat && (
                            <>
                              <label htmlFor="nat-target-choice">Service destination</label>
                              <select id="nat-target-choice" value="" onChange={(e) => setTarget(e.target.value)}>
                                <option value="">Choose a destination</option>
                                <option value="198.51.100.10">Outside destination · PC-B</option>
                                <option value="203.0.113.10">Inside global · assigned external identity</option>
                              </select>
                            </>
                          )}
                          {isIpv6 && (
                            <>
                              <label htmlFor="ipv6-target-choice">Observed IPv6 destination</label>
                              <select id="ipv6-target-choice" value="" onChange={(e) => setTarget(e.target.value)}>
                                <option value="">Choose from observations</option>
                                {observedIpv6(attempt).map((ip) => (
                                  <option key={ip}>{ip}</option>
                                ))}
                              </select>
                            </>
                          )}
                          {isGre && (
                            <>
                              <label htmlFor="gre-target-choice">Observed destination</label>
                              <select id="gre-target-choice" value="" onChange={(e) => setTarget(e.target.value)}>
                                <option value="">Choose from observations</option>
                                {observedAddresses(attempt).map((ip) => (
                                  <option key={ip}>{ip}</option>
                                ))}
                              </select>
                            </>
                          )}
                          <input
                            id="destination"
                            inputMode={isIpv6 ? "text" : "decimal"}
                            value={target}
                            maxLength={64}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={lab.target}
                          />
                        </>
                      )}
                      {supportsPingSource && selectedDevice.kind === "router" && (
                        <>
                          <label htmlFor="ping-source">Ping source (optional)</label>
                          {(isGre || isIpv6) && (
                            <>
                              <label htmlFor="gre-source-choice">Source interface choice</label>
                              <select id="gre-source-choice" value={source} onChange={(e) => setSource(e.target.value)}>
                                <option value="">Automatic outgoing interface</option>
                                {[
                                  "Gi0/0",
                                  "Gi0/1",
                                  ...(commands.includes("show interfaces tunnel 0") ? ["Tunnel0"] : []),
                                  ...(source && !["Gi0/0", "Gi0/1", "Tunnel0"].includes(source) ? [source] : []),
                                ].map((v) => (
                                  <option key={v}>{v}</option>
                                ))}
                              </select>
                            </>
                          )}
                          <input
                            id="ping-source"
                            value={source}
                            maxLength={64}
                            autoComplete="off"
                            onChange={(e) => setSource(e.target.value)}
                            placeholder={`Interface name or local ${isIpv6 ? "IPv6" : "IPv4"} address`}
                          />
                          <small className="muted">
                            Blank uses the outgoing interface. Inspect interface addresses before choosing a source.
                            Applies only to ping.
                          </small>
                        </>
                      )}
                      <div className="command-grid">
                        {commands.map((c) => (
                          <button
                            key={c}
                            className={`command-button${c.endsWith(" switchport") || c.startsWith("show port-security interface ") ? " long-command" : ""}`}
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
                            {current.source ? ` source ${current.source}` : ""}
                          </div>
                          <pre>{current.output}</pre>
                          {isTrial && (
                            <small>
                              Recorded from{" "}
                              {current.repairIndex
                                ? `configuration version ${current.repairIndex}`
                                : "the initial configuration"}
                              . Outputs are preserved observations, not live readings.
                            </small>
                          )}
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
                              {isTrial && (
                                <span className="tag">{o.repairIndex ? `Version ${o.repairIndex}` : "Initial"}</span>
                              )}
                              <code>
                                {o.command} {o.target}
                                {o.source ? ` source ${o.source}` : ""}
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
                      {isAcl && (
                        <p role="status">
                          {attempt.feedback.recovery === "verified"
                            ? "Policy recovery verified: permitted traffic works and the excluded control remains blocked."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Recovered configuration, but fresh policy verification is incomplete."
                              : "Policy recovery not established."}
                        </p>
                      )}
                      {isIpv6 && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "IPv6 transit verified with addressing retained and reciprocal delivery."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Recovered configuration; fresh verification is incomplete."
                              : "IPv6 transit recovery not established."}
                        </p>
                      )}
                      {isGre && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "Layered service verified: physical transport, matching tunnel endpoints and reciprocal inner delivery."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Recovered configuration; fresh verification is incomplete."
                              : "Layered service recovery not established."}
                        </p>
                      )}
                      {isNat && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "Both service directions verified with private NIC, global identity and routes retained."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Recovered configuration; fresh verification is incomplete."
                              : "Service recovery not established."}
                        </p>
                      )}
                      {isPortSecurity && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "Desk service verified with retained exclusive admission policy. No attacker probe was executed."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Configuration restored; fresh verification is incomplete."
                              : "Desk service recovery not established."}
                        </p>
                      )}
                      {isHsrp && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "Gateway design verified: complementary roles, virtual resolution and reciprocal delivery established. Failover was not tested."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Design restored; fresh verification is incomplete."
                              : "Gateway design recovery not established."}
                        </p>
                      )}
                      {isStp && (
                        <p className="recovery-status">
                          {attempt.feedback.recovery === "verified"
                            ? "Design recovery verified: intended root, roles and retained connectivity established."
                            : attempt.feedback.recovery === "recovered-unverified"
                              ? "Design restored; fresh verification is incomplete."
                              : "Design recovery not established."}
                        </p>
                      )}
                      {isTrial ? (
                        <details className="solution" open={attempt.revealed}>
                          <summary>Explanation — reveal when ready</summary>
                          <p>{attempt.feedback.explanation}</p>
                        </details>
                      ) : (
                        <>
                          <h3>What happened</h3>
                          <p>{attempt.feedback.explanation}</p>
                        </>
                      )}
                      {attempt.feedback.lesson?.map((part) =>
                        part.revealOnRequest || isTrial ? (
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
                          <strong>{singleDeviceFault ? "Affected device:" : "Adjacency endpoints:"}</strong>{" "}
                          {answer.devices.join(", ") || "None selected"}
                        </p>
                        <p>
                          <strong>Repair:</strong>{" "}
                          {repairChoices.find(([id]) => id === answer.fix)?.[1] ?? "Not submitted"}
                        </p>
                        {(isPassive || isTimer) && (
                          <p>
                            <strong>Interface:</strong> {answer.interface || "Not submitted"}
                            <br />
                            <strong>Explanation:</strong>{" "}
                            {protocolReasons.find(([id]) => id === answer.reason)?.[1] ?? "Not submitted"}
                          </p>
                        )}
                        {isAcl && (
                          <p>
                            <strong>Policy:</strong> {answer.aclName || "Not submitted"}, outbound{" "}
                            {answer.interface || "Not submitted"}
                            <br />
                            <strong>Initial first-matching sequence:</strong>{" "}
                            {answer.observedSequence ?? "Not submitted"}
                            <br />
                            <strong>Explanation:</strong>{" "}
                            {aclReasons.find(([id]) => id === answer.reason)?.[1] ?? "Not submitted"}
                          </p>
                        )}
                        {isRouting && (
                          <p>
                            <strong>Destination:</strong> {answer.destinationNetwork || "Not submitted"}
                            <br />
                            <strong>Next hop:</strong> {answer.nextHop || "Not submitted"}
                            <br />
                            <strong>Explanation:</strong>{" "}
                            {routingReasons.find(([id]) => id === answer.reason)?.[1] ?? "Not submitted"}
                          </p>
                        )}
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
                      {isTimer && (
                        <p>
                          Submitted timer profile: Hello {answer.hello ?? "—"} / Dead {answer.dead ?? "—"} seconds.
                        </p>
                      )}
                      {isIpv6 && (
                        <p>
                          Initial forwarding: {String(answer.observedForwarding ?? "Not submitted")}; proposed:{" "}
                          {String(answer.forwarding ?? "Not submitted")}; mechanism: {answer.reason ?? "Not submitted"}.
                        </p>
                      )}
                      {isGre && (
                        <p>
                          Interface: {answer.interface}; initial destination: {answer.observedDestination}; proposed
                          destination: {answer.tunnelDestination}; mechanism: {answer.reason}.
                        </p>
                      )}
                      {isNat && (
                        <p>
                          Initial inside local: {answer.observedLocal ?? "Not submitted"}; inside global:{" "}
                          {answer.observedGlobal ?? "Not submitted"}; mapping: {answer.mappingId ?? "Not submitted"};
                          proposed inside local: {answer.insideLocal ?? "Not submitted"}. Mechanism:{" "}
                          {answer.reason ?? "Not submitted"}.
                        </p>
                      )}
                      {isPortSecurity && (
                        <p>
                          Initial static secure MAC: {answer.observedSecureMac ?? "Not submitted"}; access interface:{" "}
                          {answer.interface ?? "Not submitted"}. Mechanism: {answer.reason ?? "Not submitted"}.
                        </p>
                      )}
                      {isHsrp && (
                        <p>
                          Initial observed HSRP priority: {answer.observedHsrpPriority ?? "Not submitted"}; interface{" "}
                          {answer.interface ?? "Not submitted"}; group {answer.observedGroup ?? "Not submitted"}.{" "}
                          {hsrpReasons.find(([id]) => id === answer.reason)?.[1]}
                        </p>
                      )}
                      {isNextHop && <p>Observed next hop: {answer.observedNextHop ?? "Not submitted"}</p>}
                      {isStp && (
                        <p>
                          Initial observed base priority: {answer.observedPriority ?? "Not submitted"}; VLAN{" "}
                          {answer.observedVlan ?? "Not submitted"}.{" "}
                          {stpReasons.find(([id]) => id === answer.reason)?.[1]}
                        </p>
                      )}
                      {isTrial && (
                        <details className="solution">
                          <summary>Recorded configuration changes</summary>
                          {attempt.repairs?.length ? (
                            <ol>
                              {attempt.repairs.map((change, index) => (
                                <li key={index}>
                                  Version {index + 1}: {repairDescription(change)}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p>No configuration changes recorded.</p>
                          )}
                        </details>
                      )}
                      <details className="solution" open={!isTrial || attempt.revealed}>
                        <summary>Worked repair & verification</summary>
                        <pre>{attempt.feedback.solution}</pre>
                      </details>
                      <button
                        className="secondary"
                        onClick={() =>
                          void task(async () => {
                            const original = await getPack();
                            setPreview(repairPreview(original));
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
                      {isEtherChannel && (
                        <EtherChannelRepair
                          attempt={attempt}
                          disabled={disabled}
                          onApply={applyRepair}
                          onInspect={() => setTab("inspect")}
                        />
                      )}
                      {isAcl && (
                        <AclRepair
                          attempt={attempt}
                          disabled={disabled}
                          onApply={applyRepair}
                          onInspect={() => setTab("inspect")}
                        />
                      )}
                      {isStp && (
                        <>
                          <StpRepair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <StpDiagnosis answer={answer} onChange={editAnswer} />
                        </>
                      )}
                      {isHsrp && (
                        <>
                          <HsrpRepair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <HsrpDiagnosis answer={answer} onChange={editAnswer} />
                        </>
                      )}
                      {isNat && (
                        <>
                          <NatRepair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <NatDiagnosis attempt={attempt} answer={answer} onChange={editAnswer} />
                        </>
                      )}
                      {isIpv6 && (
                        <>
                          <Ipv6Repair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <Ipv6Diagnosis answer={answer} onChange={editAnswer} />
                        </>
                      )}
                      {isGre && (
                        <>
                          <GreRepair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <GreDiagnosis attempt={attempt} answer={answer} onChange={editAnswer} />
                        </>
                      )}
                      {isPortSecurity && (
                        <>
                          <PortSecurityRepair
                            attempt={attempt}
                            disabled={disabled}
                            onApply={applyRepair}
                            onInspect={() => setTab("inspect")}
                          />
                          <PortSecurityDiagnosis attempt={attempt} answer={answer} onChange={editAnswer} />
                        </>
                      )}
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
                          {singleDeviceFault ? "02 / Device with the fault" : "02 / Affected adjacency endpoints"}
                        </legend>
                        <p className="muted">
                          {singleDeviceFault
                            ? "Choose the device containing the incorrect configuration."
                            : isEtherChannel
                              ? "Choose the switches participating in the failed relationship."
                              : "Choose the two routers whose intended adjacency fails."}
                        </p>
                        <div className="device-checks">
                          {lab.devices
                            .filter((d) => singleDeviceFault || d.kind === (isEtherChannel ? "switch" : "router"))
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
                      {isAcl && (
                        <>
                          <label htmlFor="acl-interface-answer">Affected outbound interface</label>
                          <select
                            id="acl-interface-answer"
                            required
                            value={answer.interface ?? ""}
                            onChange={(e) => editAnswer({ interface: e.target.value })}
                          >
                            <option value="" disabled>
                              Select the interface you observed
                            </option>
                            <option>Gi0/0</option>
                            <option>Gi0/1</option>
                          </select>
                          <label htmlFor="acl-name-answer">Observed ACL name</label>
                          <input
                            id="acl-name-answer"
                            required
                            maxLength={32}
                            autoCapitalize="none"
                            autoComplete="off"
                            value={answer.aclName ?? ""}
                            onChange={(e) => editAnswer({ aclName: e.target.value })}
                          />
                          <label htmlFor="acl-sequence-answer">Initial first-matching sequence</label>
                          <input
                            id="acl-sequence-answer"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={999}
                            required
                            value={answer.observedSequence ?? ""}
                            onChange={(e) =>
                              editAnswer({ observedSequence: e.target.value ? Number(e.target.value) : undefined })
                            }
                          />
                          <label htmlFor="acl-reason-answer">Why does the correction work?</label>
                          <select
                            id="acl-reason-answer"
                            required
                            value={answer.reason ?? ""}
                            onChange={(e) => editAnswer({ reason: e.target.value as Diagnosis["reason"] })}
                          >
                            <option value="" disabled>
                              Select a policy explanation
                            </option>
                            {aclReasons.map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      {isTimer && (
                        <>
                          <label htmlFor="timer-hello">Proposed Hello interval (seconds)</label>
                          <input
                            id="timer-hello"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={65535}
                            required
                            value={answer.hello ?? ""}
                            onChange={(e) => editAnswer({ hello: e.target.value ? Number(e.target.value) : undefined })}
                          />
                          <label htmlFor="timer-dead">Proposed Dead interval (seconds)</label>
                          <input
                            id="timer-dead"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={65535}
                            required
                            value={answer.dead ?? ""}
                            onChange={(e) => editAnswer({ dead: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </>
                      )}
                      {(isPassive || isTimer) && (
                        <>
                          <label htmlFor="ospf-interface-answer">Affected interface</label>
                          <select
                            id="ospf-interface-answer"
                            required
                            value={answer.interface ?? ""}
                            onChange={(e) => editAnswer({ interface: e.target.value })}
                          >
                            <option value="" disabled>
                              Select the interface you diagnosed
                            </option>
                            {["Gi0/0", "Gi0/1", "Ethernet0"].map((name) => (
                              <option key={name}>{name}</option>
                            ))}
                          </select>
                          <label htmlFor="ospf-reason-answer">Why does the correction work?</label>
                          <select
                            id="ospf-reason-answer"
                            required
                            value={answer.reason === "unspecified" ? "" : (answer.reason ?? "")}
                            onChange={(e) => editAnswer({ reason: e.target.value as Diagnosis["reason"] })}
                          >
                            <option value="" disabled>
                              Select a protocol explanation
                            </option>
                            {protocolReasons.map(([id, text]) => (
                              <option key={id} value={id}>
                                {text}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      {isRouting && (
                        <>
                          <label htmlFor="route-destination">
                            {isNextHop ? "Affected destination network (CIDR)" : "Missing destination network (CIDR)"}
                          </label>
                          <input
                            id="route-destination"
                            required
                            maxLength={64}
                            autoComplete="off"
                            value={answer.destinationNetwork ?? ""}
                            onChange={(e) => editAnswer({ destinationNetwork: e.target.value })}
                            placeholder="Network address / prefix length"
                          />
                          {isNextHop && (
                            <>
                              <label htmlFor="observed-next-hop">Observed incorrect next-hop IPv4 address</label>
                              <input
                                id="observed-next-hop"
                                required
                                maxLength={64}
                                inputMode="decimal"
                                autoComplete="off"
                                value={answer.observedNextHop ?? ""}
                                onChange={(e) => editAnswer({ observedNextHop: e.target.value })}
                              />
                            </>
                          )}
                          <label htmlFor="route-next-hop">Proposed next-hop IPv4 address</label>
                          <input
                            id="route-next-hop"
                            required
                            maxLength={64}
                            inputMode="decimal"
                            autoComplete="off"
                            value={answer.nextHop ?? ""}
                            onChange={(e) => editAnswer({ nextHop: e.target.value })}
                            placeholder="Enter the adjacent router address"
                          />
                          <label htmlFor="route-reason">Why does the correction work?</label>
                          <select
                            id="route-reason"
                            required
                            value={answer.reason === "unspecified" ? "" : (answer.reason ?? "")}
                            onChange={(e) => editAnswer({ reason: e.target.value as Diagnosis["reason"] })}
                          >
                            <option value="" disabled>
                              Select a forwarding explanation
                            </option>
                            {routingReasons.map(([id, text]) => (
                              <option key={id} value={id}>
                                {text}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
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
                      {isEtherChannel && (
                        <>
                          <label htmlFor="lacp-reason">Why does the correction work?</label>
                          <select
                            id="lacp-reason"
                            required
                            value={answer.reason ?? ""}
                            onChange={(e) => editAnswer({ reason: e.target.value as Diagnosis["reason"] })}
                          >
                            <option value="" disabled>
                              Select a mechanism
                            </option>
                            {etherChannelReasons.map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
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
                            {isIpv6
                              ? "Preserve original host configuration and route views, router configuration and interface state, local next-hop controls and the failed remote exchange. After a trial, collect fresh router configuration/state, both host route views and local plus reciprocal remote probes. A local reply alone is not transit proof."
                              : isGre
                                ? "Before a trial, retain physical-source pings to the configured and intended outer endpoints, both endpoint configurations and routes, local tunnel state and the failed service observation. After the latest change, select fresh tunnel configuration and routes, explicitly Tunnel0-sourced probes to the remote logical addresses, and both PC service directions. Route presence or local up/up alone is not delivery proof."
                                : isPortSecurity
                                  ? "Retain original NIC/registration, physical/VLAN/policy views, router routes, failed local probe and remote gateway control. After the latest trial select PC-A ipconfig /all; switch running-config, secure address, interface security, status and VLAN; PC-A gateway ping then ARP; reciprocal host pings; and PC-B gateway ping. Configuration alone does not prove service."
                                  : isHsrp
                                    ? "Preserve original roles, configuration and client gateway observations. After changing configuration, compare fresh complementary roles, virtual resolution and reciprocal delivery with the approved design. Ping alone cannot establish the intended Active member."
                                    : isStp
                                      ? "Preserve initial configuration and role observations. After a trial, verify the intended root and tree with fresh switch views and reciprocal host pings. A successful ping alone cannot prove the design."
                                      : isAcl
                                        ? "Preserve initial host/failure, both routes and policy/attachment evidence. After your latest trial select both policy views, successful host pings in both directions and an explicitly sourced excluded control that remains denied."
                                        : isEtherChannel
                                          ? "Preserve initial host, physical, logical and negotiation evidence. After your change, select fresh logical status on both switches and host pings in both directions."
                                          : isPassive || isTimer
                                            ? "Combine the observed configuration with physical interface state, neighbor relationships and routing impact. A missing neighbor or failed ping alone cannot identify the cause."
                                            : isRouting
                                              ? isNextHop
                                                ? "Map the installed route to its adjacent router and compare onward forwarding and interface evidence. A failed ping alone cannot prove the cause."
                                                : "Combine both routing tables with the source host's IP configuration. Failed ping alone cannot prove which route is missing."
                                              : isVlan
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
                          isPassive || isTimer
                            ? "Which observation distinguished this configuration fault from other neighbor failures? What did a successful connected ping prove?"
                            : isRouting
                              ? isNextHop
                                ? "Which consecutive forwarding decisions explain the failure? Why can an installed route still be wrong?"
                                : "What first suggested a return-path problem? Which entry was missing? Why did local ping not prove end-to-end connectivity?"
                              : isVlan
                                ? "What first suggested a Layer 2 problem? Why suspect IP settings? What would you check first next time?"
                                : "What did you rule out, and why?"
                        }
                        onChange={(e) => editAnswer({ notes: e.target.value })}
                      />
                      <p className="muted">
                        Grading uses the selected cause,{" "}
                        {isPortSecurity
                          ? "switch/interface, initial secure MAC and evidence, applied minimal correction, mechanism and fresh verification with retained policy"
                          : isHsrp
                            ? "member/interface/group, initial priority and evidence, applied design correction and fresh verification"
                            : isStp
                              ? "bridge/VLAN, initial priority evidence, applied design correction and fresh tree verification"
                              : isAcl
                                ? "device/interface, observed ACL/sequence, initial evidence, applied policy-preserving repair and fresh permitted/denied controls"
                                : isPassive || isTimer
                                  ? "router, interface, observed command evidence, targeted repair and protocol explanation"
                                  : isRouting
                                    ? "device, destination prefix, observed configuration, next hop, command evidence and forwarding explanation"
                                    : isVlan
                                      ? "device, interface, observed VLAN, command evidence and intended access-port configuration"
                                      : isGateway
                                        ? "device, command evidence, gateway address and forwarding explanation"
                                        : isIpv6
                                          ? "initial IPv6 configuration, affected device, authentic evidence, applied correction and fresh reciprocal verification"
                                          : isGre
                                            ? "outer destination, device/interface, original evidence, applied minimal repair and fresh layered verification"
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
            <AcademyView
              initialReferences={academyReferences}
              onLab={(id) => {
                if (locked) return;
                back();
                setChosenLab(id);
                setTarget(catalog(id).target);
                setMode("practice");
              }}
            />
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
