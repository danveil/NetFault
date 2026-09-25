"use client";
import { useState } from "react";
import type { Attempt, RepairAction, Diagnosis } from "@/lib/schema";
import { repairDescription } from "@/lib/repair-trial";
import { stpReasons } from "@/lib/catalog";
const priorities = Array.from({ length: 16 }, (_, n) => n * 4096);
export function StpDiagnosis({
  answer,
  onChange,
}: {
  answer: Diagnosis;
  onChange: (change: Partial<Diagnosis>) => void;
}) {
  return (
    <>
      <label htmlFor="stp-observed">Initial observed base priority</label>
      <select
        id="stp-observed"
        required
        value={answer.observedPriority ?? ""}
        onChange={(e) => onChange({ observedPriority: Number(e.target.value) })}
      >
        <option value="" disabled>
          Select the observed setting
        </option>
        {priorities.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <label htmlFor="stp-instance">Affected VLAN instance</label>
      <select
        id="stp-instance"
        required
        value={answer.observedVlan ?? ""}
        onChange={(e) => onChange({ observedVlan: Number(e.target.value) })}
      >
        <option value="" disabled>
          Choose an instance
        </option>
        <option value="10">VLAN 10</option>
      </select>
      <label htmlFor="stp-reason">Why does the correction work?</label>
      <select
        id="stp-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="" disabled>
          Choose the mechanism
        </option>
        {stpReasons.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </>
  );
}
export default function StpRepair({
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
        Preserve initial observations. Apply a bridge-priority trial, then inspect the recomputed settled tree. All
        physical cables remain connected. No convergence timing is simulated.
      </p>
      <label htmlFor="stp-device">Switch to configure</label>
      <select id="stp-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a switch</option>
        {["SW1", "SW2", "SW3"].map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <label htmlFor="stp-priority">New base priority · VLAN 10</label>
      <select id="stp-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="">Choose a priority</option>
        {priorities.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <p className="muted">
        {device && priority !== ""
          ? `${device}: spanning-tree vlan 10 priority ${priority}`
          : "Choose the device and proposed priority using your observations."}
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || priority === ""}
        onClick={() => onApply({ kind: "stp-priority", device, vlan: 10, priority: Number(priority) })}
      >
        Apply configuration change
      </button>
      <button type="button" className="text-button" onClick={onInspect}>
        Inspect and verify current state
      </button>
      <p role="status">
        {attempt.repairs?.length
          ? `Current configuration version ${attempt.repairs.length}. Select fresh outputs from this version before final submission.`
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
        At most 10 actual changes and 100 commands. Reapplying the current value creates no version. Restore a previous
        value to undo a trial.
      </p>
    </fieldset>
  );
}
