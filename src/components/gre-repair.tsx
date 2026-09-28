"use client";
import { useState } from "react";
import type { Attempt, Diagnosis, RepairAction } from "@/lib/schema";
import { greReasons } from "@/lib/catalog";
import { repairDescription } from "@/lib/repair-trial";
export function observedAddresses(attempt: Attempt) {
  return [...new Set(attempt.history.flatMap((o) => o.output.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? []))];
}
function Address({
  id,
  label,
  value,
  set,
  attempt,
  editable = false,
}: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  attempt: Attempt;
  editable?: boolean;
}) {
  return (
    <div className="nat-address-card">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} required={!editable}>
        <option value="">Choose from recorded observations</option>
        {[...new Set([...observedAddresses(attempt), ...(value ? [value] : [])])].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      {editable && (
        <details>
          <summary>Enter another IPv4 value</summary>
          <label htmlFor={`${id}-custom`}>Custom destination</label>
          <input
            id={`${id}-custom`}
            inputMode="decimal"
            maxLength={32}
            value={value}
            onChange={(e) => set(e.target.value.trim())}
          />
        </details>
      )}
    </div>
  );
}
export function GreDiagnosis({
  attempt,
  answer,
  onChange,
}: {
  attempt: Attempt;
  answer: Diagnosis;
  onChange: (c: Partial<Diagnosis>) => void;
}) {
  return (
    <>
      <label htmlFor="gre-interface-answer">Affected logical interface</label>
      <select
        id="gre-interface-answer"
        required
        value={answer.interface ?? ""}
        onChange={(e) => onChange({ interface: e.target.value })}
      >
        <option value="">Choose an interface</option>
        <option>Tunnel0</option>
      </select>
      <Address
        id="gre-observed"
        label="Initial observed tunnel destination"
        value={answer.observedDestination ?? ""}
        set={(v) => onChange({ observedDestination: v })}
        attempt={attempt}
      />
      <Address
        id="gre-proposed"
        label="Proposed tunnel destination"
        value={answer.tunnelDestination ?? ""}
        set={(v) => onChange({ tunnelDestination: v })}
        attempt={attempt}
      />
      <label htmlFor="gre-reason">Why does the correction work?</label>
      <select
        id="gre-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="">Choose a mechanism</option>
        {greReasons.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default function GreRepair({
  attempt,
  disabled,
  onApply,
  onInspect,
}: {
  attempt: Attempt;
  disabled: boolean;
  onApply: (c: RepairAction) => void;
  onInspect: () => void;
}) {
  const [device, setDevice] = useState(""),
    [intf, setInterface] = useState(""),
    [destination, setDestination] = useState("");
  const routers = [
    ...new Set(
      attempt.history
        .filter((o) => o.output.includes("tunnel source ") || o.command === "show interfaces tunnel 0")
        .map((o) => o.device),
    ),
  ];
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Keep original evidence. Change only an existing tunnel destination. Its source, logical address, physical
        addressing and routes remain unchanged.
      </p>
      <label htmlFor="gre-device">Router to configure</label>
      <select id="gre-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose an observed endpoint</option>
        {routers.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <label htmlFor="gre-interface">Tunnel to configure</label>
      <select id="gre-interface" value={intf} onChange={(e) => setInterface(e.target.value)}>
        <option value="">Choose a tunnel</option>
        <option>Tunnel0</option>
      </select>
      <Address
        id="gre-replacement"
        label="Replacement tunnel destination"
        value={destination}
        set={setDestination}
        attempt={attempt}
        editable
      />
      <p className="muted">
        Candidates come from recorded outputs; inclusion does not mean correctness. Compare the outer source and
        destination at both endpoints.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !intf || !destination}
        onClick={() => onApply({ kind: "gre-destination", device, interface: "Tunnel0", destination })}
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
        At most 10 actual changes and 100 commands. An effective no-op creates no new version. Local up/up is not proof
        of remote delivery.
      </p>
    </fieldset>
  );
}
