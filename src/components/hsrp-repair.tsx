"use client";
import { useState } from "react";
import type { Attempt, Diagnosis, RepairAction } from "@/lib/schema";
import { repairDescription } from "@/lib/repair-trial";
import { hsrpReasons } from "@/lib/catalog";
const priorities = Array.from({ length: 256 }, (_, n) => n);
export function HsrpDiagnosis({
  answer,
  onChange,
}: {
  answer: Diagnosis;
  onChange: (change: Partial<Diagnosis>) => void;
}) {
  return (
    <>
      <label htmlFor="hsrp-observed">Initial observed HSRP priority</label>
      <select
        id="hsrp-observed"
        required
        value={answer.observedHsrpPriority ?? ""}
        onChange={(e) => onChange({ observedHsrpPriority: Number(e.target.value) })}
      >
        <option value="" disabled>
          Select the observed priority
        </option>
        {priorities.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <label htmlFor="hsrp-interface-answer">Affected participating interface</label>
      <select
        id="hsrp-interface-answer"
        required
        value={answer.interface ?? ""}
        onChange={(e) => onChange({ interface: e.target.value })}
      >
        <option value="" disabled>
          Select an interface
        </option>
        {["Gi0/0", "Gi0/1", "Gi0/2"].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <label htmlFor="hsrp-group-answer">Observed HSRP group</label>
      <select
        id="hsrp-group-answer"
        required
        value={answer.observedGroup ?? ""}
        onChange={(e) => onChange({ observedGroup: Number(e.target.value) })}
      >
        <option value="" disabled>
          Select a group
        </option>
        {[0, 1, 10, 11, 20].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <label htmlFor="hsrp-reason">Why does the correction work?</label>
      <select
        id="hsrp-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="" disabled>
          Choose the mechanism
        </option>
        {hsrpReasons.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default function HsrpRepair({
  attempt,
  disabled,
  onApply,
  onInspect,
}: {
  attempt: Attempt;
  disabled: boolean;
  onApply: (change: RepairAction) => void;
  onInspect: () => void;
}) {
  const [device, setDevice] = useState(""),
    [priority, setPriority] = useState("");
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Preserve initial observations. Change one member priority, then inspect the settled roles and delivery. Group,
        virtual IP, preemption and routing remain unchanged. Equal priorities are outside this bounded model.
      </p>
      <label htmlFor="hsrp-device">Router to configure</label>
      <select id="hsrp-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a router</option>
        {["R1", "R2"].map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <label htmlFor="hsrp-priority">New HSRP priority · Gi0/0 · group 11</label>
      <select id="hsrp-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="">Choose a priority</option>
        {priorities.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <p className="muted">
        {device && priority !== ""
          ? `${device}: interface Gi0/0 → standby 11 priority ${priority}`
          : "Choose using your observations and the approved design."}
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || priority === ""}
        onClick={() =>
          onApply({ kind: "hsrp-priority", device, interface: "Gi0/0", group: 11, priority: Number(priority) })
        }
      >
        Apply configuration change
      </button>
      <button type="button" className="text-button" onClick={onInspect}>
        Inspect and verify current state
      </button>
      <p role="status">
        {attempt.repairs?.length
          ? `Current configuration version ${attempt.repairs.length}. Gather fresh evidence from this version.`
          : "Initial configuration. No change recorded."}
      </p>
      {!!attempt.repairs?.length && (
        <ol>
          {attempt.repairs.map((r, n) => (
            <li key={n}>
              Version {n + 1}: {repairDescription(r)}
            </li>
          ))}
        </ol>
      )}
      <p className="muted">
        At most 10 actual changes and 100 commands. An unchanged effective priority creates no version. After an actual
        change, the simulated ARP observation history starts empty; probe again. This is an observation reset, not a
        claim about real HSRP cache flushing.
      </p>
    </fieldset>
  );
}
