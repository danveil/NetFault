"use client";
import { useState } from "react";
import type { Attempt, RepairAction } from "@/lib/schema";
export default function EtherChannelRepair({
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
    [group, setGroup] = useState(""),
    [mode, setMode] = useState("");
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Inspect and select initial evidence first. This control applies a group-wide LACP mode to its existing members;
        it is not an IOS terminal. Then return to Inspect and gather fresh verification. No change is applied by
        selecting an option alone.
      </p>
      <label htmlFor="repair-switch">Switch to configure</label>
      <select id="repair-switch" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a switch</option>
        <option>SW1</option>
        <option>SW2</option>
      </select>
      <label htmlFor="repair-group">Local channel-group number</label>
      <input
        id="repair-group"
        inputMode="numeric"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        maxLength={3}
        placeholder="From your observations"
      />
      <label htmlFor="repair-mode">LACP mode to apply</label>
      <select id="repair-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="">Choose a mode</option>
        <option value="passive">passive</option>
        <option value="active">active</option>
      </select>
      <p className="muted">
        Changes only the existing group’s member negotiation mode. VLAN, physical state and standalone policy stay as
        inspected.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !/^[1-9]\d{0,2}$/.test(group) || Number(group) > 128 || !mode}
        onClick={() => onApply({ device, group: Number(group), mode: mode as RepairAction["mode"] })}
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
          {attempt.repairs.map((change, index) => (
            <li key={index}>
              Version {index + 1}: {change.device}, channel-group {change.group}, mode {change.mode}
            </li>
          ))}
        </ol>
      )}
      <p className="muted">
        At most 10 actual changes and 100 diagnostic commands per attempt. Reapplying the current state does not create
        a new version. Configuration history is saved with your journal.
      </p>
    </fieldset>
  );
}
