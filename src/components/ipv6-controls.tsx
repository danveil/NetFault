"use client";
import { useState } from "react";
import type { Attempt, Diagnosis, RepairAction } from "@/lib/schema";
import { ipv6Reasons } from "@/lib/catalog";
import { normalize6, global6 } from "@/lib/ipv6-address";
import { repairDescription } from "@/lib/repair-trial";
export function observedIpv6(attempt: Attempt) {
  return [
    ...new Set(
      attempt.history.flatMap((o) =>
        (o.output.match(/[0-9a-fA-F]*:[0-9a-fA-F:]+/g) ?? [])
          .map(normalize6)
          .filter((v): v is string => !!v && global6(v)),
      ),
    ),
  ];
}
export function Ipv6Diagnosis({ answer, onChange }: { answer: Diagnosis; onChange: (c: Partial<Diagnosis>) => void }) {
  return (
    <>
      <label htmlFor="ipv6-observed">Initial observed IPv6 forwarding setting</label>
      <select
        id="ipv6-observed"
        required
        value={answer.observedForwarding === undefined ? "" : String(answer.observedForwarding)}
        onChange={(e) =>
          onChange({ observedForwarding: e.target.value === "" ? undefined : e.target.value === "true" })
        }
      >
        <option value="">Choose the observed state</option>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
      <label htmlFor="ipv6-proposed">Proposed IPv6 forwarding setting</label>
      <select
        id="ipv6-proposed"
        required
        value={answer.forwarding === undefined ? "" : String(answer.forwarding)}
        onChange={(e) => onChange({ forwarding: e.target.value === "" ? undefined : e.target.value === "true" })}
      >
        <option value="">Choose the proposed state</option>
        <option value="false">Disabled</option>
        <option value="true">Enabled</option>
      </select>
      <label htmlFor="ipv6-reason">Why does the correction work?</label>
      <select
        id="ipv6-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="">Choose a mechanism</option>
        {ipv6Reasons.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default function Ipv6Repair({
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
    [enabled, setEnabled] = useState("");
  const routers = [
    ...new Set(
      attempt.history
        .filter((o) => o.command === "show running-config" && !o.output.startsWith("%"))
        .map((o) => o.device),
    ),
  ];
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Preserve initial observations. This trial changes only a router&apos;s IPv6 forwarding setting. It does not
        alter addresses, host next hops or cables.
      </p>
      <label htmlFor="ipv6-repair-device">Observed router</label>
      <select id="ipv6-repair-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Inspect configuration first</option>
        {routers.map((id) => (
          <option key={id}>{id}</option>
        ))}
      </select>
      <label htmlFor="ipv6-repair-state">Trial IPv6 forwarding setting</label>
      <select id="ipv6-repair-state" value={enabled} onChange={(e) => setEnabled(e.target.value)}>
        <option value="">Choose a trial state</option>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !enabled}
        onClick={() => onApply({ kind: "ipv6-forwarding", device, enabled: enabled === "true" })}
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
    </fieldset>
  );
}
