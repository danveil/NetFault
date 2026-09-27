"use client";
import { useState } from "react";
import type { Attempt, Diagnosis, RepairAction } from "@/lib/schema";
import { normalizeMac } from "@/lib/port-security";
import { repairDescription } from "@/lib/repair-trial";
import { portSecurityReasons } from "@/lib/catalog";
function candidates(attempt: Attempt) {
  return [
    ...new Set(
      attempt.history.flatMap((o) =>
        (o.output.match(/\b[0-9a-f]{4}(?:\.[0-9a-f]{4}){2}\b/gi) ?? [])
          .map(normalizeMac)
          .filter((m): m is string => !!m),
      ),
    ),
  ];
}
const ports = ["FastEthernet0/1", "FastEthernet0/24"];
export function PortSecurityDiagnosis({
  answer,
  onChange,
  attempt,
}: {
  answer: Diagnosis;
  onChange: (change: Partial<Diagnosis>) => void;
  attempt: Attempt;
}) {
  return (
    <>
      <label htmlFor="secure-observed">Initial observed static secure MAC</label>
      <select
        id="secure-observed"
        required
        value={answer.observedSecureMac ?? ""}
        onChange={(e) => onChange({ observedSecureMac: e.target.value })}
      >
        <option value="" disabled>
          Choose from recorded observations
        </option>
        {candidates(attempt).map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <label htmlFor="secure-interface-answer">Affected access interface</label>
      <select
        id="secure-interface-answer"
        required
        value={answer.interface ?? ""}
        onChange={(e) => onChange({ interface: e.target.value })}
      >
        <option value="" disabled>
          Choose an interface
        </option>
        {ports.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <label htmlFor="secure-reason">Why does the correction work?</label>
      <select
        id="secure-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="" disabled>
          Choose the mechanism
        </option>
        {portSecurityReasons.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default function PortSecurityRepair({
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
    [port, setPort] = useState(""),
    [mac, setMac] = useState("");
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Preserve original evidence. Replace one existing static secure slot, then verify the current configuration and
        communication. The enabled state, maximum, protect mode, VLAN and endpoint identity stay unchanged.
      </p>
      <label htmlFor="secure-device">Switch to configure</label>
      <select id="secure-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a switch</option>
        <option>SW1</option>
      </select>
      <label htmlFor="secure-port">Access port to configure</label>
      <select id="secure-port" value={port} onChange={(e) => setPort(e.target.value)}>
        <option value="">Choose an access port</option>
        {ports.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <label htmlFor="secure-mac">Replacement static secure MAC</label>
      <select id="secure-mac" value={mac} onChange={(e) => setMac(e.target.value)}>
        <option value="">Choose from recorded observations</option>
        {candidates(attempt).map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <p className="muted">
        Candidates come only from your recorded command outputs. Inspect endpoint identity and switch registration;
        inclusion here does not mean a value is correct.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !port || !mac}
        onClick={() => onApply({ kind: "port-security-mac", device, interface: port, mac })}
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
        At most 10 actual changes and 100 commands. Repeating a value creates no version. Each actual edit starts an
        empty simulated ARP observation epoch; probe again. This atomic replacement does not model an IOS editing
        interval, dynamic learning or real cache flushing.
      </p>
    </fieldset>
  );
}
